import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getApiBase } from "@/utils/api";

type AdminTab = "semesters" | "subjects" | "chapters";

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

function useAdminToken() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const login = useCallback(async (password: string) => {
    setTokenLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(`${getApiBase()}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password }),
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

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={s.emptyState}>
      <Feather name={icon as any} size={40} color="#4361EE40" />
      <Text style={s.emptyText}>{message}</Text>
    </View>
  );
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { adminToken, tokenLoading, loginError, login, adminFetch } = useAdminToken();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [tab, setTab] = useState<AdminTab>("semesters");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [semForm, setSemForm] = useState({ id: "", name: "", college: "CSE", orderIndex: "1" });
  const [subForm, setSubForm] = useState({
    id: "", name: "", code: "", semester: "1", semesterId: "",
    college: "CSE", description: "", color: "#4361EE", icon: "book",
  });
  const [chapForm, setChapForm] = useState({ id: "", subjectId: "", title: "", orderIndex: "1" });
  const [chapHtmlContent, setChapHtmlContent] = useState<string>("");
  const [chapHtmlFileName, setChapHtmlFileName] = useState<string>("");
  const [uploadingChapterId, setUploadingChapterId] = useState<string | null>(null);

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

  async function loadChapters(subjectId: string) {
    if (!subjectId) return;
    try {
      const data = await adminFetch(`/admin/subjects/${subjectId}/chapters`);
      setChapters(data ?? []);
    } catch {}
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

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

  async function handleUploadHtmlToChapter(chapterId: string, chapterTitle: string) {
    pickHtmlFile(async (content, fileName) => {
      setUploadingChapterId(chapterId);
      try {
        await adminFetch(`/admin/chapters/${chapterId}`, {
          method: "PUT",
          body: JSON.stringify({ contentHtml: content }),
        });
        Alert.alert("Success", `HTML uploaded to "${chapterTitle}" (${fileName})`);
      } catch (err: any) {
        Alert.alert("Upload Failed", err.message ?? "Failed to upload HTML");
      } finally {
        setUploadingChapterId(null);
      }
    });
  }

  function openModal() {
    setSemForm({ id: "", name: "", college: "CSE", orderIndex: String(semesters.length + 1) });
    setSubForm({
      id: "", name: "", code: "", semester: "1", semesterId: semesters[0]?.id ?? "",
      college: "CSE", description: "", color: "#4361EE", icon: "book",
    });
    setChapForm({ id: "", subjectId: subjects[0]?.id ?? "", title: "", orderIndex: "1" });
    setChapHtmlContent("");
    setChapHtmlFileName("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (tab === "semesters") {
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
      } else if (tab === "subjects") {
        if (!subForm.id || !subForm.name || !subForm.code) throw new Error("ID, Name and Code are required");
        await adminFetch("/admin/subjects", {
          method: "POST",
          body: JSON.stringify({
            id: subForm.id.trim(),
            name: subForm.name.trim(),
            code: subForm.code.trim().toUpperCase(),
            semester: subForm.semester,
            semesterId: subForm.semesterId || undefined,
            college: subForm.college,
            description: subForm.description,
            color: subForm.color,
            icon: subForm.icon,
          }),
        });
      } else {
        if (!chapForm.title || !chapForm.subjectId) throw new Error("Subject and Title are required");
        const id = chapForm.id.trim() || `chap-${Date.now()}`;
        await adminFetch("/admin/chapters", {
          method: "POST",
          body: JSON.stringify({
            id,
            subjectId: chapForm.subjectId,
            title: chapForm.title.trim(),
            orderIndex: chapForm.orderIndex,
            ...(chapHtmlContent ? { contentHtml: chapHtmlContent } : {}),
          }),
        });
      }
      setShowModal(false);
      await loadData();
      if (tab === "chapters" && chapForm.subjectId) {
        await loadChapters(chapForm.subjectId);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSemester(id: string, name: string) {
    Alert.alert("Delete Semester", `Delete "${name}"? This will remove all related data.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await adminFetch(`/admin/semesters/${id}`, { method: "DELETE" });
            await loadData();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  }

  async function handleDeleteSubject(id: string, name: string) {
    Alert.alert("Delete Subject", `Delete "${name}"? Chapters will also be deleted.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await adminFetch(`/admin/subjects/${id}`, { method: "DELETE" });
            await loadData();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  }

  async function handleDeleteChapter(id: string, title: string) {
    Alert.alert("Delete Chapter", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await adminFetch(`/admin/chapters/${id}`, { method: "DELETE" });
            if (chapForm.subjectId) await loadChapters(chapForm.subjectId);
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
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

  if (!adminToken) {
    return (
      <View style={[s.root, { backgroundColor: "#F8F9FC" }]}>
        <LinearGradient
          colors={["#4361EE", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.loginHeader, { paddingTop: topPad + 10 }]}
        >
          <View style={s.headerLogo}>
            <Text style={{ fontSize: 22 }}>📚</Text>
          </View>
          <Text style={s.loginTitle}>Admin Panel</Text>
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
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
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

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: "semesters", label: "Semesters", icon: "calendar" },
    { key: "subjects", label: "Subjects", icon: "book" },
    { key: "chapters", label: "Chapters", icon: "file-text" },
  ];

  const addLabels: Record<AdminTab, string> = {
    semesters: "+ New Semester",
    subjects: "+ New Subject",
    chapters: "+ New Chapter",
  };

  return (
    <View style={[s.root, { backgroundColor: "#F8F9FC" }]}>
      <LinearGradient
        colors={["#4361EE", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
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

        <View style={s.statsRow}>
          <StatCard value={semesters.length} label="Semesters" />
          <StatCard value={subjects.length} label="Subjects" />
          <StatCard value={chapters.length} label="Chapters" />
        </View>
      </LinearGradient>

      <View style={s.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => {
              setTab(t.key);
              if (t.key === "chapters" && subjects.length > 0 && !chapForm.subjectId) {
                const sid = subjects[0].id;
                setChapForm((f) => ({ ...f, subjectId: sid }));
                loadChapters(sid);
              }
            }}
            style={[s.tabItem, tab === t.key && s.tabItemActive]}
          >
            <Feather
              name={t.icon as any}
              size={15}
              color={tab === t.key ? "#4361EE" : "#94A3B8"}
            />
            <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: botPad + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{TABS.find((t) => t.key === tab)?.label}</Text>
          <TouchableOpacity onPress={openModal} style={s.addBtn}>
            <Text style={s.addBtnText}>{addLabels[tab]}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator color="#4361EE" />
          </View>
        ) : (
          <>
            {tab === "semesters" && (
              semesters.length === 0
                ? <EmptyState icon="calendar" message="No semesters yet. Create your first semester!" />
                : semesters.map((sem) => (
                  <View key={sem.id} style={s.card}>
                    <View style={s.cardIcon}>
                      <Feather name="calendar" size={18} color="#4361EE" />
                    </View>
                    <View style={s.cardBody}>
                      <Text style={s.cardTitle}>{sem.name}</Text>
                      <Text style={s.cardSub}>{sem.college} · ID: {sem.id}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteSemester(sem.id, sem.name)} style={s.deleteBtn}>
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
            )}

            {tab === "subjects" && (
              subjects.length === 0
                ? <EmptyState icon="book" message="No subjects yet. Create your first subject!" />
                : subjects.map((sub) => (
                  <View key={sub.id} style={s.card}>
                    <View style={[s.cardIcon, { backgroundColor: sub.color + "20" }]}>
                      <Text style={{ fontSize: 18 }}>📖</Text>
                    </View>
                    <View style={s.cardBody}>
                      <Text style={s.cardTitle}>{sub.name}</Text>
                      <Text style={s.cardSub}>{sub.code} · {sub.college} · Sem {sub.semester}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteSubject(sub.id, sub.name)} style={s.deleteBtn}>
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
            )}

            {tab === "chapters" && (
              <>
                {subjects.length === 0 ? (
                  <EmptyState icon="file-text" message="Create subjects first before adding chapters." />
                ) : (
                  <>
                    <Text style={s.filterLabel}>Filter by Subject:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                      {subjects.map((sub) => (
                        <TouchableOpacity
                          key={sub.id}
                          onPress={() => {
                            setChapForm((f) => ({ ...f, subjectId: sub.id }));
                            loadChapters(sub.id);
                          }}
                          style={[
                            s.filterChip,
                            chapForm.subjectId === sub.id && s.filterChipActive,
                          ]}
                        >
                          <Text style={[
                            s.filterChipText,
                            chapForm.subjectId === sub.id && s.filterChipTextActive,
                          ]}>
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {chapters.length === 0
                      ? <EmptyState icon="file-text" message="No chapters yet for this subject." />
                      : chapters.map((ch) => (
                        <View key={ch.id} style={s.card}>
                          <View style={s.cardIcon}>
                            <Feather name="file-text" size={18} color="#4361EE" />
                          </View>
                          <View style={s.cardBody}>
                            <Text style={s.cardTitle}>{ch.title}</Text>
                            <Text style={s.cardSub}>Order #{ch.orderIndex} · ID: {ch.id}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleUploadHtmlToChapter(ch.id, ch.title)}
                            style={s.uploadBtn}
                            disabled={uploadingChapterId === ch.id}
                          >
                            {uploadingChapterId === ch.id
                              ? <ActivityIndicator size="small" color="#4361EE" />
                              : <Feather name="upload" size={16} color="#4361EE" />
                            }
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteChapter(ch.id, ch.title)} style={s.deleteBtn}>
                            <Feather name="trash-2" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))
                    }
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {tab === "semesters" ? "New Semester" : tab === "subjects" ? "New Subject" : "New Chapter"}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
              {tab === "semesters" && (
                <>
                  <FormField label="ID (slug)" placeholder="e.g. sem-1-cse" value={semForm.id} onChange={(v) => setSemForm((f) => ({ ...f, id: v }))} />
                  <FormField label="Name" placeholder="e.g. Semester 1" value={semForm.name} onChange={(v) => setSemForm((f) => ({ ...f, name: v }))} />
                  <View style={{ marginBottom: 12 }}>
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

              {tab === "subjects" && (
                <>
                  <FormField label="ID (slug)" placeholder="e.g. maths-1" value={subForm.id} onChange={(v) => setSubForm((f) => ({ ...f, id: v }))} />
                  <FormField label="Name" placeholder="e.g. Mathematics I" value={subForm.name} onChange={(v) => setSubForm((f) => ({ ...f, name: v }))} />
                  <FormField label="Code" placeholder="e.g. MA101" value={subForm.code} onChange={(v) => setSubForm((f) => ({ ...f, code: v }))} />
                  <FormField label="Description" placeholder="Brief description" value={subForm.description} onChange={(v) => setSubForm((f) => ({ ...f, description: v }))} />
                  <FormField label="Semester Number" placeholder="1" value={subForm.semester} onChange={(v) => setSubForm((f) => ({ ...f, semester: v }))} keyboardType="numeric" />
                  {semesters.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={s.fieldLabel}>Semester (link)</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[{ id: "", name: "None" }, ...semesters].map((sem) => (
                          <TouchableOpacity
                            key={sem.id}
                            onPress={() => setSubForm((f) => ({ ...f, semesterId: sem.id }))}
                            style={[s.filterChip, subForm.semesterId === sem.id && s.filterChipActive]}
                          >
                            <Text style={[s.filterChipText, subForm.semesterId === sem.id && s.filterChipTextActive]}>
                              {sem.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  <View style={{ marginBottom: 12 }}>
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
                  <FormField label="Icon name" placeholder="book" value={subForm.icon} onChange={(v) => setSubForm((f) => ({ ...f, icon: v }))} />
                </>
              )}

              {tab === "chapters" && (
                <>
                  {subjects.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={s.fieldLabel}>Subject</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {subjects.map((sub) => (
                          <TouchableOpacity
                            key={sub.id}
                            onPress={() => {
                              setChapForm((f) => ({ ...f, subjectId: sub.id }));
                              loadChapters(sub.id);
                            }}
                            style={[s.filterChip, chapForm.subjectId === sub.id && s.filterChipActive]}
                          >
                            <Text style={[s.filterChipText, chapForm.subjectId === sub.id && s.filterChipTextActive]}>
                              {sub.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  <FormField label="Chapter ID (optional)" placeholder="auto-generated" value={chapForm.id} onChange={(v) => setChapForm((f) => ({ ...f, id: v }))} />
                  <FormField label="Title" placeholder="e.g. Introduction to Matrices" value={chapForm.title} onChange={(v) => setChapForm((f) => ({ ...f, title: v }))} />
                  <FormField label="Order Index" placeholder="1" value={chapForm.orderIndex} onChange={(v) => setChapForm((f) => ({ ...f, orderIndex: v }))} keyboardType="numeric" />
                  <View style={{ marginBottom: 12 }}>
                    <Text style={s.fieldLabel}>HTML Content (optional)</Text>
                    <TouchableOpacity
                      onPress={() => pickHtmlFile((content, name) => {
                        setChapHtmlContent(content);
                        setChapHtmlFileName(name);
                      })}
                      style={s.htmlPickerBtn}
                    >
                      <Feather name="upload" size={16} color="#4361EE" />
                      <Text style={s.htmlPickerBtnText}>
                        {chapHtmlFileName ? chapHtmlFileName : "Choose HTML file…"}
                      </Text>
                    </TouchableOpacity>
                    {chapHtmlFileName ? (
                      <View style={s.htmlFileTag}>
                        <Feather name="check-circle" size={13} color="#10B981" />
                        <Text style={s.htmlFileTagText}>{chapHtmlFileName} ready</Text>
                        <TouchableOpacity onPress={() => { setChapHtmlContent(""); setChapHtmlFileName(""); }}>
                          <Feather name="x" size={13} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity onPress={handleSave} disabled={saving} style={s.saveBtn}>
              <LinearGradient
                colors={["#4361EE", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.saveBtnGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.saveBtnText}>Save</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
    <View style={{ marginBottom: 12 }}>
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

const s = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#64748B", marginTop: 8 },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#4361EE", borderRadius: 10 },
  retryBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  signOutBtn: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  signOutText: { color: "#4361EE", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabItemActive: { borderBottomColor: "#4361EE" },
  tabLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#94A3B8" },
  tabLabelActive: { color: "#4361EE", fontFamily: "Inter_600SemiBold" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#1E293B" },
  addBtn: { backgroundColor: "#4361EE", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#94A3B8", textAlign: "center" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#E2E8F0", gap: 12 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#4361EE15", alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1E293B" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#64748B" },
  deleteBtn: { padding: 8, borderRadius: 8, backgroundColor: "#FEE2E2" },
  uploadBtn: { padding: 8, borderRadius: 8, backgroundColor: "#EEF2FF", marginRight: 4 },
  htmlPickerBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#C7D2FE", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, borderStyle: "dashed" },
  htmlPickerBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#4361EE", flex: 1 },
  htmlFileTag: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, backgroundColor: "#F0FDF4", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  htmlFileTagText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: "#10B981" },
  filterLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#64748B", marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F1F5F9", marginRight: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  filterChipActive: { backgroundColor: "#4361EE15", borderColor: "#4361EE" },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#64748B" },
  filterChipTextActive: { color: "#4361EE", fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#1E293B" },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#64748B", marginBottom: 6 },
  fieldInput: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular", color: "#1E293B" },
  segRow: { flexDirection: "row", gap: 8 },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  segBtnActive: { backgroundColor: "#4361EE15", borderColor: "#4361EE" },
  segBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#94A3B8" },
  segBtnTextActive: { color: "#4361EE" },
  saveBtn: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  saveBtnGradient: { height: 50, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  loginHeader: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 32, gap: 8 },
  loginTitle: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 12 },
  loginSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  loginBody: { flex: 1, padding: 20, justifyContent: "flex-start", marginTop: -20 },
  loginCard: { backgroundColor: "#fff", borderRadius: 20, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  loginLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#64748B", marginBottom: 8 },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  eyeBtn: { padding: 10, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  loginBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  loginBtnGrad: { height: 52, alignItems: "center", justifyContent: "center" },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  backLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 },
  backLinkText: { color: "#64748B", fontSize: 14, fontFamily: "Inter_500Medium" },
});
