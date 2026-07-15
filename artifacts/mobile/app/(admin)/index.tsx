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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getApiBase } from "@/utils/api";

// ─── Design tokens (matches the rest of the app) ──────────────────────────────
const BG         = "#09090B";
const GLASS      = "rgba(255,255,255,0.06)";
const GLASS_HOV  = "rgba(255,255,255,0.10)";
const BORDER     = "rgba(255,255,255,0.08)";
const BORDER_HOV = "rgba(139,92,246,0.35)";
const PURPLE     = "#8B5CF6";
const PURPLE_DIM = "rgba(139,92,246,0.15)";
const PURPLE_TXT = "#A78BFA";
const PURPLE_LIT = "#C4B5FD";
const MUTED      = "#6B7280";
const FG         = "#E2E8F0";
const RED        = "#EF4444";
const RED_DIM    = "rgba(239,68,68,0.12)";
const GREEN      = "#10B981";
const isWeb      = Platform.OS === "web";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────
interface Semester { id: string; name: string; college: string; orderIndex: number; }
interface Subject  { id: string; name: string; code: string; semester: number; semesterId: string | null; college: string; description: string; color: string; icon: string; }
interface Chapter  { id: string; subjectId: string; title: string; orderIndex: number; }
type ModalMode =
  | { kind: "semester" }
  | { kind: "subject";  semesterId: string; semesterName: string }
  | { kind: "chapter";  subjectId: string;  subjectName: string; chapCount: number };

// ─── API hook ─────────────────────────────────────────────────────────────────
function useAdminToken(sessionToken: string | null) {
  const [adminToken, setAdminToken] = useState<string | null>(sessionToken);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => { if (sessionToken && !adminToken) setAdminToken(sessionToken); }, [sessionToken, adminToken]);

  const login = useCallback(async (password: string) => {
    setTokenLoading(true); setLoginError(null);
    try {
      const res = await fetch(`${getApiBase()}/admin/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "HAPPINESSAB", password }),
      });
      const data = await res.json();
      if (res.ok && data.token) setAdminToken(data.token);
      else setLoginError(data.error ?? "Invalid password");
    } catch { setLoginError("Could not reach the server."); }
    finally { setTokenLoading(false); }
  }, []);

  const adminFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    if (!adminToken) throw new Error("Not authenticated");
    const res = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}`, ...(options.headers ?? {}) },
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).error ?? `Error ${res.status}`); }
    if (res.status === 204) return null;
    return res.json();
  }, [adminToken]);

  return { adminToken, tokenLoading, loginError, login, adminFetch };
}

// ─── Web-constrained wrapper ───────────────────────────────────────────────────
function Constrained({ children, style }: { children: React.ReactNode; style?: any }) {
  if (!isWeb) return <View style={style}>{children}</View>;
  return (
    <View style={[{ width: "100%" as any }, style]}>
      <View style={{ maxWidth: 860, width: "100%" as any, alignSelf: "center" as any }}>
        {children}
      </View>
    </View>
  );
}

