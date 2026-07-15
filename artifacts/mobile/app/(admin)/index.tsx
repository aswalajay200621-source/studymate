import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getApiBase } from "@/utils/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Semester {
  id: string;
  name: string;
  college: string;
  orderIndex: number;
}
interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  semesterId: string | null;
  college: string;
  description: string;
  color: string;
  icon: string;
}
interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  orderIndex: number;
}

// ─── API hook ─────────────────────────────────────────────────────────────────
function useAdminToken(sessionToken: string | null) {
  const [adminToken, setAdminToken] = useState<string | null>(sessionToken);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionToken && !adminToken) setAdminToken(sessionToken);
  }, [sessionToken, adminToken]);

  const login = useCallback(async (password: string) => {
    setTokenLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(`${getApiBase()}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "HAPPINESSAB", password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setAdminToken(data.token);
      } else {
        setLoginError(data.error ?? "Invalid password");
      }
    } catch {
      setLoginError("Could not reach the server. Check your connection.");
    } finally {
      setTokenLoading(false);
    }
  }, []);

  const adminFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      if (!adminToken) throw new Error("Not authenticated");
      const res = await fetch(`${getApiBase()}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
          ...(options.headers ?? {}),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? `Error ${res.status}`);
      }
      if (res.status === 204) return null;
      return res.json();
    },
    [adminToken]
  );

  return { adminToken, tokenLoading, loginError, login, adminFetch };
}

// ─── Modal types ──────────────────────────────────────────────────────────────
type ModalMode =
  | { kind: "semester" }
  | { kind: "subject"; semesterId: string; semesterName: string }
  | { kind: "chapter"; subjectId: string; subjectName: string };

// ─── Chevron icon that animates ───────────────────────────────────────────────
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <Feather
      name={open ? "chevron-down" : "chevron-right"}
      size={16}
      color="#64748B"
    />
  );
}

