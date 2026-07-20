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
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const isWeb = Platform.OS === "web";

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
      <View style={{ maxWidth: 900, width: "100%" as any, alignSelf: "center" as any }}>
        {children}
      </View>
    </View>
  );
}

// ─── Log helpers ──────────────────────────────────────────────────────────────
function getLogColor(type: string) {
  switch (type) {
    case "ADMIN_LOGIN": case "LOGIN": return "#22C55E";
    case "SIGNUP":                    return "#5B6BF8";
    case "SEMESTER_CREATE": case "SUBJECT_CREATE": case "CHAPTER_CREATE": return "#5B6BF8";
    case "SEMESTER_DELETE": case "SUBJECT_DELETE": case "CHAPTER_DELETE": case "ADMIN_LOGIN_FAIL": return "#EF4444";
    case "AI_CONVERT":                return "#8B5CF6";
    default:                          return "#6B7A99";
  }
}
function getLogIcon(type: string) {
  switch (type) {
    case "ADMIN_LOGIN": case "LOGIN": return "log-in";
    case "SIGNUP":                    return "user-plus";
    case "SEMESTER_CREATE": case "SUBJECT_CREATE": case "CHAPTER_CREATE": return "plus-circle";
    case "SEMESTER_DELETE": case "SUBJECT_DELETE": case "CHAPTER_DELETE": return "trash-2";
    case "ADMIN_LOGIN_FAIL":          return "alert-octagon";
    case "AI_CONVERT":                return "cpu";
    default:                          return "activity";
  }
}

