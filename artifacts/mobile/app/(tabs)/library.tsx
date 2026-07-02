import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { Feather, Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/content";
import { useApiSubjects, type ApiSubject } from "@/hooks/useApiSubjects";
import { ParticleMesh } from "@/components/ParticleMesh";

const isWeb = Platform.OS === "web";

// ── Design tokens (deep-space purple theme) ──────────────────────────────────
const BG        = "#080B1A";
const CARD      = "rgba(15,18,40,0.85)";
const CARD_HOV  = "rgba(20,24,52,0.95)";
const BORDER    = "rgba(124,92,252,0.18)";
const BORDER_H  = "rgba(124,92,252,0.45)";
const PURPLE    = "#7C5CFC";
const PURPLE_DIM = "rgba(124,92,252,0.12)";
const PURPLE_TXT = "#A78BFA";
const PURPLE_LIT = "#C4B5FD";
const MUTED     = "#6B7280";
const FG        = "#E2E8F0";
// ─────────────────────────────────────────────────────────────────────────────

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCollege } = useApp();
  const topPad = isWeb ? 67 : insets.top;
  const [query, setQuery] = useState("");

  const { subjects, loading } = useApiSubjects(selectedCollege);

  if (!selectedCollege) return null;
  const college = COLLEGES[selectedCollege];

  const filtered = useMemo(() => {
    if (!query.trim()) return subjects;
    const q = query.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [subjects, query]);

  const sem1 = filtered.filter((s) => s.semester === 1);
  const sem2 = filtered.filter((s) => s.semester === 2);

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      {/* Particle field background */}
      <ParticleMesh />

      {/* Header */}
      <View
        style={[
          s.header,
          { paddingTop: topPad + 12 },
          isWeb ? {
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            backgroundColor: "rgba(8,11,26,0.80)",
            borderBottomColor: BORDER,
            boxShadow: "0 1px 0 rgba(124,92,252,0.10), 0 4px 24px rgba(0,0,0,0.4)",
          } as any : { backgroundColor: BG, borderBottomColor: BORDER },
        ]}
      >
        <Text style={s.title}>Library</Text>
        <Text style={[s.subtitle, { color: PURPLE_TXT }]}>{college.fullName}</Text>

        {/* Search bar */}
        <View
          style={[
            s.searchRow,
            isWeb ? {
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              backgroundColor: "rgba(255,255,255,0.04)",
              borderColor: BORDER,
              boxShadow: "0 0 0 1px rgba(124,92,252,0.08)",
            } as any : { backgroundColor: "rgba(255,255,255,0.04)", borderColor: BORDER },
          ]}
        >
          <Feather name="search" size={16} color={MUTED} />
          <TextInput
            style={s.searchInput}
            placeholder="Search subjects..."
            placeholderTextColor={MUTED}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={15} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={PURPLE} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.body, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {sem1.length > 0 && (
            <SubjectGroup title="Semester 1" subjects={sem1} />
          )}
          {sem2.length > 0 && (
            <SubjectGroup title="Semester 2" subjects={sem2} />
          )}
          {filtered.length === 0 && (
            <View style={s.empty}>
              <Feather name="search" size={36} color={MUTED} />
              <Text style={s.emptyText}>No subjects found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SubjectCard({ sub }: { sub: ApiSubject }) {
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity
      key={sub.id}
      onPress={() => router.push(`/subject/${sub.id}`)}
      activeOpacity={0.85}
      {...(webHover(setHov) as any)}
      style={[
        sg.card,
        isWeb ? {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          backgroundColor: hov ? CARD_HOV : CARD,
          borderColor: hov ? BORDER_H : BORDER,
          boxShadow: hov
            ? `0 0 0 1px ${BORDER_H}, 0 4px 24px rgba(124,92,252,0.18), inset 0 1px 0 rgba(255,255,255,0.04)`
            : `0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)`,
          transition: "all 0.22s ease",
        } as any : { backgroundColor: CARD, borderColor: BORDER },
      ]}
    >
      <View style={[sg.iconWrap, { backgroundColor: sub.color + "18", borderColor: sub.color + "30", borderWidth: 1 }]}>
        {/^[a-z][a-z0-9-]*$/.test(sub.icon)
          ? <Ionicons name={sub.icon as any} size={22} color={sub.color} />
          : <Text style={{ fontSize: 22 }}>{sub.icon}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={sg.name}>{sub.name}</Text>
        <Text style={[sg.code, { color: sub.color }]}>{sub.code}</Text>
        <Text style={sg.desc} numberOfLines={1}>{sub.description}</Text>
        <Text style={sg.chapters}>
          {sub.chapterCount} chapter{sub.chapterCount !== 1 ? "s" : ""}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={hov ? PURPLE_TXT : MUTED} />
    </TouchableOpacity>
  );
}

function SubjectGroup({ title, subjects }: { title: string; subjects: ApiSubject[] }) {
  return (
    <View style={sg.group}>
      <Text style={sg.groupTitle}>{title}</Text>
      {subjects.map((sub) => <SubjectCard key={sub.id} sub={sub} />)}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, position: "relative" as any },
  header: {
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title:      { fontSize: 28, fontFamily: "Inter_700Bold", color: FG, marginBottom: 2 },
  subtitle:   { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 14 },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: FG, outlineStyle: "none" as any },
  body:    { maxWidth: 860, width: "100%" as any, alignSelf: "center" as any, padding: 16, gap: 8 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },
  empty:   { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: MUTED },
});

const sg = StyleSheet.create({
  group:      { marginBottom: 8, gap: 8 },
  groupTitle: {
    fontSize: 16, fontFamily: "Inter_700Bold",
    color: FG, marginBottom: 6, marginTop: 10,
    letterSpacing: 0.3,
  },
  card: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1, padding: 14, gap: 12,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  name:     { fontSize: 15, fontFamily: "Inter_700Bold", color: FG, marginBottom: 2 },
  code:     { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  desc:     { fontSize: 12, fontFamily: "Inter_400Regular", color: MUTED, marginBottom: 2 },
  chapters: { fontSize: 11, fontFamily: "Inter_400Regular", color: MUTED },
});