// ─── Glass card ───────────────────────────────────────────────────────────────
function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[
      s.glassCard,
      isWeb ? {
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      } as any : {},
      style,
    ]}>
      {children}
    </View>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={s.statPill}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { logout, token: sessionToken } = useAuth();
  const insets = useSafeAreaInsets();
  const { adminToken, tokenLoading, loginError, login, adminFetch } = useAdminToken(sessionToken);

  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [semesters, setSemesters]       = useState<Semester[]>([]);
  const [subjects, setSubjects]         = useState<Subject[]>([]);
  const [chapterMap, setChapterMap]     = useState<Record<string, Chapter[]>>({});
  const [openSemesters, setOpenSemesters] = useState<Record<string, boolean>>({});
  const [openSubjects, setOpenSubjects]   = useState<Record<string, boolean>>({});
  const [loading, setLoading]           = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [uploadingId, setUploadingId]   = useState<string | null>(null);
  const [modal, setModal]               = useState<ModalMode | null>(null);
  const [saving, setSaving]             = useState(false);

  const [semForm, setSemForm] = useState({ id: "", name: "", college: "CSE", orderIndex: "1" });
  const [subForm, setSubForm] = useState({ id: "", name: "", code: "", semester: "1", college: "CSE", description: "", color: "#8B5CF6", icon: "book" });
  const [chapForm, setChapForm] = useState({ id: "", title: "", orderIndex: "1" });
  const [chapHtml, setChapHtml] = useState("");
  const [chapFile, setChapFile] = useState("");

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [semsData, subsData] = await Promise.all([adminFetch("/admin/semesters"), adminFetch("/admin/subjects")]);
      setSemesters(semsData ?? []);
      setSubjects(subsData ?? []);
    } catch {} finally { setLoading(false); }
  }, [adminToken, adminFetch]);

  useEffect(() => { if (adminToken) loadData(); }, [adminToken]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  async function loadChapters(subjectId: string) {
    try {
      const data = await adminFetch(`/admin/subjects/${subjectId}/chapters`);
      setChapterMap((p) => ({ ...p, [subjectId]: data ?? [] }));
    } catch {}
  }

  // ── Toggles ───────────────────────────────────────────────────────────────
  function toggleSem(id: string) { setOpenSemesters((p) => ({ ...p, [id]: !p[id] })); }
  function toggleSub(id: string) {
    const willOpen = !openSubjects[id];
    setOpenSubjects((p) => ({ ...p, [id]: willOpen }));
    if (willOpen && !chapterMap[id]) loadChapters(id);
  }

  // ── File picker ───────────────────────────────────────────────────────────
  function pickHtml(onRead: (content: string, name: string) => void) {
    if (!isWeb) { Alert.alert("Web only", "HTML upload is only available on web."); return; }
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".html,text/html";
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0]; if (!file) return;
      const r = new FileReader();
      r.onload = (ev) => onRead(ev.target?.result as string, file.name);
      r.readAsText(file);
    };
    input.click();
  }

  async function handleUploadHtml(chapterId: string, chapterTitle: string, subjectId: string) {
    pickHtml(async (content, fileName) => {
      setUploadingId(chapterId);
      try {
        await adminFetch(`/admin/chapters/${chapterId}`, { method: "PUT", body: JSON.stringify({ contentHtml: content }) });
        Alert.alert("✅ Uploaded", `"${chapterTitle}" ← ${fileName}`);
        await loadChapters(subjectId);
      } catch (err: any) { Alert.alert("Upload Failed", err.message); }
      finally { setUploadingId(null); }
    });
  }

  // ── Modals ────────────────────────────────────────────────────────────────
  function openSemModal() {
    setSemForm({ id: "", name: "", college: "CSE", orderIndex: String(semesters.length + 1) });
    setModal({ kind: "semester" });
  }
  function openSubModal(semId: string, semName: string, semNum: number) {
    setSubForm({ id: "", name: "", code: "", semester: String(semNum), college: "CSE", description: "", color: "#8B5CF6", icon: "book" });
    setModal({ kind: "subject", semesterId: semId, semesterName: semName });
  }
  function openChapModal(subId: string, subName: string, chapCount: number) {
    setChapForm({ id: "", title: "", orderIndex: String(chapCount + 1) });
    setChapHtml(""); setChapFile("");
    setModal({ kind: "chapter", subjectId: subId, subjectName: subName, chapCount });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.kind === "semester") {
        if (!semForm.id || !semForm.name) throw new Error("ID and Name are required");
        await adminFetch("/admin/semesters", { method: "POST", body: JSON.stringify({ id: semForm.id.trim(), name: semForm.name.trim(), college: semForm.college, orderIndex: semForm.orderIndex }) });
        await loadData();
      } else if (modal.kind === "subject") {
        if (!subForm.id || !subForm.name || !subForm.code) throw new Error("ID, Name and Code are required");
        await adminFetch("/admin/subjects", { method: "POST", body: JSON.stringify({ id: subForm.id.trim(), name: subForm.name.trim(), code: subForm.code.trim().toUpperCase(), semester: subForm.semester, semesterId: modal.semesterId, college: subForm.college, description: subForm.description, color: subForm.color, icon: subForm.icon }) });
        await loadData();
      } else {
        if (!chapForm.title) throw new Error("Chapter title is required");
        const id = chapForm.id.trim() || `chap-${Date.now()}`;
        await adminFetch("/admin/chapters", { method: "POST", body: JSON.stringify({ id, subjectId: modal.subjectId, title: chapForm.title.trim(), orderIndex: chapForm.orderIndex, ...(chapHtml ? { contentHtml: chapHtml } : {}) }) });
        await loadChapters(modal.subjectId);
      }
      setModal(null);
    } catch (err: any) { Alert.alert("Error", err.message ?? "Failed to save"); }
    finally { setSaving(false); }
  }

  // ── Deletes ───────────────────────────────────────────────────────────────
  function delSemester(id: string, name: string) {
    Alert.alert("Delete Semester", `Delete "${name}"? All subjects and chapters inside will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await adminFetch(`/admin/semesters/${id}`, { method: "DELETE" }); await loadData(); } catch (e: any) { Alert.alert("Error", e.message); } } },
    ]);
  }
  function delSubject(id: string, name: string) {
    Alert.alert("Delete Subject", `Delete "${name}"? Chapters will also be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await adminFetch(`/admin/subjects/${id}`, { method: "DELETE" }); await loadData(); setChapterMap((p) => { const n = { ...p }; delete n[id]; return n; }); } catch (e: any) { Alert.alert("Error", e.message); } } },
    ]);
  }
  function delChapter(id: string, title: string, subjectId: string) {
    Alert.alert("Delete Chapter", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await adminFetch(`/admin/chapters/${id}`, { method: "DELETE" }); await loadChapters(subjectId); } catch (e: any) { Alert.alert("Error", e.message); } } },
    ]);
  }

  async function handleSignOut() { await logout(); router.replace("/login"); }

  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 0 : insets.bottom;

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (!adminToken) {
    return (
      <View style={[s.root, { backgroundColor: BG }]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
          <Constrained>
            {/* Logo */}
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View style={s.loginLogoBox}>
                <Text style={{ fontSize: 28 }}>📚</Text>
              </View>
              <Text style={s.loginTitle}>Admin Panel</Text>
              <Text style={[s.loginSub, { color: MUTED }]}>Enter your password to continue</Text>
            </View>

            <GlassCard style={{ padding: 24 }}>
              <Text style={[s.label, { marginBottom: 8 }]}>Password</Text>
              <View style={s.pwRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Admin password"
                  placeholderTextColor={MUTED}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onSubmitEditing={() => password && login(password)}
                  returnKeyType="go"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={MUTED} />
                </TouchableOpacity>
              </View>

              {!!loginError && (
                <View style={s.errorBox}>
                  <Feather name="alert-circle" size={14} color={RED} />
                  <Text style={s.errorText}>{loginError}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => password && login(password)}
                disabled={tokenLoading || !password}
                activeOpacity={0.85}
                style={[s.primaryBtn, (!password || tokenLoading) && { opacity: 0.5 }]}
              >
                <LinearGradient colors={["#7C3AED", "#4361EE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtnGrad}>
                  {tokenLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Unlock Admin Panel</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
                <Feather name="arrow-left" size={14} color={MUTED} />
                <Text style={[s.backLinkText, { color: MUTED }]}>Go back</Text>
              </TouchableOpacity>
            </GlassCard>
          </Constrained>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  const totalChapters = Object.values(chapterMap).reduce((a, c) => a + c.length, 0);

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: topPad + (isWeb ? 24 : 48) }]}>
          <Constrained style={{ paddingHorizontal: 20 }}>
            <View style={s.headerRow}>
              <View style={s.headerLeft}>
                <View style={s.headerLogoBox}>
                  <Text style={{ fontSize: 16 }}>📚</Text>
                </View>
                <Text style={s.headerTitle}>StudyMate Admin</Text>
              </View>
              <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
                <Feather name="log-out" size={14} color={PURPLE_TXT} />
                <Text style={s.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <StatPill value={semesters.length} label="Semesters" />
              <StatPill value={subjects.length} label="Subjects" />
              <StatPill value={totalChapters} label="Chapters loaded" />
            </View>
          </Constrained>
        </View>

        {/* ── Content tree ── */}
        <Constrained style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          {/* Section header */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Content Tree</Text>
            <TouchableOpacity onPress={openSemModal} style={s.addBtn}>
              <Feather name="plus" size={14} color="#fff" />
              <Text style={s.addBtnText}>New Semester</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <ActivityIndicator color={PURPLE} size="large" />
            </View>
          ) : semesters.length === 0 ? (
            <GlassCard style={s.emptyCard}>
              <Feather name="layers" size={36} color={MUTED} />
              <Text style={s.emptyTitle}>No semesters yet</Text>
              <Text style={[s.emptyText, { color: MUTED }]}>Tap "New Semester" above to get started</Text>
            </GlassCard>
          ) : (
            semesters.map((sem) => {
              const semSubs = subjects.filter((sub) => sub.semesterId === sem.id || String(sub.semester) === String(sem.orderIndex));
              const isOpen = !!openSemesters[sem.id];

              return (
                <View key={sem.id} style={s.semBlock}>
                  {/* ── Semester row ── */}
                  <View style={s.semRow}>
                    <TouchableOpacity onPress={() => toggleSem(sem.id)} style={s.semToggle} activeOpacity={0.7}>
                      <Feather name={isOpen ? "chevron-down" : "chevron-right"} size={16} color={PURPLE_TXT} />
                      <View style={s.semIconBox}>
                        <Feather name="layers" size={14} color={PURPLE_TXT} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.semName}>{sem.name}</Text>
                        <Text style={s.semMeta}>{sem.college} · {semSubs.length} subject{semSubs.length !== 1 ? "s" : ""}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => openSubModal(sem.id, sem.name, sem.orderIndex)} style={s.inlineActionBtn}>
                      <Feather name="plus" size={13} color={PURPLE_TXT} />
                      <Text style={s.inlineActionText}>Subject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => delSemester(sem.id, sem.name)} style={s.inlineDeleteBtn}>
                      <Feather name="trash-2" size={13} color={RED} />
                    </TouchableOpacity>
                  </View>

                  {/* ── Subjects ── */}
                  {isOpen && (
                    <View style={s.subjectsWrap}>
                      {semSubs.length === 0 ? (
                        <View style={s.innerEmpty}>
                          <Feather name="book" size={15} color={MUTED} />
                          <Text style={[s.innerEmptyText, { color: MUTED }]}>No subjects — tap "+ Subject"</Text>
                        </View>
                      ) : semSubs.map((sub) => {
                        const chapters = chapterMap[sub.id] ?? [];
                        const subOpen = !!openSubjects[sub.id];

                        return (
                          <View key={sub.id} style={s.subBlock}>
                            {/* Subject row */}
                            <View style={s.subRow}>
                              <TouchableOpacity onPress={() => toggleSub(sub.id)} style={s.subToggle} activeOpacity={0.7}>
                                <Feather name={subOpen ? "chevron-down" : "chevron-right"} size={14} color={MUTED} />
                                <View style={[s.subDot, { backgroundColor: sub.color }]} />
                                <View style={{ flex: 1 }}>
                                  <Text style={s.subName}>{sub.name}</Text>
                                  <Text style={s.subMeta}>{sub.code} · {subOpen ? `${chapters.length} chapter${chapters.length !== 1 ? "s" : ""}` : "tap to expand"}</Text>
                                </View>
                              </TouchableOpacity>

                              <TouchableOpacity onPress={() => openChapModal(sub.id, sub.name, chapters.length)} style={s.inlineActionBtn}>
                                <Feather name="file-plus" size={13} color={PURPLE_TXT} />
                                <Text style={s.inlineActionText}>Chapter</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => delSubject(sub.id, sub.name)} style={s.inlineDeleteBtn}>
                                <Feather name="trash-2" size={13} color={RED} />
                              </TouchableOpacity>
                            </View>

                            {/* ── Chapters ── */}
                            {subOpen && (
                              <View style={s.chaptersWrap}>
                                {!chapterMap[sub.id] ? (
                                  <ActivityIndicator color={PURPLE} style={{ marginVertical: 12 }} />
                                ) : chapters.length === 0 ? (
                                  <View style={s.innerEmpty}>
                                    <Feather name="file-text" size={14} color={MUTED} />
                                    <Text style={[s.innerEmptyText, { color: MUTED }]}>No chapters — tap "+ Chapter"</Text>
                                  </View>
                                ) : chapters.map((ch) => (
                                  <View key={ch.id} style={s.chapRow}>
                                    <View style={s.chapIconBox}>
                                      <Feather name="file-text" size={12} color={PURPLE_TXT} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={s.chapTitle} numberOfLines={1}>{ch.title}</Text>
                                      <Text style={s.chapMeta}>Order #{ch.orderIndex}</Text>
                                    </View>
                                    <TouchableOpacity
                                      onPress={() => handleUploadHtml(ch.id, ch.title, sub.id)}
                                      style={s.uploadBtn}
                                      disabled={uploadingId === ch.id}
                                    >
                                      {uploadingId === ch.id
                                        ? <ActivityIndicator size="small" color={PURPLE} />
                                        : <>
                                          <Feather name="upload" size={12} color={PURPLE_TXT} />
                                          <Text style={s.uploadBtnText}>HTML</Text>
                                        </>
                                      }
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => delChapter(ch.id, ch.title, sub.id)} style={s.inlineDeleteBtn}>
                                      <Feather name="trash-2" size={12} color={RED} />
                                    </TouchableOpacity>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </Constrained>
      </ScrollView>

      {/* ── Modal ── */}
      <Modal visible={!!modal} animationType="slide" transparent onRequestClose={() => setModal(null)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, isWeb ? { maxWidth: 520, width: "100%" as any, alignSelf: "center" as any, borderRadius: 20, marginBottom: 40 } as any : {}]}>
            {/* Modal header */}
            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={s.modalIconBox}>
                  <Feather name={modal?.kind === "semester" ? "layers" : modal?.kind === "subject" ? "book" : "file-text"} size={16} color={PURPLE_TXT} />
                </View>
                <Text style={s.modalTitle} numberOfLines={1}>
                  {modal?.kind === "semester" && "New Semester"}
                  {modal?.kind === "subject" && `New Subject — ${(modal as any).semesterName}`}
                  {modal?.kind === "chapter" && `New Chapter — ${(modal as any).subjectName}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModal(null)} style={s.modalCloseBtn}>
                <Feather name="x" size={18} color={MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* ── Semester form ── */}
              {modal?.kind === "semester" && (
                <>
                  <MField label="ID (slug)" placeholder="e.g. sem-1-cse" value={semForm.id} onChange={(v) => setSemForm((f) => ({ ...f, id: v }))} />
                  <MField label="Semester Name" placeholder="e.g. Semester 1" value={semForm.name} onChange={(v) => setSemForm((f) => ({ ...f, name: v }))} />
                  <SegmentControl label="College" options={["CSE", "EEE"]} value={semForm.college} onChange={(v) => setSemForm((f) => ({ ...f, college: v }))} />
                  <MField label="Order Index" placeholder="1" value={semForm.orderIndex} onChange={(v) => setSemForm((f) => ({ ...f, orderIndex: v }))} keyboardType="numeric" />
                </>
              )}

              {/* ── Subject form ── */}
              {modal?.kind === "subject" && (
                <>
                  <MField label="Subject ID (slug)" placeholder="e.g. maths-1" value={subForm.id} onChange={(v) => setSubForm((f) => ({ ...f, id: v }))} />
                  <MField label="Subject Name" placeholder="e.g. Mathematics I" value={subForm.name} onChange={(v) => setSubForm((f) => ({ ...f, name: v }))} />
                  <MField label="Subject Code" placeholder="e.g. MA101" value={subForm.code} onChange={(v) => setSubForm((f) => ({ ...f, code: v }))} />
                  <MField label="Description (optional)" placeholder="Brief description" value={subForm.description} onChange={(v) => setSubForm((f) => ({ ...f, description: v }))} />
                  <MField label="Semester Number" placeholder="1" value={subForm.semester} onChange={(v) => setSubForm((f) => ({ ...f, semester: v }))} keyboardType="numeric" />
                  <SegmentControl label="College" options={["CSE", "EEE"]} value={subForm.college} onChange={(v) => setSubForm((f) => ({ ...f, college: v }))} />
                  <MField label="Color (hex)" placeholder="#8B5CF6" value={subForm.color} onChange={(v) => setSubForm((f) => ({ ...f, color: v }))} />
                  <MField label="Icon (Feather name)" placeholder="book" value={subForm.icon} onChange={(v) => setSubForm((f) => ({ ...f, icon: v }))} />
                </>
              )}

              {/* ── Chapter form ── */}
              {modal?.kind === "chapter" && (
                <>
                  <MField label="Chapter Title" placeholder="e.g. Introduction to Matrices" value={chapForm.title} onChange={(v) => setChapForm((f) => ({ ...f, title: v }))} />
                  <MField label="Order Index" placeholder="1" value={chapForm.orderIndex} onChange={(v) => setChapForm((f) => ({ ...f, orderIndex: v }))} keyboardType="numeric" />
                  <MField label="Chapter ID (optional)" placeholder="auto-generated if blank" value={chapForm.id} onChange={(v) => setChapForm((f) => ({ ...f, id: v }))} />
                  <Text style={[s.label, { marginBottom: 8 }]}>Upload HTML Notes (optional)</Text>
                  <TouchableOpacity onPress={() => pickHtml((c, n) => { setChapHtml(c); setChapFile(n); })} style={s.htmlPickerBtn}>
                    <Feather name="upload-cloud" size={18} color={PURPLE_TXT} />
                    <Text style={s.htmlPickerText}>{chapFile || "Choose an HTML file…"}</Text>
                  </TouchableOpacity>
                  {!!chapFile && (
                    <View style={s.htmlFileTag}>
                      <Feather name="check-circle" size={13} color={GREEN} />
                      <Text style={s.htmlFileTagText}>{chapFile} ready</Text>
                      <TouchableOpacity onPress={() => { setChapHtml(""); setChapFile(""); }}>
                        <Feather name="x" size={13} color={MUTED} />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={{ height: 12 }} />
                </>
              )}
            </ScrollView>

            <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.primaryBtn, { marginTop: 12 }]}>
              <LinearGradient colors={["#7C3AED", "#4361EE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtnGrad}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>
                      {modal?.kind === "semester" ? "Create Semester" : modal?.kind === "subject" ? "Create Subject" : "Create Chapter"}
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

// ─── Modal field ──────────────────────────────────────────────────────────────
function MField({ label, placeholder, value, onChange, keyboardType }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
      />
    </View>
  );
}

// ─── Segment control ──────────────────────────────────────────────────────────
function SegmentControl({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.segRow}>
        {options.map((o) => (
          <TouchableOpacity key={o} onPress={() => onChange(o)} style={[s.segBtn, value === o && s.segBtnActive]}>
            <Text style={[s.segBtnText, value === o && s.segBtnTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex: 1 },

  // glass card
  glassCard:      { backgroundColor: GLASS, borderRadius: 18, borderWidth: 1, borderColor: BORDER },

  // header
  header:         { paddingBottom: 20 },
  headerRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerLeft:     { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogoBox:  { width: 34, height: 34, borderRadius: 10, backgroundColor: PURPLE_DIM, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)" },
  headerTitle:    { color: FG, fontSize: 18, fontFamily: "Inter_700Bold" },
  signOutBtn:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GLASS, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: BORDER },
  signOutText:    { color: PURPLE_TXT, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsRow:       { flexDirection: "row", gap: 10 },
  statPill:       { flex: 1, backgroundColor: GLASS, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: BORDER },
  statValue:      { color: FG, fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel:      { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  // section
  sectionHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle:   { color: FG, fontSize: 17, fontFamily: "Inter_700Bold" },
  addBtn:         { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: PURPLE, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText:     { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // empty
  emptyCard:      { alignItems: "center", paddingVertical: 52, gap: 10, marginTop: 8 },
  emptyTitle:     { color: FG, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText:      { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  innerEmpty:     { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 16 },
  innerEmptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  // semester block
  semBlock:       { backgroundColor: GLASS, borderRadius: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 10, overflow: "hidden" },
  semRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14 },
  semToggle:      { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
  semIconBox:     { width: 32, height: 32, borderRadius: 9, backgroundColor: PURPLE_DIM, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  semName:        { color: FG, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  semMeta:        { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  // subject block
  subjectsWrap:   { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  subBlock:       { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.04)" },
  subRow:         { flexDirection: "row", alignItems: "center", paddingLeft: 36, paddingRight: 14, paddingVertical: 12, backgroundColor: "rgba(255,255,255,0.02)" },
  subToggle:      { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
  subDot:         { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  subName:        { color: FG, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  subMeta:        { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  // chapter rows
  chaptersWrap:   { backgroundColor: "rgba(0,0,0,0.15)" },
  chapRow:        { flexDirection: "row", alignItems: "center", paddingLeft: 56, paddingRight: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.03)" },
  chapIconBox:    { width: 26, height: 26, borderRadius: 7, backgroundColor: PURPLE_DIM, alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0 },
  chapTitle:      { color: FG, fontSize: 13, fontFamily: "Inter_500Medium" },
  chapMeta:       { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  // inline action buttons
  inlineActionBtn:{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: PURPLE_DIM, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, marginLeft: 6, borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", flexShrink: 0 },
  inlineActionText:{ color: PURPLE_TXT, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  inlineDeleteBtn:{ padding: 7, backgroundColor: RED_DIM, borderRadius: 8, marginLeft: 5, flexShrink: 0 },
  uploadBtn:      { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: PURPLE_DIM, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, marginLeft: 6, borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", flexShrink: 0 },
  uploadBtnText:  { color: PURPLE_TXT, fontSize: 11, fontFamily: "Inter_600SemiBold" },

  // modal
  modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  modalBox:       { backgroundColor: "#0F0F1A", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderColor: BORDER },
  modalHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalIconBox:   { width: 32, height: 32, borderRadius: 9, backgroundColor: PURPLE_DIM, alignItems: "center", justifyContent: "center" },
  modalTitle:     { color: FG, fontSize: 16, fontFamily: "Inter_700Bold", flex: 1 },
  modalCloseBtn:  { padding: 6, backgroundColor: GLASS, borderRadius: 8 },

  // form
  label:          { color: MUTED, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 6 },
  input:          { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontFamily: "Inter_400Regular", color: FG },
  pwRow:          { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  eyeBtn:         { padding: 13, backgroundColor: GLASS, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  errorBox:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: RED_DIM, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText:      { color: RED, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  segRow:         { flexDirection: "row", gap: 8 },
  segBtn:         { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: GLASS },
  segBtnActive:   { backgroundColor: PURPLE_DIM, borderColor: "rgba(139,92,246,0.4)" },
  segBtnText:     { fontSize: 14, fontFamily: "Inter_600SemiBold", color: MUTED },
  segBtnTextActive:{ color: PURPLE_LIT },
  htmlPickerBtn:  { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: PURPLE_DIM, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  htmlPickerText: { color: PURPLE_TXT, fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  htmlFileTag:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  htmlFileTagText:{ flex: 1, color: GREEN, fontSize: 12, fontFamily: "Inter_500Medium" },

  // buttons
  primaryBtn:     { borderRadius: 13, overflow: "hidden" },
  primaryBtnGrad: { height: 52, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  backLink:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, paddingVertical: 4 },
  backLinkText:   { fontSize: 14, fontFamily: "Inter_500Medium" },

  // login
  loginLogoBox:   { width: 72, height: 72, borderRadius: 20, backgroundColor: PURPLE_DIM, borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  loginTitle:     { color: FG, fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6 },
  loginSub:       { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