// ─── Live Logs Panel ──────────────────────────────────────────────────────────
function LogsPanel({ logs }: { logs: any[] }) {
  return (
    <View style={{ borderRadius: 12, borderWidth: 1, borderColor: "#1E2535", backgroundColor: "#0F1420", padding: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Feather name="activity" size={16} color="#5B6BF8" />
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>Live Activity Logs</Text>
        <View style={{ marginLeft: "auto" as any, backgroundColor: "#5B6BF820", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 10, color: "#5B6BF8", fontWeight: "600" }}>LIVE · 5s</Text>
        </View>
      </View>
      {logs.length === 0 ? (
        <View style={{ paddingVertical: 32, alignItems: "center", gap: 8 }}>
          <Feather name="radio" size={24} color="#2A3448" />
          <Text style={{ color: "#6B7A99", fontSize: 13 }}>No activity logged yet.</Text>
        </View>
      ) : (
        logs.map((log) => {
          const logColor = getLogColor(log.type);
          const iconName = getLogIcon(log.type);
          const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          return (
            <View key={log.id} style={{ flexDirection: "row", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1E2535" }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: logColor + "20" }}>
                <Feather name={iconName as any} size={12} color={logColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, lineHeight: 16, color: "#FFFFFF" }}>{log.message}</Text>
                <Text style={{ fontSize: 10, marginTop: 2, color: "#6B7A99" }}>{log.type} · {timeStr}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { logout, token: sessionToken } = useAuth();
  const colors = useColors();
  const { isDark, toggleTheme } = useApp();
  const insets = useSafeAreaInsets();
  const { adminToken, tokenLoading, loginError, login, adminFetch } = useAdminToken(sessionToken);

  const [password, setPassword]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [semesters, setSemesters]         = useState<Semester[]>([]);
  const [subjects, setSubjects]           = useState<Subject[]>([]);
  const [chapterMap, setChapterMap]       = useState<Record<string, Chapter[]>>({});
  const [openSemesters, setOpenSemesters] = useState<Record<string, boolean>>({});
  const [loading, setLoading]             = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [uploadingId, setUploadingId]     = useState<string | null>(null);
  const [modal, setModal]                 = useState<ModalMode | null>(null);
  const [saving, setSaving]               = useState(false);
  const [logs, setLogs]                   = useState<any[]>([]);

  const [semForm, setSemForm]   = useState({ id: "", name: "", college: "CSE", orderIndex: "1" });
  const [subForm, setSubForm]   = useState({ id: "", name: "", code: "", semester: "1", college: "CSE", description: "", color: "#8B5CF6", icon: "book" });
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

  const fetchLogs = useCallback(async () => {
    if (!adminToken) return;
    try { const data = await adminFetch("/admin/logs"); setLogs(data ?? []); } catch {}
  }, [adminToken, adminFetch]);

  useEffect(() => {
    if (adminToken) {
      loadData(); fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [adminToken, loadData, fetchLogs]);

  const onRefresh = async () => { setRefreshing(true); await Promise.all([loadData(), fetchLogs()]); setRefreshing(false); };

  const loadChapters = useCallback(async (subjectId: string) => {
    try {
      const data = await adminFetch(`/admin/subjects/${subjectId}/chapters`);
      setChapterMap((p) => ({ ...p, [subjectId]: data ?? [] }));
    } catch {}
  }, [adminFetch]);

  // ── Toggle semester expand ─────────────────────────────────────────────────
  const toggleSem = useCallback(async (id: string) => {
    const willOpen = !openSemesters[id];
    setOpenSemesters((p) => ({ ...p, [id]: willOpen }));
    if (willOpen) {
      const sem = semesters.find((s) => s.id === id);
      const semSubs = subjects.filter((sub) => sub.semesterId === id || String(sub.semester) === String(sem?.orderIndex));
      await Promise.all(semSubs.map(async (sub) => { if (!chapterMap[sub.id]) await loadChapters(sub.id); }));
    }
  }, [openSemesters, semesters, subjects, chapterMap, loadChapters]);

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
  function openSemModal() { setSemForm({ id: "", name: "", college: "CSE", orderIndex: String(semesters.length + 1) }); setModal({ kind: "semester" }); }
  function openSubModal(semId: string, semName: string, semNum: number) { setSubForm({ id: "", name: "", code: "", semester: String(semNum), college: "CSE", description: "", color: "#8B5CF6", icon: "book" }); setModal({ kind: "subject", semesterId: semId, semesterName: semName }); }
  function openChapModal(subId: string, subName: string, chapCount: number) { setChapForm({ id: "", title: "", orderIndex: String(chapCount + 1) }); setChapHtml(""); setChapFile(""); setModal({ kind: "chapter", subjectId: subId, subjectName: subName, chapCount }); }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.kind === "semester") {
        if (!semForm.id || !semForm.name) throw new Error("ID and Name are required");
        await adminFetch("/admin/semesters", { method: "POST", body: JSON.stringify({ id: semForm.id.trim(), name: semForm.name.trim(), college: semForm.college, orderIndex: Number(semForm.orderIndex) || 0 }) });
        await loadData();
      } else if (modal.kind === "subject") {
        if (!subForm.id || !subForm.name || !subForm.code) throw new Error("ID, Name and Code are required");
        await adminFetch("/admin/subjects", { method: "POST", body: JSON.stringify({ id: subForm.id.trim(), name: subForm.name.trim(), code: subForm.code.trim().toUpperCase(), semester: Number(subForm.semester) || 1, semesterId: modal.semesterId, college: subForm.college, description: subForm.description, color: subForm.color, icon: subForm.icon }) });
        await loadData();
      } else {
        if (!chapForm.title) throw new Error("Chapter title is required");
        const id = chapForm.id.trim() || `chap-${Date.now()}`;
        await adminFetch("/admin/chapters", { method: "POST", body: JSON.stringify({ id, subjectId: modal.subjectId, title: chapForm.title.trim(), orderIndex: Number(chapForm.orderIndex) || 0, ...(chapHtml ? { contentHtml: chapHtml } : {}) }) });
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
  // LOGIN SCREEN (unchanged look)
  // ─────────────────────────────────────────────────────────────────────────
  if (!adminToken) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
          <Constrained>
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View style={[s.loginLogoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={{ fontSize: 28 }}>📚</Text>
              </View>
              <Text style={[s.loginTitle, { color: colors.text, fontFamily: isWeb ? "'Playfair Display', serif" : "System" }]}>Admin Access Ticket</Text>
              <Text style={[s.loginSub, { color: colors.mutedForeground, fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System" }]}>Enter password to unlock semesters dashboard</Text>
            </View>

            <View style={[s.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.label, { color: colors.mutedForeground }]}>Password</Text>
              <View style={s.pwRow}>
                <TextInput
                  style={[s.input, { flex: 1, color: colors.text, borderColor: colors.border, backgroundColor: colors.input }]}
                  placeholder="Admin password" placeholderTextColor={colors.mutedForeground}
                  value={password} onChangeText={setPassword}
                  secureTextEntry={!showPassword} autoCapitalize="none"
                  onSubmitEditing={() => password && login(password)} returnKeyType="go"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={[s.eyeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>

              {!!loginError && (
                <View style={[s.errorBox, { borderColor: colors.border }]}>
                  <Feather name="alert-circle" size={14} color={colors.destructive} />
                  <Text style={[s.errorText, { color: colors.destructive }]}>{loginError}</Text>
                </View>
              )}

              <TouchableOpacity onPress={() => password && login(password)} disabled={tokenLoading || !password} activeOpacity={0.85}
                style={[s.primaryBtn, { marginTop: 12 }, (!password || tokenLoading) && { opacity: 0.5 }]}>
                <LinearGradient colors={[colors.primary, colors.tint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtnGrad}>
                  {tokenLoading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[s.primaryBtnText, { color: colors.primaryForeground }]}>Unlock Admin Panel</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
                <Feather name="arrow-left" size={14} color={colors.accent} />
                <Text style={[s.backLinkText, { color: colors.accent }]}>Go back</Text>
              </TouchableOpacity>
            </View>
          </Constrained>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD  — dark design matching screenshot
  // ─────────────────────────────────────────────────────────────────────────
  // Design tokens (always dark, regardless of app theme)
  const D = {
    bg:      "#0B0F1A",
    card:    "#0F1420",
    card2:   "#161D2F",
    border:  "#1E2535",
    border2: "#2A3448",
    text:    "#FFFFFF",
    muted:   "#6B7A99",
    primary: "#5B6BF8",
    danger:  "#EF4444",
  };

  const totalChapters = Object.values(chapterMap).reduce((a, c) => a + c.length, 0);

  return (
    <View style={[s.root, { backgroundColor: D.bg }]}>

      {/* ── Header ── */}
      <View style={{ paddingTop: topPad + (isWeb ? 0 : 44), backgroundColor: D.card, borderBottomWidth: 1, borderBottomColor: D.border }}>
        <Constrained>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: D.text }}>
              <Text style={{ color: D.primary }}>StudyMate</Text>{" Admin"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity onPress={toggleTheme} style={{ width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#1A2030", borderWidth: 1, borderColor: D.border2 }}>
                <Feather name={isDark ? "sun" : "moon"} size={15} color={D.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignOut} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: D.border2, backgroundColor: "#1A2030" }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: D.text }}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Constrained>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={D.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Constrained style={{ paddingHorizontal: 16 }}>

          {/* ── Stats Row ── */}
          <View style={{ marginTop: 16, flexDirection: "row", borderRadius: 12, borderWidth: 1, borderColor: D.border, backgroundColor: D.card, overflow: "hidden" }}>
            {([
              { value: semesters.length, label: "Semesters", barW: 60 },
              { value: subjects.length,  label: "Subjects",  barW: 60 },
              { value: totalChapters,    label: "Chapters",  barW: 44 },
            ] as { value: number; label: string; barW: number }[]).map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View style={{ width: 1, backgroundColor: D.border, alignSelf: "stretch" as any }} />}
                <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 18 }}>
                  <Text style={{ fontSize: 26, fontWeight: "700", color: D.text }}>{stat.value}</Text>
                  <Text style={{ fontSize: 13, color: D.muted, marginBottom: 8 }}>{stat.label}</Text>
                  <View style={{ height: 2, width: stat.barW, borderRadius: 1, backgroundColor: D.primary }} />
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* ── Shelf Directory Header ── */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 14 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: D.text }}>Shelf Directory</Text>
            <TouchableOpacity onPress={openSemModal} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: D.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }}>
              <Feather name="plus" size={14} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>New Semester</Text>
            </TouchableOpacity>
          </View>

          {/* ── Semesters List (vertical scroll) ── */}
          {loading ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <ActivityIndicator color={D.primary} size="large" />
            </View>
          ) : semesters.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 52, gap: 10, borderRadius: 12, borderWidth: 1, borderColor: D.border, backgroundColor: D.card }}>
              <Feather name="layers" size={32} color={D.muted} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: D.text }}>No semesters yet</Text>
              <Text style={{ fontSize: 13, color: D.muted, textAlign: "center" }}>Tap "New Semester" above to get started</Text>
            </View>
          ) : (
            semesters.map((sem) => {
              const semSubs = subjects.filter(
                (sub) => sub.semesterId === sem.id || String(sub.semester) === String(sem.orderIndex)
              );
              const isOpen = !!openSemesters[sem.id];

              return (
                <View key={sem.id} style={{ borderRadius: 12, borderWidth: 1, borderColor: D.border, backgroundColor: D.card, marginBottom: 12, overflow: "hidden" }}>

                  {/* Semester Header Row — tap to expand/collapse */}
                  <TouchableOpacity
                    onPress={() => toggleSem(sem.id)}
                    activeOpacity={0.8}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: D.text }}>{sem.name}</Text>
                      <Text style={{ fontSize: 12, color: D.muted, marginTop: 2 }}>
                        {sem.college} · {semSubs.length} subject{semSubs.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {/* + Subject button */}
                      <TouchableOpacity
                        onPress={(e) => { (e as any).stopPropagation?.(); openSubModal(sem.id, sem.name, sem.orderIndex); }}
                        style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: D.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }}
                      >
                        <Feather name="plus" size={13} color="#FFFFFF" />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>Subject</Text>
                      </TouchableOpacity>
                      {/* Delete semester */}
                      <TouchableOpacity
                        onPress={(e) => { (e as any).stopPropagation?.(); delSemester(sem.id, sem.name); }}
                        style={{ width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239,68,68,0.1)" }}
                      >
                        <Feather name="trash-2" size={13} color={D.danger} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Subjects — horizontal scroll */}
                  {isOpen && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 16, paddingTop: 12, gap: 12 }}
                      style={{ borderTopWidth: 1, borderTopColor: D.border }}
                    >
                      {semSubs.length === 0 ? (
                        <View style={{ paddingVertical: 20, paddingHorizontal: 4 }}>
                          <Text style={{ color: D.muted, fontSize: 13 }}>No subjects — tap "+ Subject" to add</Text>
                        </View>
                      ) : (
                        semSubs.map((sub) => {
                          const chapters = chapterMap[sub.id] ?? [];
                          return (
                            <View key={sub.id} style={{ width: 280, borderRadius: 10, borderWidth: 1, borderColor: D.border, backgroundColor: D.card2, padding: 12 }}>

                              {/* Subject Card Header */}
                              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                  <Text style={{ fontSize: 13, fontWeight: "700", color: D.text }} numberOfLines={1}>{sub.name}</Text>
                                  <Text style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                                    {sub.code} · {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
                                    {chapters.length === 0 ? " · tap to expand" : ""}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: "row", gap: 6 }}>
                                  {/* + Chapter button */}
                                  <TouchableOpacity
                                    onPress={() => openChapModal(sub.id, sub.name, chapters.length)}
                                    style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: D.primary, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 }}
                                  >
                                    <Feather name="plus" size={12} color="#FFFFFF" />
                                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>Chapter</Text>
                                  </TouchableOpacity>
                                  {/* Delete subject */}
                                  <TouchableOpacity
                                    onPress={() => delSubject(sub.id, sub.name)}
                                    style={{ width: 27, height: 27, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239,68,68,0.1)" }}
                                  >
                                    <Feather name="trash-2" size={12} color={D.danger} />
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {/* Chapter Cards — 2-column grid */}
                              <View style={{ borderTopWidth: 1, borderTopColor: D.border, paddingTop: 8 }}>
                                {chapters.length === 0 ? (
                                  <Text style={{ fontSize: 11, color: "#3A4A6B", fontStyle: "italic", textAlign: "center", paddingVertical: 10 }}>
                                    No chapters yet
                                  </Text>
                                ) : (
                                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                                    {chapters.map((ch) => (
                                      <View key={ch.id} style={{ width: "47%" as any, borderRadius: 8, borderWidth: 1, borderColor: D.border, backgroundColor: D.card, padding: 8 }}>
                                        <Text style={{ fontSize: 11, fontWeight: "600", color: D.text, marginBottom: 2, lineHeight: 14 }} numberOfLines={2}>{ch.title}</Text>
                                        <Text style={{ fontSize: 10, color: D.muted, marginBottom: 7 }}>Order #{ch.orderIndex}</Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                          {/* HTML upload button */}
                                          <TouchableOpacity
                                            onPress={() => handleUploadHtml(ch.id, ch.title, sub.id)}
                                            disabled={uploadingId === ch.id}
                                            style={{ flexDirection: "row", alignItems: "center", gap: 3, flex: 1, borderWidth: 1, borderColor: D.border2, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 4 }}
                                          >
                                            {uploadingId === ch.id ? (
                                              <ActivityIndicator size="small" color={D.primary} />
                                            ) : (
                                              <>
                                                <Feather name="upload" size={9} color={D.muted} />
                                                <Text style={{ fontSize: 9, color: D.muted, fontWeight: "500" }}>HTML upload</Text>
                                              </>
                                            )}
                                          </TouchableOpacity>
                                          {/* Delete chapter */}
                                          <TouchableOpacity
                                            onPress={() => delChapter(ch.id, ch.title, sub.id)}
                                            style={{ width: 24, height: 24, borderRadius: 5, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239,68,68,0.1)" }}
                                          >
                                            <Feather name="trash-2" size={11} color={D.danger} />
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    ))}
                                  </View>
                                )}
                              </View>

                            </View>
                          );
                        })
                      )}
                    </ScrollView>
                  )}
                </View>
              );
            })
          )}

          {/* ── Live Logs ── */}
          <View style={{ marginTop: 24, marginBottom: 8 }}>
            <LogsPanel logs={logs} />
          </View>

        </Constrained>
      </ScrollView>

      {/* ── Modal ── */}
      <Modal visible={!!modal} animationType="slide" transparent onRequestClose={() => setModal(null)}>
        <View style={s.modalOverlay}>
          <View style={[
            s.modalBox,
            { backgroundColor: colors.card, borderColor: colors.border },
            isWeb ? { maxWidth: 520, width: "100%" as any, alignSelf: "center" as any, borderRadius: 20, marginBottom: 40 } as any : {},
          ]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={[s.modalIconBox, { backgroundColor: colors.secondary }]}>
                  <Feather name={modal?.kind === "semester" ? "layers" : modal?.kind === "subject" ? "book" : "file-text"} size={16} color={colors.accent} />
                </View>
                <Text style={[s.modalTitle, { color: colors.text }]} numberOfLines={1}>
                  {modal?.kind === "semester" && "New Semester"}
                  {modal?.kind === "subject" && `New Subject — ${(modal as any).semesterName}`}
                  {modal?.kind === "chapter" && `New Chapter — ${(modal as any).subjectName}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModal(null)} style={[s.modalCloseBtn, { backgroundColor: colors.secondary }]}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {modal?.kind === "semester" && (
                <>
                  <MField label="ID (slug) *" placeholder="e.g. sem-1-cse" value={semForm.id} onChange={(v) => setSemForm((f) => ({ ...f, id: v }))} />
                  <MField label="Semester Name *" placeholder="e.g. Semester 1" value={semForm.name} onChange={(v) => setSemForm((f) => ({ ...f, name: v }))} />
                  <SegmentControl label="College" options={["CSE", "EEE"]} value={semForm.college} onChange={(v) => setSemForm((f) => ({ ...f, college: v }))} />
                  <MField label="Order Index" placeholder="1" value={semForm.orderIndex} onChange={(v) => setSemForm((f) => ({ ...f, orderIndex: v }))} keyboardType="numeric" />
                </>
              )}
              {modal?.kind === "subject" && (
                <>
                  <MField label="Subject ID (slug) *" placeholder="e.g. maths-1" value={subForm.id} onChange={(v) => setSubForm((f) => ({ ...f, id: v }))} />
                  <MField label="Subject Name *" placeholder="e.g. Mathematics I" value={subForm.name} onChange={(v) => setSubForm((f) => ({ ...f, name: v }))} />
                  <MField label="Subject Code *" placeholder="e.g. MA101" value={subForm.code} onChange={(v) => setSubForm((f) => ({ ...f, code: v }))} />
                  <MField label="Description (optional)" placeholder="Brief description" value={subForm.description} onChange={(v) => setSubForm((f) => ({ ...f, description: v }))} />
                  <MField label="Semester Number" placeholder="1" value={subForm.semester} onChange={(v) => setSubForm((f) => ({ ...f, semester: v }))} keyboardType="numeric" />
                  <SegmentControl label="College" options={["CSE", "EEE"]} value={subForm.college} onChange={(v) => setSubForm((f) => ({ ...f, college: v }))} />
                  <MField label="Color (hex)" placeholder="#8B5CF6" value={subForm.color} onChange={(v) => setSubForm((f) => ({ ...f, color: v }))} />
                  <MField label="Icon (Feather name)" placeholder="book" value={subForm.icon} onChange={(v) => setSubForm((f) => ({ ...f, icon: v }))} />
                </>
              )}
              {modal?.kind === "chapter" && (
                <>
                  <MField label="Chapter Title *" placeholder="e.g. Introduction to Matrices" value={chapForm.title} onChange={(v) => setChapForm((f) => ({ ...f, title: v }))} />
                  <MField label="Order Index" placeholder="1" value={chapForm.orderIndex} onChange={(v) => setChapForm((f) => ({ ...f, orderIndex: v }))} keyboardType="numeric" />
                  <MField label="Chapter ID (optional)" placeholder="auto-generated if blank" value={chapForm.id} onChange={(v) => setChapForm((f) => ({ ...f, id: v }))} />
                  <Text style={[s.label, { color: colors.mutedForeground, marginBottom: 8 }]}>Upload HTML Notes (optional)</Text>
                  <TouchableOpacity onPress={() => pickHtml((c, n) => { setChapHtml(c); setChapFile(n); })} style={[s.htmlPickerBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Feather name="upload-cloud" size={18} color={colors.accent} />
                    <Text style={[s.htmlPickerText, { color: colors.text }]}>{chapFile || "Choose an HTML file…"}</Text>
                  </TouchableOpacity>
                  {!!chapFile && (
                    <View style={[s.htmlFileTag, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }]}>
                      <Feather name="check-circle" size={13} color={colors.accent} />
                      <Text style={[s.htmlFileTagText, { color: colors.text }]}>{chapFile} ready</Text>
                      <TouchableOpacity onPress={() => { setChapHtml(""); setChapFile(""); }}>
                        <Feather name="x" size={13} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={{ height: 12 }} />
                </>
              )}
            </ScrollView>

            <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.primaryBtn, { marginTop: 12 }]}>
              <LinearGradient colors={[colors.primary, colors.tint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtnGrad}>
                {saving
                  ? <ActivityIndicator color={colors.primaryForeground} />
                  : <Text style={[s.primaryBtnText, { color: colors.primaryForeground }]}>
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
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.input }]}
        placeholder={placeholder} placeholderTextColor={colors.mutedForeground}
        value={value} onChangeText={onChange}
        keyboardType={keyboardType ?? "default"} autoCapitalize="none"
      />
    </View>
  );
}

// ─── Segment control ──────────────────────────────────────────────────────────
function SegmentControl({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={s.segRow}>
        {options.map((o) => (
          <TouchableOpacity key={o} onPress={() => onChange(o)}
            style={[s.segBtn, { backgroundColor: colors.input, borderColor: colors.border }, value === o && { backgroundColor: colors.secondary, borderColor: colors.accent }]}>
            <Text style={[s.segBtnText, { color: colors.mutedForeground }, value === o && { color: colors.text }]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // modal
  modalOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalBox:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, borderTopWidth: 1 },
  modalHeader:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalIconBox:    { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalTitle:      { fontSize: 16, fontWeight: "700", flex: 1 },
  modalCloseBtn:   { padding: 6, borderRadius: 8 },

  // form
  label:           { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 6 },
  input:           { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  pwRow:           { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  eyeBtn:          { padding: 13, borderRadius: 10, borderWidth: 1 },
  errorBox:        { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.06)", borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText:       { fontSize: 13, flex: 1 },
  segRow:          { flexDirection: "row", gap: 8 },
  segBtn:          { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 10, borderWidth: 1 },
  segBtnText:      { fontSize: 14, fontWeight: "600" },
  htmlPickerBtn:   { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  htmlPickerText:  { fontSize: 14, fontWeight: "500", flex: 1 },
  htmlFileTag:     { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  htmlFileTagText: { flex: 1, fontSize: 12, fontWeight: "500" },

  // buttons
  primaryBtn:     { borderRadius: 10, overflow: "hidden" },
  primaryBtnGrad: { height: 52, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
  backLink:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, paddingVertical: 4 },
  backLinkText:   { fontSize: 14 },

  // login
  loginLogoBox: { width: 72, height: 72, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  loginTitle:   { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  loginSub:     { fontSize: 14, textAlign: "center" },
  formCard:     { borderRadius: 10, borderWidth: 1, padding: 24 },
});
