import { router } from "expo-router";
import React, { useState, useEffect, useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useApiSubjects } from "@/hooks/useApiSubjects";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { apiFetch } from "@/utils/api";

const isWeb = Platform.OS === "web";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          "#0b1326",
  card:        "rgba(30, 41, 59, 0.75)",
  border:      "rgba(255, 255, 255, 0.1)",
  primary:     "#bdc2ff",
  secondary:   "#b9c7e0",
  tertiary:    "#f7bd3e",
  text:        "#dae2fd",
  muted:       "#c6c5d5",
  surfaceHigh: "#222a3d",
  surfaceHigh2:"#2d3449",
  surfaceLow:  "#131b2e",
  errorCont:   "#93000a",
  onErrorCont: "#ffdad6",
};

function glassCard(...extras: object[]) {
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
    ...extras,
  ];
}



interface ApiChapter {
  id: string;
  title: string;
  createdAt: string;
  subjectId: string;
  subjectName: string;
  semester: number;
  college: string;
}

// ── Dashboard screen ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCollege } = useApp();
  const isDesktop = useIsDesktop();
  const topPad = isWeb ? 72 : insets.top + 16;

  const { subjects } = useApiSubjects(selectedCollege ?? "");
  const [chapters, setChapters] = useState<ApiChapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);

  // Bar chart heights for Study Velocity
  const bars = [30, 45, 60, 50, 80, 100, 90];

  useEffect(() => {
    if (!selectedCollege) return;
    let cancelled = false;
    setChaptersLoading(true);
    apiFetch<ApiChapter[]>(`/chapters?college=${encodeURIComponent(selectedCollege)}`)
      .then((data) => {
        if (!cancelled) setChapters(data ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChaptersLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedCollege]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const groupedSemesters = useMemo(() => {
    const semMap: Record<number, Record<string, ApiChapter[]>> = {};

    chapters.forEach((ch) => {
      const sem = ch.semester || 1;
      if (!semMap[sem]) {
        semMap[sem] = {};
      }
      const dateKey = formatDate(ch.createdAt);
      if (!semMap[sem][dateKey]) {
        semMap[sem][dateKey] = [];
      }
      semMap[sem][dateKey].push(ch);
    });

    return Object.keys(semMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map((semNum) => {
        const dateGroups = semMap[semNum];
        const sortedDates = Object.keys(dateGroups)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .map((dateStr) => ({
            date: dateStr,
            items: dateGroups[dateStr],
          }));
        return {
          semester: semNum,
          dates: sortedDates,
        };
      });
  }, [chapters]);

  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Welcome header ── */}
        <View style={s.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.welcomeTitle}>Welcome back, Scholar</Text>
            <Text style={s.welcomeQuote}>
              {"\u201C"}The beautiful thing about learning is that no one can take it away from you.{"\u201D"}
            </Text>
          </View>
          <View style={[s.sessionBadge, { backgroundColor: C.surfaceHigh, borderColor: C.border }]}>
            <Text style={{ fontSize: 12, color: C.text, fontWeight: "500" }}>Session: 02h 45m</Text>
          </View>
        </View>

        {/* ── Top row: Insights + Velocity ── */}
        <View style={[isDesktop ? s.row : s.col, { marginBottom: 20, gap: 16 }]}>

          {/* AI Insights card (2/3 width) */}
          <View style={[...glassCard(s.insightsCard), isDesktop ? s.insightsCardDesktop : {}]}>
            {/* Watermark icon */}
            <View style={s.watermark}>
              <Feather name="cpu" size={100} color={C.primary} style={{ opacity: 0.08 }} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Feather name="star" size={18} color={C.primary} />
              <Text style={s.insightsHeading}>AI ACADEMIC INSIGHTS</Text>
            </View>
            <Text style={s.insightsBody}>
              Your retention of{" "}
              <Text style={{ color: C.primary, fontWeight: "700" }}>core concepts</Text>
              {" "}has increased by 14% this week. Review your latest chapters tonight to solidify your understanding.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <TouchableOpacity
                style={[s.insightsBtn, { backgroundColor: C.primary }]}
                onPress={() => router.replace("/(tabs)/courses" as any)}
              >
                <Text style={[s.insBtnText, { color: "#131e8c" }]}>Review Concepts</Text>
                <Feather name="arrow-right" size={14} color="#131e8c" />
              </TouchableOpacity>
              <TouchableOpacity style={[s.insightsBtn, { borderWidth: 1, borderColor: C.border, backgroundColor: "transparent" }]}>
                <Text style={[s.insBtnText, { color: C.text }]}>View Full Report</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Study Velocity widget (1/3 width) */}
          <View style={[...glassCard(s.velocityCard), isDesktop ? s.velocityCardDesktop : {}]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={s.velocityLabel}>STUDY VELOCITY</Text>
              <Feather name="zap" size={18} color={C.primary} />
            </View>
            <Text style={s.velocityNum}>8.4</Text>
            <Text style={{ fontSize: 13, color: C.primary, fontWeight: "600" }}>pts / hr</Text>
            <Text style={{ fontSize: 11, color: C.muted, marginTop: 4, marginBottom: 24 }}>+1.2 from last session</Text>
            {/* Bar chart */}
            <View style={s.velChart}>
              {bars.map((h, i) => (
                <View
                  key={i}
                  style={[s.velBar, {
                    height: `${h}%` as any,
                    backgroundColor: i === 5 ? C.primary : `${C.primary}${Math.round(h * 1.6).toString(16)}`,
                  }]}
                />
              ))}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>MON</Text>
              <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>TODAY</Text>
            </View>
          </View>
        </View>

        {/* ── Uploaded HTML Files directory ── */}
        <View style={{ gap: 20, marginTop: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Feather name="folder" size={20} color={C.primary} />
            <Text style={s.sectionTitle}>Uploaded Study Chapters</Text>
          </View>

          {chaptersLoading ? (
            <Text style={{ color: C.muted, fontStyle: "italic" }}>Loading chapters...</Text>
          ) : chapters.length === 0 ? (
            <Text style={{ color: C.muted, fontStyle: "italic" }}>No chapters uploaded yet.</Text>
          ) : (
            groupedSemesters.map((sem) => (
              <View key={sem.semester} style={s.semesterGroup}>
                <View style={s.semesterHeader}>
                  <Text style={s.semesterHeaderText}>SEMESTER {sem.semester}</Text>
                  <View style={s.semesterHeaderLine} />
                </View>

                <View style={{ gap: 16, marginTop: 12 }}>
                  {sem.dates.map((group) => (
                    <View key={group.date} style={s.dateGroup}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Feather name="calendar" size={13} color={C.secondary} />
                        <Text style={s.dateGroupTitle}>{group.date}</Text>
                      </View>
                      
                      <View style={isDesktop ? s.chaptersGrid : s.chaptersStack}>
                        {group.items.map((ch) => (
                          <TouchableOpacity
                            key={ch.id}
                            style={[...glassCard(s.chapterRowItem), isDesktop && { width: "31%" as any }]}
                            onPress={() => router.push({ pathname: "/chapter/[id]", params: { id: ch.id } })}
                            activeOpacity={0.8}
                          >
                            <View style={s.chapterItemLeft}>
                              <Feather name="file-text" size={18} color={C.primary} style={{ marginRight: 10 }} />
                              <View style={{ flex: 1 }}>
                                <Text style={s.chapterTitleText} numberOfLines={1}>
                                  {ch.title}
                                </Text>
                                <Text style={s.chapterSubjectText} numberOfLines={1}>
                                  {ch.subjectName}
                                </Text>
                              </View>
                            </View>
                            <Feather name="chevron-right" size={14} color={C.muted} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Welcome
  welcomeRow:   { flexDirection: "row", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 24 },
  welcomeTitle: {
    fontSize: 34, fontWeight: "700", color: C.primary, letterSpacing: -0.5,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
    lineHeight: 42,
    ...(isWeb ? {
      background: "linear-gradient(135deg, #818cf8 0%, #bdc2ff 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    } as any : {}),
  },
  welcomeQuote: {
    fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 22,
    fontStyle: "italic",
    fontFamily: isWeb ? "'Source Serif 4', serif" : "System",
  },
  sessionBadge: {
    borderRadius: 99, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: "flex-start",
  },

  // Layout
  row: { flexDirection: "row", alignItems: "stretch" },
  col: { flexDirection: "column" },

  // Insights
  insightsCard:        { padding: 24, position: "relative", overflow: "hidden", flex: 1 },
  insightsCardDesktop: { flex: 2, marginRight: 16 },
  watermark:           { position: "absolute", top: 16, right: 16, opacity: 0.2 },
  insightsHeading:     { fontSize: 12, fontWeight: "700", color: C.primary, letterSpacing: 2 },
  insightsBody:        {
    fontSize: 15, color: C.text, lineHeight: 24,
    fontFamily: isWeb ? "'Source Serif 4', serif" : "System",
  },
  insightsBtn:         {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12,
  },
  insBtnText:          { fontSize: 13, fontWeight: "600" },

  // Velocity
  velocityCard:        { padding: 24, flex: 1 },
  velocityCardDesktop: { flex: 1, marginLeft: 0, maxWidth: 300 },
  velocityLabel:       { fontSize: 11, fontWeight: "700", color: C.muted, letterSpacing: 1.5 },
  velocityNum:         { fontSize: 48, fontWeight: "700", color: C.text, lineHeight: 52 },
  velChart:            { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 80 },
  velBar:              { flex: 1, borderRadius: 3 },

  // Task ledger
  ledgerCard:          { overflow: "hidden", flex: 1 },
  ledgerCardDesktop:   { flex: 2, marginRight: 16 },
  ledgerHeader:        {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tableHead:           { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 10 },
  tableHeadCell:       { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.5 },
  tableRow:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  statusBadge:         { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  statusText:          { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  dueText:             { fontSize: 11, color: C.muted, fontWeight: "500" },
  sectionTitle:        {
    fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 4,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },

  // Chapters list styles
  semesterGroup: {
    marginBottom: 16,
  },
  semesterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  semesterHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: 1.5,
  },
  semesterHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dateGroup: {
    paddingLeft: 4,
  },
  dateGroupTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: C.secondary,
    letterSpacing: 0.5,
  },
  chaptersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chaptersStack: {
    flexDirection: "column",
    gap: 10,
  },
  chapterRowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  chapterItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chapterTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },
  chapterSubjectText: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
});
