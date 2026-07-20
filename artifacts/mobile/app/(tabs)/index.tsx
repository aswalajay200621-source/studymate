import { router } from "expo-router";
import React, { useState } from "react";
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

// ── Task ledger row ───────────────────────────────────────────────────────────
const TASKS = [
  { title: "Assignment Review",      sub: "Core Subjects",  status: "Urgent",      due: "Today, 23:59"  },
  { title: "Chapter Summary Draft",  sub: "Study Notes",    status: "In-Progress", due: "Tomorrow"      },
  { title: "Practice Problem Set",   sub: "Exam Prep",      status: "Not-Started", due: "This week"     },
];

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  "Urgent":      { bg: "#93000a",             text: "#ffdad6" },
  "In-Progress": { bg: "rgba(189,194,255,0.15)", text: "#bdc2ff" },
  "Not-Started": { bg: "rgba(255,255,255,0.06)", text: "#c6c5d5" },
};

// ── Active discipline card ────────────────────────────────────────────────────
function DisciplineCard({ name, pct, color }: { name: string; pct: number; color: string }) {
  const [hov, setHov] = useState(false);
  return (
    <View
      style={[...glassCard(s.discCard), hov && { borderColor: `${color}55` } as any]}
      {...(isWeb ? {
        onMouseEnter: () => setHov(true),
        onMouseLeave: () => setHov(false),
      } as any : {})}
    >
      <Text style={s.discName}>{name}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, marginBottom: 6 }}>
        <Text style={s.masteryLabel}>MASTERY</Text>
        <Text style={[s.masteryPct, { color }]}>{pct}%</Text>
      </View>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Dashboard screen ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCollege } = useApp();
  const isDesktop = useIsDesktop();
  const topPad = isWeb ? 72 : insets.top + 16;

  const { subjects } = useApiSubjects(selectedCollege ?? "");

  // Bar chart heights for Study Velocity
  const bars = [30, 45, 60, 50, 80, 100, 90];

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

        {/* ── Main row: Active Disciplines ── */}
        <View style={{ gap: 14 }}>
          <Text style={s.sectionTitle}>Active Disciplines</Text>
          <View style={isDesktop ? { flexDirection: "row", flexWrap: "wrap", gap: 16 } : { flexDirection: "column", gap: 14 }}>
            {subjects.slice(0, 4).map((sub, idx) => (
              <TouchableOpacity
                key={sub.id}
                onPress={() => router.push({ pathname: "/subject/[id]", params: { id: sub.id } })}
                activeOpacity={0.85}
                style={isDesktop ? { width: "31%" as any } : {}}
              >
                <DisciplineCard
                  name={sub.name}
                  pct={[72, 48, 31, 85][idx % 4]}
                  color={[C.primary, C.secondary, C.tertiary, C.primary][idx % 4]}
                />
              </TouchableOpacity>
            ))}
            {subjects.length === 0 && (
              <>
                <View style={isDesktop ? { width: "48%" as any } : {}}>
                  <DisciplineCard name="Neural Networks"    pct={72} color={C.primary}   />
                </View>
                <View style={isDesktop ? { width: "48%" as any } : {}}>
                  <DisciplineCard name="Circuit Dynamics"   pct={48} color={C.secondary} />
                </View>
              </>
            )}
          </View>
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

  // Disciplines
  discColDesktop: { flex: 1 },
  discCard:       { padding: 18, marginBottom: 2 },
  discName:       {
    fontSize: 15, fontWeight: "700", color: C.text,
    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
  },
  masteryLabel:   { fontSize: 10, fontWeight: "700", color: C.muted, letterSpacing: 1.5 },
  masteryPct:     { fontSize: 13, fontWeight: "700" },
  progressTrack:  { height: 6, backgroundColor: C.surfaceHigh2, borderRadius: 99, overflow: "hidden" },
  progressFill:   { height: "100%" as any, borderRadius: 99 },
});
