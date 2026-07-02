import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { COLLEGES } from "@/data/content";
import { WaveFlow } from "@/components/WaveFlow";

const isWeb = Platform.OS === "web";

const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const YEAR_VALUES = ["1", "2", "3", "4"];

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG        = "#080B1A";
const CARD      = "rgba(15,18,40,0.88)";
const CARD_HOV  = "rgba(22,26,56,0.95)";
const BORDER    = "rgba(124,92,252,0.18)";
const BORDER_H  = "rgba(124,92,252,0.45)";
const PURPLE    = "#7C5CFC";
const PURPLE_DIM = "rgba(124,92,252,0.15)";
const PURPLE_TXT = "#A78BFA";
const PURPLE_LIT = "#C4B5FD";
const MUTED     = "#6B7280";
const FG        = "#E2E8F0";
const DANGER    = "#F87171";
const DANGER_DIM = "rgba(248,113,113,0.12)";
// ─────────────────────────────────────────────────────────────────────────────

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCollege, isSubscribed, isDark, toggleTheme, resetCollege } = useApp();
  const { user, logout, isAdmin, updateProfile } = useAuth();
  const topPad = isWeb ? 67 : insets.top;
  const botPad = isWeb ? 34 : insets.bottom;

  const [editVisible, setEditVisible]   = useState(false);
  const [editFirst, setEditFirst]       = useState("");
  const [editLast, setEditLast]         = useState("");
  const [editCollege, setEditCollege]   = useState<"CSE" | "EEE">("CSE");
  const [editYear, setEditYear]         = useState("1");
  const [editSaving, setEditSaving]     = useState(false);
  const [editError, setEditError]       = useState("");

  if (!selectedCollege) return null;
  const college = COLLEGES[selectedCollege];

  function openEdit() {
    setEditFirst(user?.name?.split(" ")[0] ?? "");
    setEditLast(user?.name?.split(" ").slice(1).join(" ") ?? "");
    setEditCollege((user?.college as "CSE" | "EEE") ?? "CSE");
    setEditYear(user?.year ?? "1");
    setEditError("");
    setEditVisible(true);
  }

  async function handleSaveProfile() {
    if (!editFirst.trim()) { setEditError("First name is required"); return; }
    setEditSaving(true);
    const result = await updateProfile({
      firstName: editFirst.trim(),
      lastName: editLast.trim(),
      college: editCollege,
      year: editYear,
    });
    setEditSaving(false);
    if (result.error) { setEditError(result.error); return; }
    setEditVisible(false);
  }

  function handleChangeCollege() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isWeb) {
      resetCollege().then(() => router.replace("/onboarding"));
      return;
    }
    Alert.alert(
      "Change College",
      "Are you sure you want to switch your college? Your progress will be reset.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Switch", style: "destructive",
          onPress: async () => { await resetCollege(); router.replace("/onboarding"); } },
      ]
    );
  }

  function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isWeb) { logout().then(() => router.replace("/login")); return; }
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive",
        onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  }

  const yearLabel = YEAR_LABELS[YEAR_VALUES.indexOf(user?.year ?? "1")] ?? "1st Year";

  const menuItems = [
    { icon: "moon" as const,      label: isDark ? "Dark Mode" : "Light Mode", toggle: true },
    { icon: "edit-2" as const,    label: "Edit Profile",    onPress: openEdit },
    { icon: "book-open" as const, label: "My Subjects",     onPress: () => router.push("/(tabs)/library") },
    { icon: "refresh-cw" as const,label: "Change College",  onPress: handleChangeCollege },
    ...(isAdmin ? [{ icon: "shield" as const, label: "Admin Panel", onPress: () => router.push("/(admin)"), admin: true }] : []),
    { icon: "log-out" as const,   label: "Log Out",         onPress: handleLogout, danger: true },
  ];

  return (
    <>
      <View style={[s.root, { backgroundColor: BG }]}>

        {/* ── Profile hero with WaveFlow ──────────────────────────── */}
        <View style={[s.heroWrap, { paddingTop: topPad + 16 }]}>
          <WaveFlow />
          {/* Gradient overlay to blend into BG */}
          {isWeb && React.createElement("div", {
            style: {
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: "40%",
              background: `linear-gradient(to bottom, transparent, ${BG})`,
              pointerEvents: "none",
            },
          } as any)}

          <TouchableOpacity onPress={openEdit} style={s.avatar} activeOpacity={0.8}>
            <View style={[s.avatarInner, isWeb ? {
              boxShadow: "0 0 0 2px rgba(124,92,252,0.5), 0 0 28px rgba(124,92,252,0.35)",
            } as any : {}]}>
              <Text style={s.avatarInitial}>
                {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <View style={[s.editBadge, { backgroundColor: PURPLE }]}>
              <Feather name="edit-2" size={10} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={s.userName}>{user?.name ?? "Student"}</Text>
          <Text style={s.userEmail}>{user?.email ?? ""}</Text>
          <Text style={s.collegeName}>{college.name} · {yearLabel}</Text>

          {isAdmin ? (
            <View style={[s.badge, { backgroundColor: "rgba(124,92,252,0.25)", borderColor: BORDER_H }]}>
              <Feather name="shield" size={12} color={PURPLE_LIT} />
              <Text style={[s.badgeText, { color: PURPLE_LIT }]}>Admin</Text>
            </View>
          ) : isSubscribed ? (
            <View style={[s.badge, { backgroundColor: "rgba(251,191,36,0.18)", borderColor: "rgba(251,191,36,0.4)" }]}>
              <Feather name="star" size={12} color="#FCD34D" />
              <Text style={[s.badgeText, { color: "#FCD34D" }]}>Pro Member</Text>
            </View>
          ) : (
            <View style={[s.badge, { backgroundColor: PURPLE_DIM, borderColor: BORDER }]}>
              <Text style={[s.badgeText, { color: PURPLE_TXT }]}>Student</Text>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: botPad + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Menu grid (two-column on wide, single on narrow) ─── */}
          <View style={s.body}>
            <View style={s.menuGrid}>
              {menuItems.map((item, i) => (
                <MenuItem key={item.label} item={item} isDark={isDark} toggleTheme={toggleTheme} />
              ))}
            </View>

            {/* ── About card ─────────────────────────────────────── */}
            <AboutCard />
          </View>
        </ScrollView>
      </View>

      {/* ── Edit profile modal ──────────────────────────────────── */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[
            s.modalBox,
            isWeb ? {
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              backgroundColor: "rgba(12,15,34,0.97)",
              borderColor: BORDER,
              boxShadow: "0 -4px 40px rgba(0,0,0,0.6)",
            } as any : { backgroundColor: "#0F1228" },
          ]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Feather name="x" size={22} color={MUTED} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={s.fieldRow}>
                {[
                  { label: "First Name *", value: editFirst, setter: setEditFirst },
                  { label: "Last Name",    value: editLast,  setter: setEditLast  },
                ].map(({ label, value, setter }) => (
                  <View key={label} style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>{label}</Text>
                    <TextInput
                      style={s.fieldInput}
                      value={value}
                      onChangeText={setter}
                      placeholder={label.replace(" *", "")}
                      placeholderTextColor={MUTED}
                      autoCapitalize="words"
                    />
                  </View>
                ))}
              </View>

              <Text style={[s.fieldLabel, { marginTop: 12 }]}>College</Text>
              <View style={s.pillRow}>
                {(["CSE", "EEE"] as const).map((c) => (
                  <TouchableOpacity key={c} onPress={() => setEditCollege(c)}
                    style={[s.pill, editCollege === c
                      ? { borderColor: PURPLE, backgroundColor: PURPLE_DIM }
                      : { borderColor: BORDER, backgroundColor: "transparent" }
                    ]}
                  >
                    <Text style={[s.pillText, { color: editCollege === c ? PURPLE_LIT : MUTED }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.fieldLabel, { marginTop: 12 }]}>Year</Text>
              <View style={s.pillRow}>
                {YEAR_LABELS.map((label, i) => (
                  <TouchableOpacity key={label} onPress={() => setEditYear(YEAR_VALUES[i])}
                    style={[s.pill, editYear === YEAR_VALUES[i]
                      ? { borderColor: PURPLE, backgroundColor: PURPLE_DIM }
                      : { borderColor: BORDER, backgroundColor: "transparent" }
                    ]}
                  >
                    <Text style={[s.pillText, { color: editYear === YEAR_VALUES[i] ? PURPLE_LIT : MUTED, fontSize: 12 }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!!editError && (
                <View style={s.errorBox}>
                  <Feather name="alert-circle" size={14} color={DANGER} />
                  <Text style={s.errorText}>{editError}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleSaveProfile} disabled={editSaving}
                style={[s.saveBtn, { marginTop: 20 }]} activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#6D28D9", "#7C5CFC"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.saveBtnGrad}
                >
                  {editSaving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.saveBtnText}>Save Changes</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MenuItem({ item, isDark, toggleTheme }: { item: any; isDark: boolean; toggleTheme: () => void }) {
  const [hov, setHov] = useState(false);
  const isToggle  = item.toggle === true;
  const isDanger  = item.danger === true;
  const isAdminIt = item.admin  === true;

  const iconColor = isDanger ? DANGER : isAdminIt ? PURPLE_LIT : hov ? PURPLE_LIT : PURPLE_TXT;
  const iconBg    = isDanger ? DANGER_DIM : isAdminIt ? PURPLE_DIM : PURPLE_DIM;
  const labelColor = isDanger ? DANGER : isAdminIt ? PURPLE_LIT : FG;

  return (
    <TouchableOpacity
      onPress={isToggle ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); } : item.onPress}
      activeOpacity={0.8}
      {...(webHover(setHov) as any)}
      style={[
        s.menuItem,
        isWeb ? {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          backgroundColor: hov ? CARD_HOV : CARD,
          borderColor: hov ? (isDanger ? "rgba(248,113,113,0.35)" : BORDER_H) : BORDER,
          boxShadow: hov
            ? "0 0 0 1px rgba(124,92,252,0.2), 0 4px 20px rgba(124,92,252,0.12)"
            : "0 2px 10px rgba(0,0,0,0.25)",
          transition: "all 0.2s ease",
        } as any : { backgroundColor: CARD, borderColor: BORDER },
      ]}
    >
      <View style={[s.menuIconWrap, { backgroundColor: iconBg }]}>
        <Feather name={item.icon} size={16} color={iconColor} />
      </View>
      <Text style={[s.menuLabel, { color: labelColor }]}>{item.label}</Text>
      {isToggle
        ? <Switch value={isDark} onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
            trackColor={{ false: BORDER, true: PURPLE }}
            thumbColor="#fff"
          />
        : <Feather name="chevron-right" size={15} color={hov ? PURPLE_TXT : MUTED} />
      }
    </TouchableOpacity>
  );
}

function AboutCard() {
  return (
    <View style={[
      s.aboutCard,
      isWeb ? {
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        backgroundColor: CARD,
        borderColor: BORDER,
        boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
      } as any : { backgroundColor: CARD, borderColor: BORDER },
    ]}>
      <Text style={s.aboutTitle}>About StudyMate</Text>
      <Text style={s.aboutText}>
        StudyMate delivers rich, interactive study notes for engineering first-year students — built by seniors who know exactly what you need.
      </Text>
      <View style={s.statsRow}>
        {[
          { value: "2",    label: "Colleges" },
          { value: "10+",  label: "Subjects" },
          { value: "Free", label: "Access" },
        ].map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <View style={s.statDiv} />}
            <View style={s.stat}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, position: "relative" as any },
  heroWrap: {
    alignItems: "center", paddingHorizontal: 20, paddingBottom: 28,
    position: "relative" as any, overflow: "hidden" as any,
    minHeight: 220,
  },
  avatar: { marginBottom: 12 },
  avatarInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(124,92,252,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  editBadge: {
    position: "absolute", bottom: 2, right: 2, borderRadius: 10,
    width: 22, height: 22, alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { color: "#fff", fontSize: 34, fontFamily: "Inter_700Bold" },
  userName:  { color: FG, fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  userEmail: { color: MUTED, fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  collegeName:{ color: MUTED, fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  body: { padding: 16, gap: 12, maxWidth: 860, width: "100%" as any, alignSelf: "center" as any },
  menuGrid: { gap: 8 },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 12,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },

  aboutCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 10 },
  aboutTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: FG },
  aboutText:  { fontSize: 13, fontFamily: "Inter_400Regular", color: MUTED, lineHeight: 20 },
  statsRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: 4 },
  stat:       { alignItems: "center" },
  statValue:  { fontSize: 22, fontFamily: "Inter_700Bold", color: PURPLE_TXT },
  statLabel:  { fontSize: 12, fontFamily: "Inter_400Regular", color: MUTED },
  statDiv:    { width: 1, height: 36, backgroundColor: BORDER },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  modalBox: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: "85%" as any,
    borderWidth: 1, borderBottomWidth: 0,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: FG },
  fieldRow: { flexDirection: "row", gap: 12 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: MUTED, letterSpacing: 1, marginBottom: 8 },
  fieldInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, fontFamily: "Inter_400Regular",
    color: FG, backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: BORDER,
  },
  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" as any, marginBottom: 4 },
  pill: { borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, alignItems: "center" },
  pillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 12, marginTop: 8,
    backgroundColor: DANGER_DIM, borderWidth: 1, borderColor: "rgba(248,113,113,0.25)",
  },
  errorText: { color: DANGER, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  saveBtn: { borderRadius: 14, overflow: "hidden" },
  saveBtnGrad: { height: 52, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
