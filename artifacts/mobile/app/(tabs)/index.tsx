import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/content";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useApiSubjects } from "@/hooks/useApiSubjects";

function SubjectIconCell({ icon, color }: { icon: string; color: string }) {
  const isIconName = /^[a-z][a-z0-9-]*$/.test(icon);
  if (isIconName) {
    return <Ionicons name={icon as any} size={22} color={color} />;
  }
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedCollege } = useApp();
  const isDesktop = useIsDesktop();
  const topPad = isDesktop ? 0 : Platform.OS === "web" ? 67 : insets.top;

  const { subjects, loading } = useApiSubjects(selectedCollege);

  if (!selectedCollege) return null;

  const college = COLLEGES[selectedCollege];
  const recent = subjects.slice(0, 3);

  const features = [
    { icon: "search", label: "Search Notes", color: colors.primary },
    { icon: "archive", label: "PYQs", color: "#7C3AED" },
  ] as const;

  return (
    <ScrollView
      style={[s.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={college.gradient}
        style={[s.header, { paddingTop: topPad + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>Welcome back!</Text>
            <Text style={s.collegeName}>{college.name}</Text>
          </View>
          <View style={s.avatarCircle}>
            <Feather name="book-open" size={24} color="#fff" />
          </View>
        </View>
        <View style={s.pillRow}>
          <View style={s.pill}>
            <Text style={s.pillText}>{subjects.length} Subjects</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={s.body}>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>
          Features
        </Text>
        <View style={s.featGrid}>
          {features.map((f) => (
            <View
              key={f.label}
              style={[s.featCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[s.featIcon, { backgroundColor: f.color + "15" }]}>
                <Feather name={f.icon as any} size={20} color={f.color} />
              </View>
              <Text style={[s.featLabel, { color: colors.foreground }]}>
                {f.label}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[s.sectionTitle, { color: colors.foreground }]}>
          Your Subjects
        </Text>

        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : recent.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="book" size={28} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
              No subjects yet
            </Text>
          </View>
        ) : (
          recent.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              onPress={() => router.push(`/subject/${sub.id}`)}
              activeOpacity={0.85}
              style={[s.subjectRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[s.subjectIcon, { backgroundColor: sub.color + "18" }]}>
                <SubjectIconCell icon={sub.icon} color={sub.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.subjectName, { color: colors.foreground }]}>
                  {sub.name}
                </Text>
                <Text style={[s.subjectMeta, { color: colors.mutedForeground }]}>
                  {sub.code} · Sem {sub.semester} · {sub.chapterCount} chapters
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))
        )}

        {!loading && subjects.length > 3 && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/library")}
            style={[s.viewAllBtn, { borderColor: colors.border }]}
          >
            <Text style={[s.viewAllText, { color: colors.primary }]}>
              View all {subjects.length} subjects
            </Text>
            <Feather name="arrow-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greeting: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  collegeName: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  body: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  featGrid: {
    flexDirection: "row",
    gap: 12,
  },
  featCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  featIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  subjectName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  subjectMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
