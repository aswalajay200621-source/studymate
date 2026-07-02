import { router, useLocalSearchParams } from "expo-router";
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
import * as Haptics from "expo-haptics";
import { useApiSubject } from "@/hooks/useApiSubject";
import { ParticleMesh } from "@/components/ParticleMesh";

const isWeb = Platform.OS === "web";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG       = "#080B1A";
const CARD     = "rgba(15,18,40,0.85)";
const CARD_HOV = "rgba(22,26,56,0.95)";
const BORDER   = "rgba(124,92,252,0.18)";
const BORDER_H = "rgba(124,92,252,0.50)";
const PURPLE   = "#7C5CFC";
const PURPLE_TXT = "#A78BFA";
const MUTED    = "#6B7280";
const FG       = "#E2E8F0";
// ─────────────────────────────────────────────────────────────────────────────

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = isWeb ? 67 : insets.top;

  const { subject, loading } = useApiSubject(id);

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: BG, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={PURPLE} size="large" />
      </View>
    );
  }

  if (!subject) {
    return (
      <View style={[s.root, { backgroundColor: BG, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: FG }}>Subject not found</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      {/* Ambient particle background */}
      <ParticleMesh />

      {/* Hero header — glass panel with subject color accent */}
      <View
        style={[
          s.header,
          { paddingTop: topPad + 12 },
          isWeb ? {
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            backgroundColor: "rgba(8,11,26,0.82)",
            borderBottomColor: subject.color + "40",
            boxShadow: `0 1px 0 ${subject.color}25, 0 4px 32px rgba(0,0,0,0.5)`,
          } as any : {
            backgroundColor: "rgba(12,14,32,0.95)",
            borderBottomColor: subject.color + "40",
          },
        ]}
      >
        {/* Accent glow bar at top */}
        {isWeb && React.createElement("div", {
          style: {
            position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            background: `linear-gradient(90deg, transparent, ${subject.color}90, ${subject.color}, ${subject.color}90, transparent)`,
            pointerEvents: "none",
          },
        } as any)}

        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            s.backBtn,
            isWeb ? {
              backdropFilter: "blur(12px)",
              backgroundColor: "rgba(255,255,255,0.06)",
              borderColor: BORDER,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            } as any : { backgroundColor: "rgba(255,255,255,0.08)", borderColor: BORDER },
          ]}
        >
          <Feather name="arrow-left" size={18} color={FG} />
        </TouchableOpacity>

        <View style={s.subjectInfo}>
          <View style={[
            s.iconWrap,
            { backgroundColor: subject.color + "18", borderColor: subject.color + "40" },
            isWeb ? { boxShadow: `0 0 20px ${subject.color}30` } as any : {},
          ]}>
            <Ionicons name={subject.icon as any} size={28} color={subject.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subjectName}>{subject.name}</Text>
            <Text style={[s.subjectCode, { color: subject.color }]}>
              {subject.code} · Semester {subject.semester}
            </Text>
            <Text style={s.subjectDesc} numberOfLines={2}>{subject.description}</Text>
          </View>
        </View>

        <View style={s.metaRow}>
          {[
            { icon: "book", label: `${subject.chapters.length} Chapters` },
            { icon: "credit-card", label: "Flashcards" },
            { icon: "check-square", label: "Quizzes" },
          ].map((m) => (
            <View
              key={m.label}
              style={[
                s.metaPill,
                { backgroundColor: subject.color + "15", borderColor: subject.color + "35" },
              ]}
            >
              <Feather name={m.icon as any} size={11} color={subject.color} />
              <Text style={[s.metaText, { color: subject.color }]}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Chapter list */}
      <ScrollView
        contentContainerStyle={[s.body, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionTitle}>Chapters</Text>
        {subject.chapters.map((chapter, i) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            index={i}
            subjectId={subject.id}
            accentColor={subject.color}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ChapterCard({
  chapter, index, subjectId, accentColor,
}: {
  chapter: any; index: number; subjectId: string; accentColor: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/chapter/${chapter.id}?subjectId=${subjectId}`);
      }}
      activeOpacity={0.85}
      {...(webHover(setHov) as any)}
      style={[
        s.chapterCard,
        isWeb ? {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          backgroundColor: hov ? CARD_HOV : CARD,
          borderColor: hov ? accentColor + "50" : BORDER,
          boxShadow: hov
            ? `0 0 0 1px ${accentColor}40, 0 4px 20px rgba(124,92,252,0.15), inset 0 1px 0 rgba(255,255,255,0.04)`
            : "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
          transition: "all 0.22s ease",
        } as any : { backgroundColor: CARD, borderColor: BORDER },
      ]}
    >
      <View style={[
        s.chapterNum,
        { backgroundColor: accentColor + "15", borderColor: accentColor + "35" },
        isWeb && hov ? { boxShadow: `0 0 12px ${accentColor}40` } as any : {},
      ]}>
        <Text style={[s.chapterNumText, { color: accentColor }]}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.chapterTitle}>{chapter.title}</Text>
      </View>
      <Feather
        name="chevron-right"
        size={16}
        color={hov ? PURPLE_TXT : MUTED}
      />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, position: "relative" as any },
  header: {
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, position: "relative" as any,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16, borderWidth: 1,
  },
  subjectInfo: {
    flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 14,
  },
  iconWrap: {
    width: 58, height: 58, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, borderWidth: 1,
  },
  subjectName: {
    color: FG, fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4,
  },
  subjectCode: {
    fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 4,
  },
  subjectDesc: {
    color: MUTED, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18,
  },
  metaRow: { flexDirection: "row", gap: 8 },
  metaPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  metaText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  body: { padding: 16, gap: 10, maxWidth: 860, width: "100%" as any, alignSelf: "center" as any },
  sectionTitle: {
    fontSize: 18, fontFamily: "Inter_700Bold", color: FG, marginBottom: 4, marginTop: 4,
  },
  chapterCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 12,
  },
  chapterNum: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, borderWidth: 1,
  },
  chapterNumText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  chapterTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: FG },
});