// ─── Main admin dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { logout, token: sessionToken } = useAuth();
  const insets = useSafeAreaInsets();
  const { adminToken, tokenLoading, loginError, login, adminFetch } =
    useAdminToken(sessionToken);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // chapters per subject: { [subjectId]: Chapter[] }
  const [chapterMap, setChapterMap] = useState<Record<string, Chapter[]>>({});

  // which semesters are expanded
  const [openSemesters, setOpenSemesters] = useState<Record<string, boolean>>({});
  // which subjects are expanded (showing chapters)
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // upload state
  const [uploadingChapterId, setUploadingChapterId] = useState<string | null>(null);

  // modal
  const [modal, setModal] = useState<ModalMode | null>(null);
  const [saving, setSaving] = useState(false);

  // form states
  const [semForm, setSemForm] = useState({ id: "", name: "", college: "CSE", orderIndex: "1" });
  const [subForm, setSubForm] = useState({
    id: "", name: "", code: "", semester: "1",
    college: "CSE", description: "", color: "#4361EE", icon: "book",
  });
  const [chapForm, setChapForm] = useState({ id: "", title: "", orderIndex: "1" });
  const [chapHtmlContent, setChapHtmlContent] = useState("");
  const [chapHtmlFileName, setChapHtmlFileName] = useState("");

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [semsData, subsData] = await Promise.all([
        adminFetch("/admin/semesters"),
        adminFetch("/admin/subjects"),
      ]);
      setSemesters(semsData ?? []);
      setSubjects(subsData ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [adminToken, adminFetch]);

  useEffect(() => {
    if (adminToken) loadData();
  }, [adminToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Load chapters for a subject ─────────────────────────────────────────────
  async function loadChapters(subjectId: string) {
    try {
      const data = await adminFetch(`/admin/subjects/${subjectId}/chapters`);
      setChapterMap((prev) => ({ ...prev, [subjectId]: data ?? [] }));
    } catch {}
  }

  // ── Toggle semester expansion ────────────────────────────────────────────────
  function toggleSemester(semId: string) {
    setOpenSemesters((prev) => ({ ...prev, [semId]: !prev[semId] }));
  }

  // ── Toggle subject expansion (load chapters on first open) ──────────────────
  function toggleSubject(subId: string) {
    const willOpen = !openSubjects[subId];
    setOpenSubjects((prev) => ({ ...prev, [subId]: willOpen }));
    if (willOpen && !chapterMap[subId]) {
      loadChapters(subId);
    }
  }

  // ── File picker ─────────────────────────────────────────────────────────────
  function pickHtmlFile(onRead: (content: string, name: string) => void) {
    if (Platform.OS !== "web") {
      Alert.alert("Not supported", "HTML upload is only available on web.");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html,text/html";
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        onRead(content, file.name);
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ── Upload HTML directly to an existing chapter ─────────────────────────────
  async function handleUploadHtmlToChapter(chapterId: string, chapterTitle: string, subjectId: string) {
    pickHtmlFile(async (content, fileName) => {
      setUploadingChapterId(chapterId);
      try {
        await adminFetch(`/admin/chapters/${chapterId}`, {
          method: "PUT",
          body: JSON.stringify({ contentHtml: content }),
        });
        Alert.alert("✅ Success", `HTML uploaded to "${chapterTitle}" (${fileName})`);
        await loadChapters(subjectId);
      } catch (err: any) {
        Alert.alert("Upload Failed", err.message ?? "Failed to upload HTML");
      } finally {
        setUploadingChapterId(null);
      }
    });
  }

  // ── Open modal ──────────────────────────────────────────────────────────────
  function openSemesterModal() {
    setSemForm({ id: "", name: "", college: "CSE", orderIndex: String(semesters.length + 1) });
    setModal({ kind: "semester" });
  }

  function openSubjectModal(semesterId: string, semesterName: string, semNum: number) {
    setSubForm({
      id: "", name: "", code: "",
      semester: String(semNum),
      college: "CSE", description: "", color: "#4361EE", icon: "book",
    });
    setModal({ kind: "subject", semesterId, semesterName });
  }

  function openChapterModal(subjectId: string, subjectName: string, subjectChapCount: number) {
    setChapForm({ id: "", title: "", orderIndex: String(subjectChapCount + 1) });
    setChapHtmlContent("");
    setChapHtmlFileName("");
    setModal({ kind: "chapter", subjectId, subjectName });
  }

  // ── Save handler ────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.kind === "semester") {
        if (!semForm.id || !semForm.name) throw new Error("ID and Name are required");
        await adminFetch("/admin/semesters", {
          method: "POST",
          body: JSON.stringify({
            id: semForm.id.trim(),
            name: semForm.name.trim(),
            college: semForm.college,
            orderIndex: semForm.orderIndex,
          }),
        });
        await loadData();
      } else if (modal.kind === "subject") {
        if (!subForm.id || !subForm.name || !subForm.code)
          throw new Error("ID, Name and Code are required");
        await adminFetch("/admin/subjects", {
          method: "POST",
          body: JSON.stringify({
            id: subForm.id.trim(),
            name: subForm.name.trim(),
            code: subForm.code.trim().toUpperCase(),
            semester: subForm.semester,
            semesterId: modal.semesterId,
            college: subForm.college,
            description: subForm.description,
            color: subForm.color,
            icon: subForm.icon,
          }),
        });
        await loadData();
      } else {
        // chapter
        if (!chapForm.title) throw new Error("Chapter title is required");
        const id = chapForm.id.trim() || `chap-${Date.now()}`;
        await adminFetch("/admin/chapters", {
          method: "POST",
          body: JSON.stringify({
            id,
            subjectId: modal.subjectId,
            title: chapForm.title.trim(),
            orderIndex: chapForm.orderIndex,
            ...(chapHtmlContent ? { contentHtml: chapHtmlContent } : {}),
          }),
        });
        await loadChapters(modal.subjectId);
      }
      setModal(null);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete handlers ─────────────────────────────────────────────────────────
  function handleDeleteSemester(id: string, name: string) {
    Alert.alert("Delete Semester", `Delete "${name}"? All subjects and chapters inside will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await adminFetch(`/admin/semesters/${id}`, { method: "DELETE" });
            await loadData();
          } catch (err: any) { Alert.alert("Error", err.message); }
        },
      },
    ]);
  }

  function handleDeleteSubject(id: string, name: string) {
    Alert.alert("Delete Subject", `Delete "${name}"? Chapters will also be deleted.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await adminFetch(`/admin/subjects/${id}`, { method: "DELETE" });
            await loadData();
            setChapterMap((prev) => { const n = { ...prev }; delete n[id]; return n; });
          } catch (err: any) { Alert.alert("Error", err.message); }
        },
      },
    ]);
  }

  function handleDeleteChapter(id: string, title: string, subjectId: string) {
    Alert.alert("Delete Chapter", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await adminFetch(`/admin/chapters/${id}`, { method: "DELETE" });
            await loadChapters(subjectId);
          } catch (err: any) { Alert.alert("Error", err.message); }
        },
      },
    ]);
  }

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const botPad = Platform.OS === "web" ? 0 : insets.bottom;

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!adminToken) {
    return (
      <View style={[s.root, { backgroundColor: "#0F172A" }]}>
        <LinearGradient
          colors={["#4361EE", "#7C3AED"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.loginHeader, { paddingTop: topPad + 20 }]}
        >
          <View style={s.loginIconBox}>
            <Text style={{ fontSize: 28 }}>📚</Text>
          </View>
          <Text style={s.loginTitle}>StudyMate Admin</Text>
          <Text style={s.loginSubtitle}>Enter your admin password to continue</Text>
        </LinearGradient>

        <View style={s.loginBody}>
          <View style={s.loginCard}>
            <Text style={s.loginLabel}>Password</Text>
            <View style={s.passwordRow}>
              <TextInput
                style={[s.fieldInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter admin password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={() => { if (password) login(password); }}
                returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {!!loginError && (
              <View style={s.errorBox}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={s.errorText}>{loginError}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => { if (password) login(password); }}
              disabled={tokenLoading || !password}
              style={[s.loginBtn, (!password || tokenLoading) && { opacity: 0.6 }]}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#4361EE", "#7C3AED"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.loginBtnGrad}
              >
                {tokenLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.loginBtnText}>Unlock Admin Panel</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
              <Feather name="arrow-left" size={14} color="#64748B" />
              <Text style={s.backLinkText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  const totalSubjects = subjects.length;
  const totalChapters = Object.values(chapterMap).reduce((a, c) => a + c.length, 0);

  return (
    <View style={[s.root, { backgroundColor: "#F1F5F9" }]}>
      {/* Header */}
      <LinearGradient
        colors={["#4361EE", "#7C3AED"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: topPad + 10 }]}
      >
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <View style={s.headerLogo}>
              <Text style={{ fontSize: 16 }}>📚</Text>
            </View>
            <Text style={s.headerTitle}>StudyMate Admin</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { val: semesters.length, label: "Semesters" },
            { val: totalSubjects, label: "Subjects" },
            { val: totalChapters, label: "Chapters" },
          ].map((st) => (
            <View key={st.label} style={s.statCard}>
              <Text style={s.statValue}>{st.val}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: botPad + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Section header */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Content Tree</Text>
          <TouchableOpacity onPress={openSemesterModal} style={s.addBtn}>
            <Feather name="plus" size={14} color="#fff" />
            <Text style={s.addBtnText}>New Semester</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color="#4361EE" />
          </View>
        ) : semesters.length === 0 ? (
          <View style={s.emptyState}>
            <Feather name="layers" size={44} color="#CBD5E1" />
            <Text style={s.emptyTitle}>No semesters yet</Text>
            <Text style={s.emptyText}>Tap "New Semester" above to get started</Text>
          </View>
        ) : (
          semesters.map((sem) => {
            const semSubjects = subjects.filter(
              (sub) => sub.semesterId === sem.id || String(sub.semester) === String(sem.orderIndex)
            );
            const isOpen = !!openSemesters[sem.id];

            return (
              <View key={sem.id} style={s.semBlock}>
                {/* ── Semester row ── */}
                <View style={s.semRow}>
                  <TouchableOpacity
                    onPress={() => toggleSemester(sem.id)}
                    style={s.semToggle}
                    activeOpacity={0.7}
                  >
                    <ChevronIcon open={isOpen} />
                    <View style={s.semIcon}>
                      <Feather name="layers" size={15} color="#4361EE" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.semName}>{sem.name}</Text>
                      <Text style={s.semMeta}>{sem.college} · {semSubjects.length} subject{semSubjects.length !== 1 ? "s" : ""}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Semester actions */}
                  <TouchableOpacity
                    onPress={() => openSubjectModal(sem.id, sem.name, sem.orderIndex)}
                    style={s.rowActionBtn}
                  >
                    <Feather name="plus" size={14} color="#4361EE" />
                    <Text style={s.rowActionText}>Subject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteSemester(sem.id, sem.name)}
                    style={s.rowDeleteBtn}
                  >
                    <Feather name="trash-2" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* ── Subjects (expanded) ── */}
                {isOpen && (
                  <View style={s.subjectsContainer}>
                    {semSubjects.length === 0 ? (
                      <View style={s.innerEmpty}>
                        <Feather name="book" size={18} color="#CBD5E1" />
                        <Text style={s.innerEmptyText}>No subjects — tap "+ Subject" to add one</Text>
                      </View>
                    ) : (
                      semSubjects.map((sub) => {
                        const chapters = chapterMap[sub.id] ?? [];
                        const subOpen = !!openSubjects[sub.id];

                        return (
                          <View key={sub.id} style={s.subBlock}>
                            {/* Subject row */}
                            <View style={s.subRow}>
                              <TouchableOpacity
                                onPress={() => toggleSubject(sub.id)}
                                style={s.subToggle}
                                activeOpacity={0.7}
                              >
                                <ChevronIcon open={subOpen} />
                                <View style={[s.subColorDot, { backgroundColor: sub.color }]} />
                                <View style={{ flex: 1 }}>
                                  <Text style={s.subName}>{sub.name}</Text>
                                  <Text style={s.subMeta}>
                                    {sub.code} · {subOpen ? `${chapters.length} chapter${chapters.length !== 1 ? "s" : ""}` : "tap to expand"}
                                  </Text>
                                </View>
                              </TouchableOpacity>

                              {/* Subject actions */}
                              <TouchableOpacity
                                onPress={() => openChapterModal(sub.id, sub.name, chapters.length)}
                                style={s.rowActionBtn}
                              >
                                <Feather name="file-plus" size={14} color="#4361EE" />
                                <Text style={s.rowActionText}>Chapter</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteSubject(sub.id, sub.name)}
                                style={s.rowDeleteBtn}
                              >
                                <Feather name="trash-2" size={14} color="#EF4444" />
                              </TouchableOpacity>
                            </View>

                            {/* ── Chapters (expanded) ── */}
                            {subOpen && (
                              <View style={s.chaptersContainer}>
                                {!chapterMap[sub.id] ? (
                                  <ActivityIndicator size="small" color="#4361EE" style={{ marginVertical: 10 }} />
                                ) : chapters.length === 0 ? (
                                  <View style={s.innerEmpty}>
                                    <Feather name="file-text" size={16} color="#CBD5E1" />
                                    <Text style={s.innerEmptyText}>No chapters — tap "+ Chapter" to add one</Text>
                                  </View>
                                ) : (
                                  chapters.map((ch) => (
                                    <View key={ch.id} style={s.chapRow}>
                                      <View style={s.chapIcon}>
                                        <Feather name="file-text" size={13} color="#7C3AED" />
                                      </View>
                                      <View style={{ flex: 1 }}>
                                        <Text style={s.chapTitle}>{ch.title}</Text>
                                        <Text style={s.chapMeta}>Order #{ch.orderIndex}</Text>
                                      </View>
                                      {/* Upload HTML button */}
                                      <TouchableOpacity
                                        onPress={() => handleUploadHtmlToChapter(ch.id, ch.title, sub.id)}
                                        style={s.uploadBtn}
                                        disabled={uploadingChapterId === ch.id}
                                      >
                                        {uploadingChapterId === ch.id
                                          ? <ActivityIndicator size="small" color="#4361EE" />
                                          : <>
                                            <Feather name="upload" size={13} color="#4361EE" />
                                            <Text style={s.uploadBtnText}>HTML</Text>
                                          </>
                                        }
                                      </TouchableOpacity>
                                      {/* Delete chapter */}
                                      <TouchableOpacity
                                        onPress={() => handleDeleteChapter(ch.id, ch.title, sub.id)}
                                        style={s.chapDeleteBtn}
                                      >
                                        <Feather name="trash-2" size={13} color="#EF4444" />
                                      </TouchableOpacity>
                                    </View>
                                  ))
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Modal ── */}
      <Modal
        visible={!!modal}
        animationType="slide"
        transparent
        onRequestClose={() => setModal(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            {/* Modal header */}
            <View style={s.modalHeader}>
              <View style={s.modalTitleRow}>
                <Feather
                  name={
                    modal?.kind === "semester" ? "layers" :
                    modal?.kind === "subject" ? "book" : "file-text"
                  }
                  size={18}
                  color="#4361EE"
                />
                <Text style={s.modalTitle}>
                  {modal?.kind === "semester" && "New Semester"}
                  {modal?.kind === "subject" && `New Subject — ${(modal as any).semesterName}`}
                  {modal?.kind === "chapter" && `New Chapter — ${(modal as any).subjectName}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Feather name="x" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* ── Semester form ── */}
              {modal?.kind === "semester" && (
                <>
                  <FormField label="ID (slug)" placeholder="e.g. sem-1-cse" value={semForm.id} onChange={(v) => setSemForm((f) => ({ ...f, id: v }))} />
                  <FormField label="Semester Name" placeholder="e.g. Semester 1" value={semForm.name} onChange={(v) => setSemForm((f) => ({ ...f, name: v }))} />
                  <View style={{ marginBottom: 14 }}>
                    <Text style={s.fieldLabel}>College</Text>
                    <View style={s.segRow}>
                      {["CSE", "EEE"].map((c) => (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setSemForm((f) => ({ ...f, college: c }))}
                          style={[s.segBtn, semForm.college === c && s.segBtnActive]}
                        >
                          <Text style={[s.segBtnText, semForm.college === c && s.segBtnTextActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <FormField label="Order Index" placeholder="1" value={semForm.orderIndex} onChange={(v) => setSemForm((f) => ({ ...f, orderIndex: v }))} keyboardType="numeric" />
                </>
              )}

              {/* ── Subject form ── */}
              {modal?.kind === "subject" && (
                <>
                  <FormField label="Subject ID (slug)" placeholder="e.g. maths-1" value={subForm.id} onChange={(v) => setSubForm((f) => ({ ...f, id: v }))} />
                  <FormField label="Subject Name" placeholder="e.g. Mathematics I" value={subForm.name} onChange={(v) => setSubForm((f) => ({ ...f, name: v }))} />
                  <FormField label="Subject Code" placeholder="e.g. MA101" value={subForm.code} onChange={(v) => setSubForm((f) => ({ ...f, code: v }))} />
                  <FormField label="Description (optional)" placeholder="Brief description of this subject" value={subForm.description} onChange={(v) => setSubForm((f) => ({ ...f, description: v }))} />
                  <FormField label="Semester Number" placeholder="1" value={subForm.semester} onChange={(v) => setSubForm((f) => ({ ...f, semester: v }))} keyboardType="numeric" />
                  <View style={{ marginBottom: 14 }}>
                    <Text style={s.fieldLabel}>College</Text>
                    <View style={s.segRow}>
                      {["CSE", "EEE"].map((c) => (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setSubForm((f) => ({ ...f, college: c }))}
                          style={[s.segBtn, subForm.college === c && s.segBtnActive]}
                        >
                          <Text style={[s.segBtnText, subForm.college === c && s.segBtnTextActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <FormField label="Color (hex)" placeholder="#4361EE" value={subForm.color} onChange={(v) => setSubForm((f) => ({ ...f, color: v }))} />
                  <FormField label="Icon name (Feather)" placeholder="book" value={subForm.icon} onChange={(v) => setSubForm((f) => ({ ...f, icon: v }))} />
                </>
              )}

              {/* ── Chapter form ── */}
              {modal?.kind === "chapter" && (
                <>
                  <FormField label="Chapter Title" placeholder="e.g. Introduction to Matrices" value={chapForm.title} onChange={(v) => setChapForm((f) => ({ ...f, title: v }))} />
                  <FormField label="Order Index" placeholder="1" value={chapForm.orderIndex} onChange={(v) => setChapForm((f) => ({ ...f, orderIndex: v }))} keyboardType="numeric" />
                  <FormField label="Chapter ID (optional — auto-generated if blank)" placeholder="auto" value={chapForm.id} onChange={(v) => setChapForm((f) => ({ ...f, id: v }))} />

                  {/* HTML upload */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={s.fieldLabel}>Upload HTML Notes (optional)</Text>
                    <TouchableOpacity
                      onPress={() => pickHtmlFile((content, name) => {
                        setChapHtmlContent(content);
                        setChapHtmlFileName(name);
                      })}
                      style={s.htmlPickerBtn}
                    >
                      <Feather name="upload-cloud" size={18} color="#4361EE" />
                      <Text style={s.htmlPickerBtnText}>
                        {chapHtmlFileName ? chapHtmlFileName : "Choose an HTML file…"}
                      </Text>
                    </TouchableOpacity>
                    {!!chapHtmlFileName && (
                      <View style={s.htmlFileTag}>
                        <Feather name="check-circle" size={13} color="#10B981" />
                        <Text style={s.htmlFileTagText}>{chapHtmlFileName} ready</Text>
                        <TouchableOpacity onPress={() => { setChapHtmlContent(""); setChapHtmlFileName(""); }}>
                          <Feather name="x" size={13} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Save button */}
            <TouchableOpacity onPress={handleSave} disabled={saving} style={s.saveBtn}>
              <LinearGradient
                colors={["#4361EE", "#7C3AED"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.saveBtnGradient}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.saveBtnText}>
                      {modal?.kind === "semester" ? "Create Semester" :
                       modal?.kind === "subject" ? "Create Subject" : "Create Chapter"}
                    </Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── FormField helper ─────────────────────────────────────────────────────────
function FormField({
  label, placeholder, value, onChange, keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex: 1 },
  centered:       { alignItems: "center", justifyContent: "center", paddingVertical: 48 },

  // ── Header ──
  header:         { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerLeft:     { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo:     { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle:    { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  signOutBtn:     { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  signOutText:    { color: "#4361EE", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsRow:       { flexDirection: "row", gap: 10 },
  statCard:       { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  statValue:      { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel:      { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },

  // ── Section header ──
  sectionHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle:   { fontSize: 17, fontFamily: "Inter_700Bold", color: "#1E293B" },
  addBtn:         { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#4361EE", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText:     { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // ── Empty ──
  emptyState:     { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle:     { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#94A3B8" },
  emptyText:      { fontSize: 13, fontFamily: "Inter_400Regular", color: "#CBD5E1", textAlign: "center" },
  innerEmpty:     { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 12 },
  innerEmptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#94A3B8" },

  // ── Semester block ──
  semBlock:       { backgroundColor: "#fff", borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" },
  semRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 14 },
  semToggle:      { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  semIcon:        { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  semName:        { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1E293B" },
  semMeta:        { fontSize: 12, fontFamily: "Inter_400Regular", color: "#94A3B8", marginTop: 1 },

  // ── Row action buttons ──
  rowActionBtn:   { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginLeft: 6, borderWidth: 1, borderColor: "#C7D2FE" },
  rowActionText:  { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#4361EE" },
  rowDeleteBtn:   { padding: 8, backgroundColor: "#FEE2E2", borderRadius: 8, marginLeft: 6 },

  // ── Subjects container ──
  subjectsContainer: { borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  subBlock:       { borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  subRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, paddingLeft: 32, backgroundColor: "#FAFBFF" },
  subToggle:      { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  subColorDot:    { width: 10, height: 10, borderRadius: 5 },
  subName:        { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#334155" },
  subMeta:        { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8", marginTop: 1 },

  // ── Chapters container ──
  chaptersContainer: { borderTopWidth: 1, borderTopColor: "#F1F5F9", backgroundColor: "#F8FAFC" },
  chapRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, paddingLeft: 52, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  chapIcon:       { width: 28, height: 28, borderRadius: 8, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center", marginRight: 10 },
  chapTitle:      { fontSize: 13, fontFamily: "Inter_500Medium", color: "#334155" },
  chapMeta:       { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8", marginTop: 1 },
  uploadBtn:      { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 6, marginLeft: 6, borderWidth: 1, borderColor: "#C7D2FE" },
  uploadBtnText:  { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#4361EE" },
  chapDeleteBtn:  { padding: 6, backgroundColor: "#FEE2E2", borderRadius: 7, marginLeft: 4 },

  // ── Modal ──
  modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox:       { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  modalHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitleRow:  { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  modalTitle:     { fontSize: 16, fontFamily: "Inter_700Bold", color: "#1E293B", flex: 1 },
  fieldLabel:     { fontSize: 12, fontFamily: "Inter_500Medium", color: "#64748B", marginBottom: 6 },
  fieldInput:     { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: "#1E293B" },
  segRow:         { flexDirection: "row", gap: 8 },
  segBtn:         { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  segBtnActive:   { backgroundColor: "#EEF2FF", borderColor: "#4361EE" },
  segBtnText:     { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#94A3B8" },
  segBtnTextActive: { color: "#4361EE" },
  htmlPickerBtn:  { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#EEF2FF", borderWidth: 1.5, borderColor: "#C7D2FE", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, borderStyle: "dashed" },
  htmlPickerBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#4361EE", flex: 1 },
  htmlFileTag:    { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: "#F0FDF4", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  htmlFileTagText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: "#10B981" },
  saveBtn:        { borderRadius: 12, overflow: "hidden", marginTop: 10 },
  saveBtnGradient: { height: 52, alignItems: "center", justifyContent: "center" },
  saveBtnText:    { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  // ── Login ──
  loginHeader:    { alignItems: "center", paddingHorizontal: 24, paddingBottom: 36, gap: 8 },
  loginIconBox:   { width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  loginTitle:     { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  loginSubtitle:  { color: "rgba(255,255,255,0.75)", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  loginBody:      { flex: 1, padding: 20, marginTop: -20 },
  loginCard:      { backgroundColor: "#fff", borderRadius: 20, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 6 },
  loginLabel:     { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#64748B", marginBottom: 8 },
  passwordRow:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  eyeBtn:         { padding: 10, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  errorBox:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText:      { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  loginBtn:       { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  loginBtnGrad:   { height: 52, alignItems: "center", justifyContent: "center" },
  loginBtnText:   { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  backLink:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 18 },
  backLinkText:   { color: "#64748B", fontSize: 14, fontFamily: "Inter_500Medium" },
});
