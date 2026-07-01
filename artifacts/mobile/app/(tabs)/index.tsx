import { router } from "expo-router";
import React, { useState } from "react";
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
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/content";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useApiSubjects } from "@/hooks/useApiSubjects";
import { DotGrid } from "@/components/DotGrid";

// ─── design tokens ────────────────────────────────────────────────────────────
const BG        = "#09090B";
const GLASS     = "rgba(255,255,255,0.06)";
const GLASS_HOV = "rgba(255,255,255,0.10)";
const BORDER    = "rgba(255,255,255,0.08)";
const PURPLE    = "#8B5CF6";
const PURPLE_DIM= "rgba(139,92,246,0.15)";
const PURPLE_TXT= "#A78BFA";
const PURPLE_LIT= "#C4B5FD";
const MUTED     = "#6B7280";
const FG        = "#E2E8F0";
const isWeb     = Platform.OS === "web";
// ──────────────────────────────────────────────────────────────────────────────

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

function SubjectIconCell({ icon, color }: { icon: string; color: string }) {
  if (/^[a-z][a-z0-9-]*$/.test(icon)) {
    return <Ionicons name={icon as any} size={22} color={color} />;
  }
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatCard({ icon, label, color }: { icon: string; label: string; color: string }) {
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      {...(webHover(setHov) as any)}
      style={[
        s.featCard,
        isWeb ? {
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          backgroundColor: hov ? GLASS_HOV : GLASS,
          borderColor: hov ? "rgba(139,92,246,0.22)" : BORDER,
          boxShadow: hov
            ? "0 0 18px rgba(139,92,246,0.18), 0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 2px 12px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
          transition: "all 0.25s ease",
        } as any : { backgroundColor: GLASS, borderColor: BORDER },
      ]}
    >
      <View style={[s.featIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={[s.featLabel, { color: hov ? PURPLE_LIT : FG }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Subject row ──────────────────────────────────────────────────────────────
function SubjectRow({ sub }: { sub: any }) {
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => router.push(`/subject/${sub.id}`)}
      activeOpacity={0.85}
      {...(webHover(setHov) as any)}
      style={[
        s.subjectRow,
        isWeb ? {
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          backgroundColor: hov ? GLASS_HOV : GLASS,
          borderColor: hov ? "rgba(139,92,246,0.22)" : BORDER,
          boxShadow: hov
            ? "0 0 14px rgba(139,92,246,0.15), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 2px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
          transition: "all 0.25s ease",
        } as any : { backgroundColor: GLASS, borderColor: BORDER },
      ]}
    >
      <View style={[s.subjectIcon, { backgroundColor: sub.color + "18" }]}>
        <SubjectIconCell icon={sub.icon} color={sub.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.subjectName, { color: hov ? PURPLE_LIT : FG }]}>{sub.name}</Text>
        <Text style={[s.subjectMeta, { color: MUTED }]}>
          {sub.code} · Sem {sub.semester} · {sub.chapterCount} chapters
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={hov ? PURPLE_TXT : MUTED} />
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { selectedCollege } = useApp();
  const isDesktop = useIsDesktop();
  const topPad    = isDesktop ? 0 : Platform.OS === "web" ? 67 : insets.top;

  const { subjects, loading } = useApiSubjects(selectedCollege);

  if (!selectedCollege) return null;

  const college = COLLEGES[selectedCollege];
  const recent  = subjects.slice(0, 3);

  const features = [
    { icon: "search",  label: "Search Notes", color: PURPLE },
    { icon: "archive", label: "PYQs",         color: "#7C3AED" },
  ] as const;

  return (
    <View style={[s.wrapper, { backgroundColor: BG }]}>
      {/* Interactive dot grid — fixed behind scrollable content */}
      {isDesktop && <DotGrid />}

      <ScrollView
        style={s.root}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Glass header card ──────────────────────────────────────────── */}
        <View style={[
          s.header,
          { paddingTop: topPad + 24, paddingHorizontal: isDesktop ? 40 : 20 },
          isDesktop && { maxWidth: 900, alignSelf: "center" as any, width: "100%" as any },
        ]}>
          <View style={[
            s.headerCard,
            isWeb ? {
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              backgroundColor: "rgba(139,92,246,0.09)",
              borderColor: "rgba(139,92,246,0.18)",
              boxShadow: "0 0 40px rgba(139,92,246,0.12), 0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
            } as any : { backgroundColor: "rgba(139,92,246,0.10)", borderColor: "rgba(139,92,246,0.20)" },
          ]}>
            <View style={s.headerTop}>
              <View style={{ gap: 4 }}>
                <Text style={s.greeting}>Welcome back!</Text>
                <Text style={s.collegeName}>{college.name}</Text>
                <Text style={s.collegeStream}>{college.fullName}</Text>
              </View>
              <View style={[
                s.avatarCircle,
                isWeb ? { boxShadow: "0 0 18px rgba(139,92,246,0.30)" } as any : {},
              ]}>
                <Feather name="book-open" size={22} color={PURPLE_TXT} />
              </View>
            </View>
            <View style={s.pillRow}>
              <View style={s.pill}>
                <Feather name="layers" size={12} color={PURPLE_TXT} />
                <Text style={s.pillText}>{subjects.length} Subjects</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <View style={[
          s.body,
          isDesktop && { maxWidth: 900, alignSelf: "center" as any, width: "100%" as any, paddingHorizontal: 40 },
        ]}>

          {/* Section: Features */}
          <Text style={s.sectionTitle}>Features</Text>
          <View style={s.featGrid}>
            {features.map((f) => (
              <FeatCard key={f.label} icon={f.icon} label={f.label} color={f.color} />
            ))}
          </View>

          {/* Ambient glow behind subjects */}
          {isDesktop && isWeb && React.createElement("div", {
            style: {
              position: "absolute",
              width: "500px", height: "300px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(139,92,246,0.09) 0%, transparent 70%)",
              top: "60%", left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
            },
          } as any)}

          {/* Section: Subjects */}
          <Text style={[s.sectionTitle, { marginTop: 8 }]}>Your Subjects</Text>

          {loading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={PURPLE} />
            </View>
          ) : recent.length === 0 ? (
            <View style={[
              s.emptyCard,
              isWeb ? {
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                backgroundColor: GLASS, borderColor: BORDER,
              } as any : { backgroundColor: GLASS, borderColor: BORDER },
            ]}>
              <Feather name="book" size={28} color={MUTED} />
              <Text style={[s.emptyText, { color: MUTED }]}>No subjects yet</Text>
            </View>
          ) : (
            recent.map((sub) => <SubjectRow key={sub.id} sub={sub} />)
          )}

          {!loading && subjects.length > 3 && (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/library")}
              style={[
                s.viewAllBtn,
                isWeb ? {
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  backgroundColor: GLASS, borderColor: "rgba(139,92,246,0.18)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                } as any : { backgroundColor: GLASS, borderColor: BORDER },
              ]}
            >
              <Text style={[s.viewAllText, { color: PURPLE_TXT }]}>
                View all {subjects.length} subjects
              </Text>
              <Feather name="arrow-right" size={14} color={PURPLE_TXT} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper:  { flex: 1 },
  root:     { flex: 1, backgroundColor: "transparent" },

  header:   { paddingBottom: 0 },
  headerCard: {
    borderRadius: 22, borderWidth: 1,
    padding: 20, marginBottom: 0,
  },
  headerTop: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 16,
  },
  greeting:     { color: MUTED, fontSize: 13, fontFamily: "Inter_400Regular" },
  collegeName:  { color: FG, fontSize: 22, fontFamily: "Inter_700Bold" },
  collegeStream:{ color: PURPLE_TXT, fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(139,92,246,0.14)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.25)",
  },
  pillRow: { flexDirection: "row", gap: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.20)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  pillText: { color: PURPLE_TXT, fontSize: 12, fontFamily: "Inter_600SemiBold" },

  body:         { padding: 20, gap: 12 },
  sectionTitle: { color: FG, fontSize: 17, fontFamily: "Inter_700Bold", marginTop: 4 },

  featGrid: { flexDirection: "row", gap: 12 },
  featCard: {
    flex: 1, borderRadius: 18, borderWidth: 1,
    padding: 18, alignItems: "center", gap: 10,
  },
  featIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  featLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },

  subjectRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, borderWidth: 1, padding: 16, gap: 14,
  },
  subjectIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  subjectName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  subjectMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },

  loadingRow: { paddingVertical: 28, alignItems: "center" },
  emptyCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 36, alignItems: "center", gap: 12,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },

  viewAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 14, borderWidth: 1, paddingVertical: 14,
  },
  viewAllText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
