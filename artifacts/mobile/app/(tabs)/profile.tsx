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
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const YEAR_VALUES = ["1", "2", "3", "4"];

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
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
      "Change College Shelf",
      "Are you sure you want to switch your college shelf? Your progress will be reset.",
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
    { icon: "moon" as const,      label: isDark ? "Midnight Mode" : "Light Mode", toggle: true },
    { icon: "edit-2" as const,    label: "Edit Profile",    onPress: openEdit },
    { icon: "book-open" as const, label: "My Subjects Shelf", onPress: () => router.push("/(tabs)/library") },
    { icon: "refresh-cw" as const,label: "Change College Shelf", onPress: handleChangeCollege },
    { icon: "log-out" as const,   label: "Log Out Account",   onPress: handleLogout, danger: true },
  ];

  return (
    <>
      <View style={[s.root, { backgroundColor: colors.background }]}>

        {/* ── Profile hero header ── */}
        <View style={[s.heroWrap, { paddingTop: topPad + 32, borderBottomColor: colors.border, borderBottomWidth: 1, backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={openEdit} style={s.avatar} activeOpacity={0.8}>
            <View style={[
              s.avatarInner,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                borderWidth: 1.5,
              },
              isWeb ? {
                boxShadow: "0 0 16px " + colors.border,
              } as any : {}
            ]}>
              <Text style={[s.avatarInitial, { color: colors.text, fontFamily: isWeb ? "'Playfair Display', serif" : "System" }]}>
                {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <View style={[s.editBadge, { backgroundColor: colors.accent }]}>
              <Feather name="edit-2" size={10} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[
            s.userName,
            {
              color: colors.text,
              fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            }
          ]}>
            {user?.name ?? "Student"}
          </Text>
          <Text style={[
            s.userEmail,
            {
              color: colors.mutedForeground,
              fontFamily: isWeb ? "'JetBrains Mono', monospace" : "System",
            }
          ]}>
            {user?.email ?? ""}
          </Text>
          <Text style={[s.collegeNameText, { color: colors.mutedForeground }]}>{college.name} · {yearLabel}</Text>

          {isAdmin ? (
            <View style={[s.badge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="shield" size={12} color={colors.accent} />
              <Text style={[s.badgeText, { color: colors.text }]}>Library Admin</Text>
            </View>
          ) : isSubscribed ? (
            <View style={[s.badge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="star" size={12} color={colors.accent} />
              <Text style={[s.badgeText, { color: colors.accent }]}>Pro Student Member</Text>
            </View>
          ) : (
            <View style={[s.badge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[s.badgeText, { color: colors.text }]}>Student Member</Text>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: botPad + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Menu list ─── */}
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
            { backgroundColor: colors.card, borderColor: colors.border },
            isWeb ? {
              maxWidth: 520, width: "100%" as any, alignSelf: "center" as any, borderRadius: 20, marginBottom: 40,
              boxShadow: "0 -4px 40px rgba(0,0,0,0.05)",
            } as any : {},
          ]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text, fontFamily: isWeb ? "'Playfair Display', serif" : "System" }]}>
                Edit Member Profile
              </Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={s.fieldRow}>
                {[
                  { label: "First Name *", value: editFirst, setter: setEditFirst },
                  { label: "Last Name",    value: editLast,  setter: setEditLast  },
                ].map(({ label, value, setter }) => (
                  <View key={label} style={{ flex: 1 }}>
                    <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
                    <TextInput
                      style={[s.fieldInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.input }]}
                      value={value}
                      onChangeText={setter}
                      placeholder={label.replace(" *", "")}
                      placeholderTextColor={colors.mutedForeground}
                      autoCapitalize="words"
                    />
                  </View>
                ))}
              </View>

              <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>College</Text>
              <View style={s.pillRow}>
                {(["CSE", "EEE"] as const).map((c) => (
                  <TouchableOpacity key={c} onPress={() => setEditCollege(c)}
                    style={[s.pill, editCollege === c
                      ? { borderColor: colors.accent, backgroundColor: colors.secondary }
                      : { borderColor: colors.border, backgroundColor: "transparent" }
                    ]}
                  >
                    <Text style={[s.pillText, { color: editCollege === c ? colors.text : colors.mutedForeground }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Year</Text>
              <View style={s.pillRow}>
                {YEAR_LABELS.map((label, i) => (
                  <TouchableOpacity key={label} onPress={() => setEditYear(YEAR_VALUES[i])}
                    style={[s.pill, editYear === YEAR_VALUES[i]
                      ? { borderColor: colors.accent, backgroundColor: colors.secondary }
                      : { borderColor: colors.border, backgroundColor: "transparent" }
                    ]}
                  >
                    <Text style={[s.pillText, { color: editYear === YEAR_VALUES[i] ? colors.text : colors.mutedForeground, fontSize: 12 }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!!editError && (
                <View style={[s.errorBox, { borderColor: colors.border }]}>
                  <Feather name="alert-circle" size={14} color={colors.destructive} />
                  <Text style={[s.errorText, { color: colors.destructive }]}>{editError}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleSaveProfile} disabled={editSaving}
                style={[s.saveBtn, { marginTop: 24 }]} activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.primary, colors.tint]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.saveBtnGrad}
                >
                  {editSaving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Save Changes</Text>
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
  const colors = useColors();
  const [hov, setHov] = useState(false);
  const isToggle  = item.toggle === true;
  const isDanger  = item.danger === true;
  const isAdminIt = item.admin  === true;

  const iconColor = isDanger ? colors.destructive : colors.accent;
  const iconBg    = isDanger ? "rgba(155,49,49,0.08)" : colors.secondary;
  const labelColor = isDanger ? colors.destructive : colors.text;

  return (
    <TouchableOpacity
      onPress={isToggle ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); } : item.onPress}
      activeOpacity={0.8}
      {...(webHover(setHov) as any)}
      style={[
        s.menuItem,
        {
          backgroundColor: colors.card,
          borderColor: hov ? colors.accent : colors.border,
        },
        isWeb ? {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: hov
            ? "0 4px 16px rgba(0,0,0,0.04)"
            : "0 1px 4px rgba(0,0,0,0.01)",
          transition: "all 0.2s ease",
        } as any : {},
      ]}
    >
      <View style={[s.menuIconWrap, { backgroundColor: iconBg }]}>
        <Feather name={item.icon} size={15} color={iconColor} />
      </View>
      <Text style={[
        s.menuLabel,
        {
          color: labelColor,
          fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
        }
      ]}>
        {item.label}
      </Text>
      {isToggle
        ? <Switch value={isDark} onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#fff"
          />
        : <Feather name="chevron-right" size={15} color={colors.accent} />
      }
    </TouchableOpacity>
  );
}

function AboutCard() {
  const colors = useColors();
  return (
    <View style={[
      s.aboutCard,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
      },
      isWeb ? {
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.01)",
      } as any : {},
    ]}>
      <Text style={[
        s.aboutTitle,
        {
          color: colors.text,
          fontFamily: isWeb ? "'Playfair Display', serif" : "System",
          fontWeight: "700" as any,
        }
      ]}>
        About StudyMate
      </Text>
      <Text style={[
        s.aboutText,
        {
          color: colors.mutedForeground,
          fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
        }
      ]}>
        StudyMate delivers rich, interactive study notes for engineering first-year students — built by seniors who know exactly what you need.
      </Text>
      <View style={s.statsRow}>
        {[
          { value: "2",    label: "Colleges" },
          { value: "10+",  label: "Subjects" },
          { value: "Free", label: "Access" },
        ].map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <View style={[s.statDiv, { backgroundColor: colors.border }]} />}
            <View style={s.stat}>
              <Text style={[
                s.statValue,
                {
                  color: colors.accent,
                  fontFamily: isWeb ? "'Playfair Display', serif" : "System",
                }
              ]}>
                {stat.value}
              </Text>
              <Text style={[
                s.statLabel,
                {
                  color: colors.mutedForeground,
                  fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
                }
              ]}>
                {stat.label}
              </Text>
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
  },
  avatar: { marginBottom: 12 },
  avatarInner: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
  },
  editBadge: {
    position: "absolute", bottom: 2, right: 2, borderRadius: 10,
    width: 22, height: 22, alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 34, fontWeight: "700" },
  userName:  { fontSize: 20, fontWeight: "700", marginBottom: 2 },
  userEmail: { fontSize: 13, marginBottom: 4 },
  collegeNameText:{ fontSize: 13, fontFamily: "System", fontWeight: "500", marginBottom: 10 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },

  body: { padding: 16, gap: 12, maxWidth: 860, width: "100%" as any, alignSelf: "center" as any },
  menuGrid: { gap: 8 },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 10, borderWidth: 1, padding: 14, gap: 12,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500" },

  aboutCard: { borderRadius: 10, borderWidth: 1, padding: 18, gap: 10 },
  aboutTitle: { fontSize: 15 },
  aboutText:  { fontSize: 13, lineHeight: 20 },
  statsRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: 4 },
  stat:       { alignItems: "center" },
  statValue:  { fontSize: 22, fontWeight: "700" },
  statLabel:  { fontSize: 12 },
  statDiv:    { width: 1, height: 36 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: "85%" as any,
    borderWidth: 1, borderBottomWidth: 0,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  fieldRow: { flexDirection: "row", gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 8 },
  fieldInput: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14,
  },
  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" as any, marginBottom: 4 },
  pill: { borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, alignItems: "center" },
  pillText: { fontSize: 13, fontWeight: "600" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 12, marginTop: 8,
    backgroundColor: "rgba(239,68,68,0.06)", borderWidth: 1,
  },
  errorText: { fontSize: 13, flex: 1 },
  saveBtn: { borderRadius: 10, overflow: "hidden" },
  saveBtnGrad: { height: 50, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 15, fontWeight: "700" },
});
