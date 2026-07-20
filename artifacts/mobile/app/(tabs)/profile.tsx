import { router } from "expo-router";
import React, { useState } from "react";
import {
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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { COLLEGES } from "@/data/content";
import { useColors } from "@/hooks/useColors";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const isWeb = Platform.OS === "web";

const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const YEAR_VALUES = ["1", "2", "3", "4"];

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          "#0b1326",
  card:        "rgba(30,41,59,0.75)",
  border:      "rgba(255,255,255,0.08)",
  primary:     "#bdc2ff",
  primaryCont: "#818cf8",
  secondary:   "#b9c7e0",
  tertiary:    "#f7bd3e",
  text:        "#dae2fd",
  muted:       "#c6c5d5",
  surface:     "#171f33",
  surfaceHigh: "#2d3449",
  error:       "#ffb4ab",
};

function glass(extra?: object) {
  return [
    {
      backgroundColor: C.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.border,
    },
    isWeb ? {
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.12)",
    } as any : {},
    extra ?? {},
  ];
}

// ─── Row item ─────────────────────────────────────────────────────────────────
function ActionRow({
  icon, label, sublabel, iconColor, danger, chevron, toggle, toggleVal, onToggle, onPress,
}: {
  icon: string; label: string; sublabel?: string;
  iconColor?: string; danger?: boolean; chevron?: boolean;
  toggle?: boolean; toggleVal?: boolean; onToggle?: () => void;
  onPress?: () => void;
}) {
  const [hov, setHov] = useState(false);
  const ic = danger ? C.error : (iconColor ?? C.primary);
  const bg = danger ? "rgba(255,180,171,0.08)" : "rgba(189,194,255,0.08)";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      {...(isWeb ? { onMouseEnter: () => setHov(true), onMouseLeave: () => setHov(false) } as any : {})}
      style={[
        s.actionRow,
        {
          backgroundColor: hov
            ? (danger ? "rgba(255,180,171,0.06)" : "rgba(255,255,255,0.03)")
            : "rgba(255,255,255,0.02)",
          borderColor: hov ? (danger ? "rgba(255,180,171,0.3)" : C.primary + "44") : C.border,
        },
        isWeb ? { transition: "all 0.2s ease" } as any : {},
      ]}
    >
      <View style={[s.actionIcon, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={18} color={ic} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.actionLabel, { color: danger ? C.error : C.text }]}>{label}</Text>
        {sublabel ? <Text style={s.actionSub}>{sublabel}</Text> : null}
      </View>
      {toggle ? (
        <Switch
          value={toggleVal}
          onValueChange={onToggle}
          trackColor={{ false: C.surfaceHigh, true: C.tertiary }}
          thumbColor="#fff"
        />
      ) : (
        <Feather
          name="chevron-right"
          size={16}
          color={danger ? C.error + "88" : C.muted}
          style={isWeb ? ({ transition: "transform 0.2s" } as any) : undefined}
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Profile card (left column) ───────────────────────────────────────────────
function ProfileCard({ user, college, yearLabel, isAdmin, isSubscribed, onEditPress }: any) {
  const initials = user?.name?.slice(0, 2)?.toUpperCase() ?? "SM";
  return (
    <View style={[glass(s.profileCard) as any]}>
      {/* Avatar */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <View style={s.avatarWrap}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
          <TouchableOpacity style={s.editBadge} onPress={onEditPress} activeOpacity={0.85}>
            <Feather name="edit-2" size={12} color={C.bg} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.profileName}>{user?.name ?? "Student"}</Text>
      <Text style={s.profileEmail}>{user?.email ?? ""}</Text>

      {/* College pill */}
      <View style={s.collegePill}>
        <Feather name="book" size={13} color={C.primary} />
        <Text style={s.collegePillText}>
          {college?.name ?? ""} · {yearLabel}
        </Text>
      </View>

      {/* Member badge */}
      <View style={s.memberBadge}>
        <Text style={s.memberBadgeText}>
          {isAdmin ? "Library Admin" : isSubscribed ? "Pro Student Member" : "Member"}
        </Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCollege, isSubscribed, isDark, toggleTheme, resetCollege } = useApp();
  const { user, logout, isAdmin, updateProfile } = useAuth();
  const isDesktop = useIsDesktop();
  const topPad = isWeb ? 72 : insets.top + 16;
  const botPad = isWeb ? 40 : insets.bottom + 80;

  const [editVisible, setEditVisible]   = useState(false);
  const [editFirst, setEditFirst]       = useState("");
  const [editLast, setEditLast]         = useState("");
  const [editCollege, setEditCollege]   = useState<"CSE" | "EEE">("CSE");
  const [editYear, setEditYear]         = useState("1");
  const [editSaving, setEditSaving]     = useState(false);
  const [editError, setEditError]       = useState("");

  if (!selectedCollege) return null;
  const college = COLLEGES[selectedCollege];
  const yearLabel = YEAR_LABELS[YEAR_VALUES.indexOf(user?.year ?? "1")] ?? "1st Year";

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
    if (isWeb) { resetCollege().then(() => router.replace("/onboarding")); return; }
    Alert.alert(
      "Change College Shelf",
      "Switch your college shelf? Progress will be reset.",
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

  return (
    <>
      <View style={[s.root, { backgroundColor: C.bg }]}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={isDesktop ? s.bentoRow : s.bentoStack}>

            {/* ── Left: Profile card ── */}
            <ProfileCard
              user={user}
              college={college}
              yearLabel={yearLabel}
              isAdmin={isAdmin}
              isSubscribed={isSubscribed}
              onEditPress={openEdit}
            />

            {/* ── Right: Action sections ── */}
            <View style={[isDesktop ? s.rightCol : {}, { gap: 20 }]}>

              {/* Account & Identity */}
              <View style={{ gap: 10 }}>
                <Text style={s.sectionLabel}>Account &amp; Identity</Text>
                <ActionRow
                  icon="user"
                  label="Edit Profile"
                  sublabel="Update info & avatar"
                  onPress={openEdit}
                />
                <ActionRow
                  icon="home"
                  label="College Shelf"
                  sublabel="Change institution"
                  onPress={handleChangeCollege}
                />
              </View>

              {/* Environment */}
              <View style={{ gap: 10 }}>
                <Text style={[s.sectionLabel, { color: C.tertiary + "bb" }]}>Environment</Text>
                <ActionRow
                  icon="moon"
                  label="Midnight Mode"
                  sublabel="Dynamic OLED dark theme"
                  iconColor={C.tertiary}
                  toggle
                  toggleVal={isDark}
                  onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
                />
                <ActionRow
                  icon="book-open"
                  label="Subject Shelf"
                  sublabel="Manage your curriculum"
                  iconColor={C.tertiary}
                  onPress={() => router.push("/(tabs)/library")}
                />
              </View>

              {/* About card */}
              <View style={[glass(s.aboutCard) as any]}>
                {/* Glow */}
                {isWeb && (
                  <View style={s.aboutGlow} />
                )}
                <Text style={s.aboutTitle}>About StudyMate</Text>
                <Text style={s.aboutDesc}>
                  The Academic Ledger. Curated engineering wisdom from seniors, delivered via an interactive digital experience. Built for those who study when the world sleeps.
                </Text>
                <View style={s.statsRow}>
                  {[
                    { val: "02",  label: "Colleges",  color: C.primary },
                    { val: "10+", label: "Subjects",  color: C.primary },
                    { val: "∞",   label: "Access",    color: C.tertiary },
                  ].map((stat, i) => (
                    <React.Fragment key={stat.label}>
                      {i > 0 && <View style={s.statDivider} />}
                      <View style={s.stat}>
                        <Text style={[s.statVal, { color: stat.color }]}>{stat.val}</Text>
                        <Text style={s.statLabel}>{stat.label}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </View>

              {/* Sign out */}
              <ActionRow
                icon="log-out"
                label="Sign Out Account"
                sublabel="Session will be cleared"
                danger
                onPress={handleLogout}
              />

            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── Edit profile modal ── */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[
            s.modalBox,
            { backgroundColor: "#131b2e", borderColor: C.border },
            isWeb ? { maxWidth: 520, width: "100%" as any, alignSelf: "center" as any, borderRadius: 24, marginBottom: 40 } as any : {},
          ]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={s.modalClose}>
                <Feather name="x" size={18} color={C.muted} />
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
                      placeholderTextColor="rgba(189,194,255,0.3)"
                      autoCapitalize="words"
                    />
                  </View>
                ))}
              </View>

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>College</Text>
              <View style={s.pillRow}>
                {(["CSE", "EEE"] as const).map((c) => (
                  <TouchableOpacity key={c} onPress={() => setEditCollege(c)}
                    style={[s.pill, editCollege === c ? s.pillActive : s.pillInactive]}
                  >
                    <Text style={[s.pillText, { color: editCollege === c ? C.primary : C.muted }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Year</Text>
              <View style={s.pillRow}>
                {YEAR_LABELS.map((label, i) => (
                  <TouchableOpacity key={label} onPress={() => setEditYear(YEAR_VALUES[i])}
                    style={[s.pill, editYear === YEAR_VALUES[i] ? s.pillActive : s.pillInactive]}
                  >
                    <Text style={[s.pillText, { color: editYear === YEAR_VALUES[i] ? C.primary : C.muted, fontSize: 12 }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!!editError && (
                <View style={s.errorBox}>
                  <Feather name="alert-circle" size={14} color={C.error} />
                  <Text style={s.errorText}>{editError}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleSaveProfile} disabled={editSaving}
                style={[s.saveBtn, { marginTop: 24 }]} activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[C.primary, C.primaryCont]}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 0 },

  bentoRow:   {
    flexDirection: "row", gap: 20, alignItems: "flex-start",
    maxWidth: 1100, width: "100%" as any, alignSelf: "center" as any,
  },
  bentoStack: { flexDirection: "column", gap: 20 },
  rightCol:   { flex: 1, gap: 0 },

  // ── Profile card ──────────────────────────────────────────────────────────
  profileCard: {
    padding: 28, alignItems: "center",
    ...(isWeb ? { minWidth: 260, maxWidth: 320 } as any : {}),
  },
  avatarWrap:   { position: "relative", marginBottom: 16 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(189,194,255,0.12)",
    borderWidth: 2, borderColor: "rgba(189,194,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 36, fontWeight: "700", color: C.primary,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },
  editBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
    ...(isWeb ? { boxShadow: "0 2px 8px rgba(0,0,0,0.3)" } as any : {}),
  },
  profileName: {
    fontSize: 22, fontWeight: "700", color: C.text, textAlign: "center",
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 14,
    fontFamily: isWeb ? "'JetBrains Mono', monospace" : "System",
  },
  collegePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(189,194,255,0.08)",
    borderWidth: 1, borderColor: "rgba(189,194,255,0.18)",
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7,
    marginBottom: 16,
  },
  collegePillText: { fontSize: 12, color: C.primary, fontWeight: "600" },
  memberBadge: {
    backgroundColor: "rgba(189,194,255,0.15)",
    borderRadius: 8, paddingHorizontal: 20, paddingVertical: 6,
  },
  memberBadgeText: {
    fontSize: 11, fontWeight: "700", color: C.primary,
    letterSpacing: 1.2, textTransform: "uppercase",
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 10, fontWeight: "700", color: C.primary + "bb",
    letterSpacing: 2, textTransform: "uppercase",
    paddingHorizontal: 4, marginBottom: 2,
  },

  // ── Action row ────────────────────────────────────────────────────────────
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 20, borderWidth: 1,
    padding: 18, marginBottom: 8,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  actionLabel: { fontSize: 14, fontWeight: "600", color: C.text },
  actionSub:   { fontSize: 11, color: C.muted, marginTop: 1 },

  // ── About card ────────────────────────────────────────────────────────────
  aboutCard: {
    padding: 28, overflow: "hidden", marginBottom: 8, position: "relative",
  },
  aboutGlow: {
    position: "absolute", top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(189,194,255,0.06)",
    ...(isWeb ? { filter: "blur(60px)" } as any : {}),
    pointerEvents: "none" as any,
  },
  aboutTitle: {
    fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 10,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
    fontStyle: "italic",
  },
  aboutDesc:  { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 20 },
  statsRow:   { flexDirection: "row", alignItems: "center" },
  statDivider:{ width: 1, height: 36, backgroundColor: C.border, marginHorizontal: 20 },
  stat:       { flex: 1, alignItems: "center" },
  statVal:    {
    fontSize: 28, fontWeight: "700",
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },
  statLabel:  { fontSize: 9, color: C.muted, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 },

  // ── Edit modal ────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalBox: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: "85%" as any,
    borderWidth: 1, borderBottomWidth: 0,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle:  {
    fontSize: 20, fontWeight: "700", color: C.text,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },
  modalClose:  {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  fieldRow:    { flexDirection: "row", gap: 12 },
  fieldLabel:  { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.2, marginBottom: 8, textTransform: "uppercase" },
  fieldInput:  {
    borderWidth: 1, borderRadius: 10, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: C.text,
    backgroundColor: "rgba(255,255,255,0.03)",
    ...(isWeb ? { outlineStyle: "none" } as any : {}),
  },
  pillRow:     { flexDirection: "row", gap: 8, flexWrap: "wrap" as any, marginBottom: 4 },
  pill:        { borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, alignItems: "center" },
  pillActive:  { borderColor: C.primary, backgroundColor: "rgba(189,194,255,0.1)" },
  pillInactive:{ borderColor: C.border, backgroundColor: "transparent" },
  pillText:    { fontSize: 13, fontWeight: "600" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 12, marginTop: 8,
    backgroundColor: "rgba(255,180,171,0.06)", borderWidth: 1, borderColor: "rgba(255,180,171,0.2)",
  },
  errorText: { fontSize: 13, flex: 1, color: C.error },
  saveBtn:     { borderRadius: 12, overflow: "hidden" },
  saveBtnGrad: { height: 50, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#0b1326" },
});
