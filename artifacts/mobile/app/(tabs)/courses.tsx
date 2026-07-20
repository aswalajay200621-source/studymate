import { router } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useApiSubjects } from "@/hooks/useApiSubjects";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const isWeb = Platform.OS === "web";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          "#0b1326",
  card:        "rgba(30, 41, 59, 0.75)",
  border:      "rgba(255, 255, 255, 0.1)",
  borderTop:   "rgba(255, 255, 255, 0.15)",
  primary:     "#bdc2ff",
  primaryCont: "#818cf8",
  secondary:   "#b9c7e0",
  secondaryCont:"#3c4a5e",
  tertiary:    "#f7bd3e",
  tertiaryCont:"#c08d00",
  text:        "#dae2fd",
  muted:       "#c6c5d5",
  surfaceCont: "#171f33",
  surfaceHigh: "#222a3d",
  surfaceHigh2:"#2d3449",
  surfaceLow:  "#131b2e",
};

function glassStyle(extra?: object) {
  return [
    {
      backgroundColor: C.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    isWeb ? {
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.05)",
    } as any : {},
    extra ?? {},
  ];
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[s.statCard, { backgroundColor: C.surfaceLow, borderColor: C.border }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Feather name={icon as any} size={32} color={color} />
        <View>
          <Text style={s.statLabel}>{label.toUpperCase()}</Text>
          <Text style={s.statValue}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
interface LastReadState {
  chapterId: string;
  chapterTitle: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  timestamp: number;
}

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCollege } = useApp();
  const isDesktop = useIsDesktop();
  const topPad = isWeb ? 72 : insets.top + 16;

  const { subjects, loading } = useApiSubjects(selectedCollege ?? "");
  const [query, setQuery] = useState("");
  const [lastRead, setLastRead] = useState<LastReadState | null>(null);

  useEffect(() => {
    const fetchLastRead = async () => {
      if (Platform.OS === "web") {
        try {
          const val = localStorage.getItem("study_mate_last_read");
          if (val) setLastRead(JSON.parse(val));
        } catch {}
      } else {
        try {
          const AsyncStorage = require("@react-native-async-storage/async-storage").default;
          const val = await AsyncStorage.getItem("study_mate_last_read");
          if (val) setLastRead(JSON.parse(val));
        } catch {}
      }
    };
    fetchLastRead();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return subjects;
    const q = query.toLowerCase();
    return subjects.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [subjects, query]);

  // Assign accent color by index
  const accentColors = [C.primary, C.secondary, C.tertiary, C.primaryCont];

  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>
      {/* Ambient glow */}
      {isWeb && (
        <View style={s.glow} />
      )}

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ── */}
        <View style={s.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>Active Courses</Text>
            <Text style={s.pageSub}>
              Manage your current academic curriculum. Track progress and jump back into your learning paths.
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[s.filterBtn, { backgroundColor: C.surfaceHigh, borderColor: C.border }]}>
              <Feather name="filter" size={16} color={C.primary} />
              <Text style={[s.filterBtnText, { color: C.text }]}>Filter</Text>
            </View>
            <View style={[s.filterBtn, { backgroundColor: C.surfaceHigh, borderColor: C.border }]}>
              <Feather name="sliders" size={16} color={C.primary} />
              <Text style={[s.filterBtnText, { color: C.text }]}>Sort</Text>
            </View>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={[s.searchBox, { backgroundColor: C.surfaceLow, borderColor: C.border }]}>
          <Feather name="search" size={16} color={C.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search courses..."
            placeholderTextColor={C.muted}
            style={[s.searchInput, { color: C.text }]}
          />
        </View>

        {/* ── Last Read Widget ── */}
        {lastRead && (
          <TouchableOpacity
            style={[...glassStyle(s.lastReadCard)]}
            onPress={() => router.push({ pathname: "/chapter/[id]", params: { id: lastRead.chapterId, subjectId: lastRead.subjectId } })}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={[s.lastReadIconContainer, { backgroundColor: `${C.primary}18` }]}>
                <Feather name="clock" size={20} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.lastReadLabel}>LAST READ CHAPTER</Text>
                <Text style={s.lastReadChapterTitle} numberOfLines={1}>{lastRead.chapterTitle}</Text>
                <Text style={s.lastReadSubjectSub} numberOfLines={1}>
                  {lastRead.subjectCode} · {lastRead.subjectName}
                </Text>
              </View>
              <Feather name="arrow-right" size={16} color={C.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Loading ── */}
        {loading && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        )}

        {/* ── Course cards (bento-style) ── */}
        {!loading && (
          <View style={isDesktop ? s.bentoGrid : s.bentoStack}>
            {/* Large hero card - first subject */}
            {filtered.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/subject/[id]", params: { id: filtered[0].id } })}
                style={[...glassStyle(s.heroCard), isDesktop ? s.heroCardDesktop : {}]}
                activeOpacity={0.88}
              >
                {/* Watermark icon */}
                <View style={s.heroWatermark}>
                  <Feather name="book" size={100} color={C.primary} style={{ opacity: 0.08 }} />
                </View>

                <View style={s.heroBadgeRow}>
                  <View style={s.courseBadge}>
                    <Text style={s.courseBadgeText}>{filtered[0].code}</Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 13 }}>Advanced Level</Text>
                </View>

                <Text style={s.heroTitle}>{filtered[0].name}</Text>
                <Text style={s.heroDesc} numberOfLines={3}>{filtered[0].description || "Master core concepts, analysis techniques, and practical implementations."}</Text>

                <View style={s.heroFooter}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, color: C.muted }}>Course Progress</Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: C.primary }}>74%</Text>
                    </View>
                    <ProgressBar pct={74} color={C.primary} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                    <TouchableOpacity
                      style={[s.heroBtn, { backgroundColor: C.primary }]}
                      onPress={() => router.push({ pathname: "/subject/[id]", params: { id: filtered[0].id } })}
                    >
                      <Feather name="play" size={16} color="#131e8c" />
                      <Text style={[s.heroBtnText, { color: "#131e8c" }]}>Continue Study</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.heroBtn, { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: C.border }]}>
                      <Feather name="book-open" size={16} color={C.text} />
                      <Text style={[s.heroBtnText, { color: C.text }]}>Syllabus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Smaller cards for remaining subjects */}
            {filtered.slice(1).map((sub, idx) => (
              <TouchableOpacity
                key={sub.id}
                onPress={() => router.push({ pathname: "/subject/[id]", params: { id: sub.id } })}
                style={[...glassStyle(s.smallCard), isDesktop ? s.smallCardDesktop : {}]}
                activeOpacity={0.88}
              >
                <View style={[s.smallCardIcon, { backgroundColor: accentColors[idx % accentColors.length] + "22" }]}>
                  <Feather
                    name={idx % 3 === 0 ? "zap" : idx % 3 === 1 ? "cpu" : "globe"}
                    size={24}
                    color={accentColors[idx % accentColors.length]}
                  />
                </View>

                <View style={s.smallCardBadgeRow}>
                  <View style={[s.courseBadge, { backgroundColor: accentColors[idx % accentColors.length] + "22" }]}>
                    <Text style={[s.courseBadgeText, { color: accentColors[idx % accentColors.length] }]}>{sub.code}</Text>
                  </View>
                </View>

                <Text style={s.smallCardTitle}>{sub.name}</Text>
                <Text style={s.smallCardDesc} numberOfLines={3}>{sub.description || "Study core concepts and analytical techniques."}</Text>

                <View style={s.smallCardFooter}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: C.muted }}>Next chapter</Text>
                    <Text style={{ fontSize: 11, color: accentColors[idx % accentColors.length] }}>{30 + idx * 12}%</Text>
                  </View>
                  <ProgressBar pct={30 + idx * 12} color={accentColors[idx % accentColors.length]} />
                  <TouchableOpacity
                    style={[s.smallCardBtn, { backgroundColor: accentColors[idx % accentColors.length] + "33", marginTop: 14 }]}
                    onPress={() => router.push({ pathname: "/subject/[id]", params: { id: sub.id } })}
                  >
                    <Feather name="arrow-right" size={14} color={accentColors[idx % accentColors.length]} />
                    <Text style={[s.smallCardBtnText, { color: accentColors[idx % accentColors.length] }]}>Resume</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add course card */}
            <TouchableOpacity style={[s.addCard, isDesktop ? s.addCardDesktop : {}]} activeOpacity={0.8}>
              <View style={s.addCardCircle}>
                <Feather name="plus" size={32} color={C.muted} />
              </View>
              <View style={{ marginLeft: isDesktop ? 24 : 0, marginTop: isDesktop ? 0 : 12 }}>
                <Text style={s.addCardTitle}>Enroll in New Course</Text>
                <Text style={s.addCardSub}>Explore the catalog and add more subjects to your curriculum.</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Learning Insights footer ── */}
        <View style={s.insightsSection}>
          <Text style={s.insightsTitle}>Learning Insights</Text>
          <View style={isDesktop ? s.insightRow : s.insightStack}>
            <StatCard icon="clock" label="Total Focus" value="24.5 Hours" color={C.primary} />
            <StatCard icon="check-square" label="Tasks Completed" value="12 / 15" color={C.secondary} />
            <StatCard icon="trending-up" label="Knowledge Score" value="88.4%" color={C.tertiary} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, position: "relative" },
  glow:          {
    position: "absolute", top: 0, right: 0,
    width: 400, height: 400,
    backgroundColor: "rgba(189,194,255,0.04)",
    borderRadius: 200,
    ...(isWeb ? { filter: "blur(120px)" } as any : {}),
    pointerEvents: "none" as any,
  },
  scroll:        { paddingHorizontal: 20, paddingBottom: 40 },

  // Page header
  pageHeader:    { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 20 },
  pageTitle:     {
    fontSize: 36, fontWeight: "700", color: C.text, letterSpacing: -0.5,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
    lineHeight: 44,
  },
  pageSub:       { fontSize: 15, color: C.muted, marginTop: 6, lineHeight: 22, flex: 1 },

  // Filter buttons
  filterBtn:     {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  filterBtnText: { fontSize: 13, fontWeight: "500" },

  // Search
  searchBox:     {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 24,
  },
  searchInput:   { flex: 1, fontSize: 14, outline: "none" } as any,

  // Bento grid
  bentoGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 32 },
  bentoStack:    { flexDirection: "column", gap: 16, marginBottom: 32 },

  // Hero card
  heroCard:      { padding: 28, overflow: "hidden", position: "relative" },
  heroCardDesktop: { width: "63%" as any },
  heroWatermark: {
    position: "absolute", top: 16, right: 16,
    opacity: 0.15, transform: [{ rotate: "-10deg" }],
  },
  heroBadgeRow:  { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  heroTitle:     {
    fontSize: 26, fontWeight: "700", color: C.text, marginBottom: 10,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
    lineHeight: 32,
  },
  heroDesc:      { fontSize: 15, color: C.muted, lineHeight: 22, marginBottom: 24 },
  heroFooter:    {},
  heroBtn:       {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  heroBtnText:   { fontSize: 14, fontWeight: "600" },

  // Course badge
  courseBadge:   {
    backgroundColor: "rgba(189,194,255,0.15)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
  },
  courseBadgeText: { fontSize: 11, fontWeight: "700", color: C.primary, letterSpacing: 1 },

  // Small cards
  smallCard:     { padding: 24, flex: 1, minWidth: 220 },
  smallCardDesktop: { width: "30%" as any, flex: 0 },
  smallCardIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  smallCardBadgeRow: { flexDirection: "row", marginBottom: 10 },
  smallCardTitle: {
    fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 8,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
    lineHeight: 24,
  },
  smallCardDesc: { fontSize: 13, color: C.muted, lineHeight: 20, flex: 1 },
  smallCardFooter: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border },
  smallCardBtn:  {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12,
  },
  smallCardBtnText: { fontSize: 13, fontWeight: "600" },

  // Add course
  addCard:       {
    borderWidth: 2, borderStyle: "dashed" as any, borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20, padding: 28,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row",
    minHeight: 160,
    flex: 1,
  },
  addCardDesktop: { width: "63%" as any, flex: 0 },
  addCardCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },
  addCardTitle:  { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 6 },
  addCardSub:    { fontSize: 13, color: C.muted, maxWidth: 280, lineHeight: 20 },

  // Progress
  progressTrack: { height: 8, backgroundColor: C.surfaceHigh2, borderRadius: 99, overflow: "hidden" },
  progressFill:  { height: "100%" as any, borderRadius: 99 },

  // Insights
  insightsSection: { marginTop: 16 },
  insightsTitle: {
    fontSize: 22, fontWeight: "700", color: C.text, marginBottom: 16,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },
  insightRow:    { flexDirection: "row", gap: 16 },
  insightStack:  { flexDirection: "column", gap: 12 },
  statCard:      { flex: 1, padding: 20, borderRadius: 16, borderWidth: 1 },
  statLabel:     { fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 1.5, marginBottom: 4 },
  statValue:     { fontSize: 22, fontWeight: "700", color: C.text },
  lastReadCard: {
    padding: 16,
    marginBottom: 24,
  },
  lastReadIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lastReadLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  lastReadChapterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },
  lastReadSubjectSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
});
