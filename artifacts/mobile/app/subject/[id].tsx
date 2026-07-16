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
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = isWeb ? 67 : insets.top;

  const { subject, loading } = useApiSubject(id);

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!subject) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text }}>Subject shelf not found</Text>
      </View>
    );
  }

  // Left indicator strip color
  const borderStripColor = subject.college === "CSE" ? "#9B3131" : "#B8935A";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ParticleMesh />

      {/* Hero header */}
      <View
        style={[
          s.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
          isWeb ? {
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: `0 1px 0 rgba(184,147,90,0.06), 0 4px 24px rgba(0,0,0,0.04)`,
          } as any : {},
        ]}
      >
        <View style={s.headerInner}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              s.backBtn,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Feather name="arrow-left" size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={s.subjectInfo}>
            <View style={[
              s.iconWrap,
              { backgroundColor: subject.color + "12", borderColor: subject.color + "30" },
            ]}>
              <Ionicons name={subject.icon as any} size={28} color={subject.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[
                s.subjectName,
                {
                  color: colors.text,
                  fontFamily: isWeb ? "'Playfair Display', serif" : "System",
                  fontWeight: "700" as any,
                }
              ]}>
                {subject.name}
              </Text>
              <Text style={[
                s.subjectCode,
                {
                  color: colors.accent,
                  fontFamily: isWeb ? "'JetBrains Mono', monospace" : "System",
                }
              ]}>
                {subject.code} · Semester {subject.semester}
              </Text>
              <Text style={[
                s.subjectDesc,
                {
                  color: colors.mutedForeground,
                  fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
                }
              ]} numberOfLines={2}>
                {subject.description}
              </Text>
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
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                <Feather name={m.icon as any} size={11} color={colors.accent} />
                <Text style={[s.metaText, { color: colors.text, fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System" }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Chapter list */}
      <ScrollView
        contentContainerStyle={[s.body, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[
          s.sectionTitle,
          {
            color: colors.text,
            fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            fontWeight: "700" as any,
          }
        ]}>
          Chapters Directory
        </Text>
        {subject.chapters.map((chapter, i) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            index={i}
            subjectId={subject.id}
            borderStripColor={borderStripColor}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ChapterCard({
  chapter, index, subjectId, borderStripColor,
}: {
  chapter: any; index: number; subjectId: string; borderStripColor: string;
}) {
  const colors = useColors();
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
        {
          backgroundColor: colors.card,
          borderColor: hov ? colors.accent : colors.border,
          borderLeftColor: borderStripColor,
        },
        isWeb ? {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: hov
            ? `0 4px 16px rgba(0,0,0,0.06), 0 0 1px rgba(184,147,90,0.2)`
            : "0 1px 4px rgba(0,0,0,0.02)",
          transition: "all 0.22s ease",
        } as any : {},
      ]}
    >
      <View style={[
        s.chapterNum,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}>
        <Text style={[s.chapterNumText, { color: colors.text, fontFamily: isWeb ? "'JetBrains Mono', monospace" : "System" }]}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[
          s.chapterTitle,
          {
            color: colors.text,
            fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            fontWeight: "600" as any,
          }
        ]}>{chapter.title}</Text>
      </View>
      <Feather
        name="chevron-right"
        size={16}
        color={colors.accent}
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
  headerInner: { maxWidth: 860, width: "100%" as any, alignSelf: "center" as any },
  backBtn: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16, borderWidth: 1,
  },
  subjectInfo: {
    flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 14,
  },
  iconWrap: {
    width: 58, height: 58, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, borderWidth: 1,
  },
  subjectName: { fontSize: 20, marginBottom: 4 },
  subjectCode: { fontSize: 12, marginBottom: 4 },
  subjectDesc: { fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: "row", gap: 8 },
  metaPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  metaText: { fontSize: 11, fontWeight: "600" },
  body: { padding: 16, gap: 10, maxWidth: 860, width: "100%" as any, alignSelf: "center" as any },
  sectionTitle: { fontSize: 18, marginBottom: 4, marginTop: 4 },
  chapterCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 10, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 12,
  },
  chapterNum: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, borderWidth: 1,
  },
  chapterNumText: { fontSize: 15, fontWeight: "700" },
  chapterTitle: { fontSize: 15 },
});
