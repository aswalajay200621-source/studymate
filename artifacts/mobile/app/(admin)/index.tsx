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
      <View style={{ maxWidth: 860, width: "100%" as any, alignSelf: "center" as any }}>
        {children}
      </View>
    </View>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label }: { value: number | string; label: string }) {
  const colors = useColors();
  return (
    <View style={[s.statPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[s.statValue, { color: colors.text, fontFamily: isWeb ? "'Playfair Display', serif" : "System" }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.mutedForeground, fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System" }]}>{label}</Text>
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
        await adminFetch("/admin/semesters", {
          method: "POST",
          body: JSON.stringify({
            id: semForm.id.trim(),
            name: semForm.name.trim(),
            college: semForm.college,
            orderIndex: Number(semForm.orderIndex) || 0,
          }),
        });
        await loadData();
      } else if (modal.kind === "subject") {
        if (!subForm.id || !subForm.name || !subForm.code) throw new Error("ID, Name and Code are required");
        await adminFetch("/admin/subjects", {
          method: "POST",
          body: JSON.stringify({
            id: subForm.id.trim(),
            name: subForm.name.trim(),
            code: subForm.code.trim().toUpperCase(),
            semester: Number(subForm.semester) || 1,
            semesterId: modal.semesterId,
            college: subForm.college,
            description: subForm.description,
            color: subForm.color,
            icon: subForm.icon,
          }),
        });
        await loadData();
      } else {
        if (!chapForm.title) throw new Error("Chapter title is required");
        const id = chapForm.id.trim() || `chap-${Date.now()}`;
        await adminFetch("/admin/chapters", {
          method: "POST",
          body: JSON.stringify({
            id,
            subjectId: modal.subjectId,
            title: chapForm.title.trim(),
            orderIndex: Number(chapForm.orderIndex) || 0,
            ...(chapHtml ? { contentHtml: chapHtml } : {}),
          }),
        });
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
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
          <Constrained>
            {/* Logo */}
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
                  placeholder="Admin password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onSubmitEditing={() => password && login(password)}
                  returnKeyType="go"
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

              <TouchableOpacity
                onPress={() => password && login(password)}
                disabled={tokenLoading || !password}
                activeOpacity={0.85}
                style={[s.primaryBtn, { marginTop: 12 }, (!password || tokenLoading) && { opacity: 0.5 }]}
              >
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
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  const totalChapters = Object.values(chapterMap).reduce((a, c) => a + c.length, 0);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: botPad + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: topPad + (isWeb ? 24 : 48), borderBottomColor: colors.border, borderBottomWidth: 1, backgroundColor: colors.card }]}>
          <Constrained style={{ paddingHorizontal: 20 }}>
            <View style={s.headerRow}>
              <View style={s.headerLeft}>
                <View style={[s.headerLogoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 16 }}>📚</Text>
                </View>
                <Text style={[s.headerTitle, { color: colors.text, fontFamily: isWeb ? "'Playfair Display', serif" : "System" }]}>StudyMate Admin</Text>
              </View>
              
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {/* Theme Toggle option */}
                <TouchableOpacity
                  onPress={toggleTheme}
                  style={[s.themeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                >
                  <Feather name={isDark ? "sun" : "moon"} size={14} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSignOut} style={[s.signOutBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="log-out" size={13} color={colors.destructive} />
                  <Text style={[s.signOutText, { color: colors.destructive }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <StatPill value={semesters.length} label="Semesters" />
              <StatPill value={subjects.length} label="Subjects" />
              <StatPill value={totalChapters} label="Chapters" />
            </View>
          </Constrained>
        </View>

        {/* ── Content tree ── */}
        <Constrained style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          {/* Section header */}
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.text, fontFamily: isWeb ? "'Playfair Display', serif" : "System" }]}>Shelf Directory</Text>
            <TouchableOpacity onPress={openSemModal} style={[s.addBtn, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={14} color={colors.primaryForeground} />
              <Text style={[s.addBtnText, { color: colors.primaryForeground }]}>New Semester</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <ActivityIndicator color={colors.accent} size="large" />
            </View>
          ) : semesters.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="layers" size={32} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>No semesters shelf yet</Text>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Tap "New Semester" above to get started</Text>
            </View>
          ) : (
            semesters.map((sem) => {
              const semSubs = subjects.filter((sub) => sub.semesterId === sem.id || String(sub.semester) === String(sem.orderIndex));
              const isOpen = !!openSemesters[sem.id];

              return (
                <View key={sem.id} style={[s.semBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {/* ── Semester row ── */}
                  <View style={s.semRow}>
                    <TouchableOpacity onPress={() => toggleSem(sem.id)} style={s.semToggle} activeOpacity={0.7}>
                      <Feather name={isOpen ? "chevron-down" : "chevron-right"} size={16} color={colors.accent} />
                      <View style={[s.semIconBox, { backgroundColor: colors.secondary }]}>
                        <Feather name="layers" size={14} color={colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.semName, { color: colors.text, fontFamily: isWeb ? "'Playfair Display', serif" : "System" }]}>{sem.name}</Text>
                        <Text style={[s.semMeta, { color: colors.mutedForeground }]}>{sem.college} · {semSubs.length} subject{semSubs.length !== 1 ? "s" : ""}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => openSubModal(sem.id, sem.name, sem.orderIndex)} style={[s.inlineActionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                      <Feather name="plus" size={12} color={colors.text} />
                      <Text style={[s.inlineActionText, { color: colors.text }]}>Subject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => delSemester(sem.id, sem.name)} style={s.inlineDeleteBtn}>
                      <Feather name="trash-2" size={13} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>

                  {/* ── Subjects ── */}
                  {isOpen && (
                    <View style={[s.subjectsWrap, { borderTopColor: colors.border }]}>
                      {semSubs.length === 0 ? (
                        <View style={s.innerEmpty}>
                          <Feather name="book" size={14} color={colors.mutedForeground} />
                          <Text style={[s.innerEmptyText, { color: colors.mutedForeground }]}>No subjects — tap "+ Subject"</Text>
                        </View>
                      ) : semSubs.map((sub) => {
                        const chapters = chapterMap[sub.id] ?? [];
                        const subOpen = !!openSubjects[sub.id];
                        const subIndicatorColor = sub.college === "CSE" ? colors.cseColor : colors.eeeColor;

                        return (
                          <View key={sub.id} style={[s.subBlock, { borderTopColor: colors.border }]}>
                            {/* Subject row */}
                            <View style={[s.subRow, { backgroundColor: colors.background }]}>
                              <TouchableOpacity onPress={() => toggleSub(sub.id)} style={s.subToggle} activeOpacity={0.7}>
                                <Feather name={subOpen ? "chevron-down" : "chevron-right"} size={14} color={colors.mutedForeground} />
                                <View style={[s.subDot, { backgroundColor: subIndicatorColor }]} />
                                <View style={{ flex: 1 }}>
                                  <Text style={[s.subName, { color: colors.text, fontFamily: isWeb ? "'Playfair Display', serif" : "System" }]}>{sub.name}</Text>
                                  <Text style={[s.subMeta, { color: colors.mutedForeground }]}>{sub.code} · {subOpen ? `${chapters.length} chapter${chapters.length !== 1 ? "s" : ""}` : "tap to expand"}</Text>
                                </View>
                              </TouchableOpacity>

                              <TouchableOpacity onPress={() => openChapModal(sub.id, sub.name, chapters.length)} style={[s.inlineActionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                                <Feather name="file-plus" size={12} color={colors.text} />
                                <Text style={[s.inlineActionText, { color: colors.text }]}>Chapter</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => delSubject(sub.id, sub.name)} style={s.inlineDeleteBtn}>
                                <Feather name="trash-2" size={13} color={colors.destructive} />
                              </TouchableOpacity>
                            </View>

                            {/* ── Chapters ── */}
                            {subOpen && (
                              <View style={[s.chaptersWrap, { backgroundColor: colors.card }]}>
                                {!chapterMap[sub.id] ? (
                                  <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
                                ) : chapters.length === 0 ? (
                                  <View style={s.innerEmpty}>
                                    <Feather name="file-text" size={14} color={colors.mutedForeground} />
                                    <Text style={[s.innerEmptyText, { color: colors.mutedForeground }]}>No chapters — tap "+ Chapter"</Text>
                                  </View>
                                ) : chapters.map((ch) => (
                                  <View key={ch.id} style={[s.chapRow, { borderTopColor: colors.border }]}>
                                    <View style={[s.chapIconBox, { backgroundColor: colors.secondary }]}>
                                      <Feather name="file-text" size={12} color={colors.accent} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={[s.chapTitle, { color: colors.text }]} numberOfLines={1}>{ch.title}</Text>
                                      <Text style={[s.chapMeta, { color: colors.mutedForeground }]}>Order #{ch.orderIndex}</Text>
                                    </View>
                                    <TouchableOpacity
                                      onPress={() => handleUploadHtml(ch.id, ch.title, sub.id)}
                                      style={[s.uploadBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                                      disabled={uploadingId === ch.id}
                                    >
                                      {uploadingId === ch.id
                                        ? <ActivityIndicator size="small" color={colors.accent} />
                                        : <>
                                          <Feather name="upload" size={12} color={colors.text} />
                                          <Text style={[s.uploadBtnText, { color: colors.text }]}>HTML</Text>
                                        </>
                                      }
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => delChapter(ch.id, ch.title, sub.id)} style={s.inlineDeleteBtn}>
                                      <Feather name="trash-2" size={12} color={colors.destructive} />
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
          <View style={[
            s.modalBox,
            { backgroundColor: colors.card, borderColor: colors.border },
            isWeb ? { maxWidth: 520, width: "100%" as any, alignSelf: "center" as any, borderRadius: 20, marginBottom: 40 } as any : {}
          ]}>
            {/* Modal header */}
            <View style={s.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={[s.modalIconBox, { backgroundColor: colors.secondary }]}>
                  <Feather name={modal?.kind === "semester" ? "layers" : modal?.kind === "subject" ? "book" : "file-text"} size={16} color={colors.accent} />
                </View>
                <Text style={[s.modalTitle, { color: colors.text, fontFamily: isWeb ? "'Playfair Display', serif" : "System" }]} numberOfLines={1}>
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

              {/* ── Semester form ── */}
              {modal?.kind === "semester" && (
                <>
                  <MField label="ID (slug) *" placeholder="e.g. sem-1-cse" value={semForm.id} onChange={(v) => setSemForm((f) => ({ ...f, id: v }))} />
                  <MField label="Semester Name *" placeholder="e.g. Semester 1" value={semForm.name} onChange={(v) => setSemForm((f) => ({ ...f, name: v }))} />
                  <SegmentControl label="College" options={["CSE", "EEE"]} value={semForm.college} onChange={(v) => setSemForm((f) => ({ ...f, college: v }))} />
                  <MField label="Order Index" placeholder="1" value={semForm.orderIndex} onChange={(v) => setSemForm((f) => ({ ...f, orderIndex: v }))} keyboardType="numeric" />
                </>
              )}

              {/* ── Subject form ── */}
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

              {/* ── Chapter form ── */}
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
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
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
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={s.segRow}>
        {options.map((o) => (
          <TouchableOpacity key={o} onPress={() => onChange(o)} style={[s.segBtn, { backgroundColor: colors.input, borderColor: colors.border }, value === o && { backgroundColor: colors.secondary, borderColor: colors.accent }]}>
            <Text style={[s.segBtnText, { color: colors.mutedForeground }, value === o && { color: colors.text }]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex: 1 },

  // header
  header:         { paddingBottom: 20 },
  headerRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerLeft:     { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogoBox:  { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerTitle:    { fontSize: 18, fontWeight: "700" },
  signOutBtn:     { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  signOutText:    { fontSize: 13, fontWeight: "600" },
  themeBtn:       { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  statsRow:       { flexDirection: "row", gap: 10 },
  statPill:       { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  statValue:      { fontSize: 22, fontWeight: "700" },
  statLabel:      { fontSize: 11, marginTop: 2 },

  // section
  sectionHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle:   { fontSize: 17, fontWeight: "700" },
  addBtn:         { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText:     { fontSize: 13, fontWeight: "600" },

  // empty
  emptyCard:      { alignItems: "center", paddingVertical: 52, gap: 10, marginTop: 8, borderRadius: 10, borderWidth: 1 },
  emptyTitle:     { fontSize: 16, fontWeight: "600" },
  emptyText:      { fontSize: 13, textAlign: "center" },
  innerEmpty:     { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 16 },
  innerEmptyText: { fontSize: 13 },

  // semester block
  semBlock:       { borderRadius: 10, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  semRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14 },
  semToggle:      { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
  semIconBox:     { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  semName:        { fontSize: 14, fontWeight: "600" },
  semMeta:        { fontSize: 11, marginTop: 1 },

  // subject block
  subjectsWrap:   { borderTopWidth: 1 },
  subBlock:       { borderTopWidth: 1 },
  subRow:         { flexDirection: "row", alignItems: "center", paddingLeft: 36, paddingRight: 14, paddingVertical: 12 },
  subToggle:      { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
  subDot:         { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  subName:        { fontSize: 13, fontWeight: "600" },
  subMeta:        { fontSize: 11, marginTop: 1 },

  // chapter rows
  chaptersWrap:   { },
  chapRow:        { flexDirection: "row", alignItems: "center", paddingLeft: 56, paddingRight: 14, paddingVertical: 10, borderTopWidth: 1 },
  chapIconBox:    { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0 },
  chapTitle:      { fontSize: 13, fontWeight: "500" },
  chapMeta:       { fontSize: 11, marginTop: 1 },

  // inline action buttons
  inlineActionBtn:{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, marginLeft: 6, borderWidth: 1, flexShrink: 0 },
  inlineActionText:{ fontSize: 11, fontWeight: "600" },
  inlineDeleteBtn:{ padding: 7, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 8, marginLeft: 5, flexShrink: 0 },
  uploadBtn:      { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, marginLeft: 6, borderWidth: 1, flexShrink: 0 },
  uploadBtnText:  { fontSize: 11, fontWeight: "600" },

  // modal
  modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, borderTopWidth: 1 },
  modalHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalIconBox:   { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalTitle:     { fontSize: 16, fontWeight: "700", flex: 1 },
  modalCloseBtn:  { padding: 6, borderRadius: 8 },

  // form
  label:          { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 6 },
  input:          { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  pwRow:          { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  eyeBtn:         { padding: 13, borderRadius: 10, borderWidth: 1 },
  errorBox:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.06)", borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText:      { fontSize: 13, flex: 1 },
  segRow:         { flexDirection: "row", gap: 8 },
  segBtn:         { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 10, borderWidth: 1 },
  segBtnText:     { fontSize: 14, fontWeight: "600" },
  htmlPickerBtn:  { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  htmlPickerText: { fontSize: 14, fontWeight: "500", flex: 1 },
  htmlFileTag:    { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  htmlFileTagText:{ flex: 1, fontSize: 12, fontWeight: "500" },

  // buttons
  primaryBtn:     { borderRadius: 10, overflow: "hidden" },
  primaryBtnGrad: { height: 52, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
  backLink:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, paddingVertical: 4 },
  backLinkText:   { fontSize: 14 },

  // login
  loginLogoBox:   { width: 72, height: 72, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  loginTitle:     { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  loginSub:       { fontSize: 14, textAlign: "center" },
  formCard:       { borderRadius: 10, borderWidth: 1, padding: 24 },
});
