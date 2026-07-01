import { LinearGradient } from "expo-linear-gradient";
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
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { COLLEGES } from "@/data/content";

const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const YEAR_VALUES = ["1", "2", "3", "4"];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedCollege, isSubscribed, isDark, toggleTheme, resetCollege } = useApp();
  const { user, logout, isAdmin, updateProfile } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [editVisible, setEditVisible] = useState(false);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editCollege, setEditCollege] = useState<"CSE" | "EEE">("CSE");
  const [editYear, setEditYear] = useState("1");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

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
    if (Platform.OS === "web") {
      resetCollege().then(() => router.replace("/onboarding"));
      return;
    }
    Alert.alert(
      "Change College",
      "Are you sure you want to switch your college? Your progress will be reset.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch", style: "destructive",
          onPress: async () => { await resetCollege(); router.replace("/onboarding"); },
        },
      ]
    );
  }

  function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/login"));
      return;
    }
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out", style: "destructive",
        onPress: async () => { await logout(); router.replace("/login"); },
      },
    ]);
  }

  const yearLabel = YEAR_LABELS[YEAR_VALUES.indexOf(user?.year ?? "1")] ?? "1st Year";

  const menuItems = [
    { icon: "edit-2" as const, label: "Edit Profile", onPress: openEdit },
    { icon: "book-open" as const, label: "My Subjects", onPress: () => router.push("/(tabs)/library") },
    { icon: "refresh-cw" as const, label: "Change College", onPress: handleChangeCollege },
    ...(isAdmin ? [{ icon: "shield" as const, label: "Admin Panel", onPress: () => router.push("/(admin)"), admin: true }] : []),
    { icon: "log-out" as const, label: "Log Out", onPress: handleLogout, danger: true },
  ];

  return (
    <>
      <ScrollView
        style={[s.root, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={college.gradient}
          style={[s.header, { paddingTop: topPad + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={openEdit} style={s.avatar} activeOpacity={0.8}>
            <Text style={s.avatarInitial}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
            <View style={s.editBadge}>
              <Feather name="edit-2" size={10} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={s.userName}>{user?.name ?? "Student"}</Text>
          <Text style={s.userEmail}>{user?.email ?? ""}</Text>
          <Text style={s.collegeName}>{college.name} · {yearLabel}</Text>
          {isAdmin ? (
            <View style={s.adminBadge}>
              <Feather name="shield" size={13} color="#fff" />
              <Text style={s.adminBadgeText}>Admin</Text>
            </View>
          ) : isSubscribed ? (
            <View style={s.proBadge}>
              <Feather name="star" size={13} color="#FFD700" />
              <Text style={s.proBadgeText}>Pro Member</Text>
            </View>
          ) : (
            <View style={s.freeBadge}>
              <Text style={s.freeBadgeText}>Student</Text>
            </View>
          )}
        </LinearGradient>

        <View style={s.body}>
          <View style={[s.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.menuItem}>
              <View style={[s.menuIcon, { backgroundColor: isDark ? "#818CF815" : "#1A1A2E15" }]}>
                <Feather name={isDark ? "moon" : "sun"} size={16} color={colors.primary} />
              </View>
              <Text style={[s.menuLabel, { color: colors.foreground }]}>
                {isDark ? "Dark Mode" : "Light Mode"}
              </Text>
              <Switch
                value={isDark}
                onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            {menuItems.map((item, i) => {
              const isAdminItem = (item as any).admin === true;
              const iconBg = item.danger ? "#EF444415" : isAdminItem ? "#7C3AED15" : colors.secondary;
              const iconColor = item.danger ? "#EF4444" : isAdminItem ? "#7C3AED" : colors.primary;
              const labelColor = item.danger ? "#EF4444" : isAdminItem ? "#7C3AED" : colors.foreground;
              return (
                <React.Fragment key={item.label}>
                  <TouchableOpacity onPress={item.onPress} style={s.menuItem} activeOpacity={0.7}>
                    <View style={[s.menuIcon, { backgroundColor: iconBg }]}>
                      <Feather name={item.icon} size={16} color={iconColor} />
                    </View>
                    <Text style={[s.menuLabel, { color: labelColor }]}>
                      {item.label}
                    </Text>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  {i < menuItems.length - 1 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
                </React.Fragment>
              );
            })}
          </View>

          <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.infoTitle, { color: colors.foreground }]}>About StudyMate</Text>
            <Text style={[s.infoText, { color: colors.mutedForeground }]}>
              StudyMate delivers rich, interactive study notes for engineering first-year students — built by seniors who know exactly what you need.
            </Text>
            <View style={s.infoRow}>
              <View style={s.infoStat}>
                <Text style={[s.infoNum, { color: colors.primary }]}>2</Text>
                <Text style={[s.infoStat2, { color: colors.mutedForeground }]}>Colleges</Text>
              </View>
              <View style={[s.infoDiv, { backgroundColor: colors.border }]} />
              <View style={s.infoStat}>
                <Text style={[s.infoNum, { color: colors.primary }]}>10+</Text>
                <Text style={[s.infoStat2, { color: colors.mutedForeground }]}>Subjects</Text>
              </View>
              <View style={[s.infoDiv, { backgroundColor: colors.border }]} />
              <View style={s.infoStat}>
                <Text style={[s.infoNum, { color: colors.primary }]}>Free</Text>
                <Text style={[s.infoStat2, { color: colors.mutedForeground }]}>Access</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: colors.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={s.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>First Name *</Text>
                  <TextInput
                    style={[s.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={editFirst}
                    onChangeText={setEditFirst}
                    placeholder="First name"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Last Name</Text>
                  <TextInput
                    style={[s.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={editLast}
                    onChangeText={setEditLast}
                    placeholder="Last name"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 8 }]}>College</Text>
              <View style={s.pillRow}>
                {(["CSE", "EEE"] as const).map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setEditCollege(c)}
                    style={[s.pill, { borderColor: editCollege === c ? "#4361EE" : colors.border, backgroundColor: editCollege === c ? "#4361EE" : colors.background }]}
                  >
                    <Text style={[s.pillText, { color: editCollege === c ? "#fff" : colors.foreground }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.fieldLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Year</Text>
              <View style={s.pillRow}>
                {YEAR_LABELS.map((label, i) => (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setEditYear(YEAR_VALUES[i])}
                    style={[s.pill, { borderColor: editYear === YEAR_VALUES[i] ? "#4361EE" : colors.border, backgroundColor: editYear === YEAR_VALUES[i] ? "#4361EE" : colors.background }]}
                  >
                    <Text style={[s.pillText, { color: editYear === YEAR_VALUES[i] ? "#fff" : colors.foreground, fontSize: 12 }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!!editError && (
                <View style={[s.errorBox, { backgroundColor: "#FEE2E2", marginTop: 10 }]}>
                  <Feather name="alert-circle" size={14} color="#DC2626" />
                  <Text style={s.errorText}>{editError}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleSaveProfile} disabled={editSaving} style={[s.saveBtn, { marginTop: 16 }]} activeOpacity={0.85}>
                <LinearGradient colors={["#4361EE", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnGrad}>
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

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  editBadge: {
    position: "absolute", bottom: 2, right: 2,
    backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 10,
    width: 20, height: 20, alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { color: "#fff", fontSize: 34, fontFamily: "Inter_700Bold" },
  userName: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 2 },
  userEmail: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 6 },
  collegeName: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 12 },
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  adminBadgeText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  proBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  proBadgeText: { color: "#FFD700", fontSize: 13, fontFamily: "Inter_700Bold" },
  freeBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  freeBadgeText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  body: { padding: 16, gap: 14 },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginHorizontal: 16 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 12 },
  infoTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  infoText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  infoStat: { alignItems: "center" },
  infoNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  infoStat2: { fontSize: 12, fontFamily: "Inter_400Regular" },
  infoDiv: { width: 1, height: 36 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  fieldRow: { flexDirection: "row", gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  pill: { borderWidth: 2, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 14, alignItems: "center" },
  pillText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12 },
  errorText: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  saveBtn: { borderRadius: 14, overflow: "hidden" },
  saveBtnGrad: { height: 52, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
