import { router, useLocalSearchParams } from "expo-router";
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
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useApiSubject } from "@/hooks/useApiSubject";

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { subject, loading } = useApiSubject(id);

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!subject) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.foreground }}>Subject not found</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[subject.color, subject.color + "BB"]}
        style={[s.header, { paddingTop: topPad + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={s.subjectInfo}>
          <View style={s.iconWrap}>
            <Ionicons name={subject.icon as any} size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subjectName}>{subject.name}</Text>
            <Text style={s.subjectCode}>{subject.code} · Semester {subject.semester}</Text>
            <Text style={s.subjectDesc} numberOfLines={2}>{subject.description}</Text>
          </View>
        </View>
        <View style={s.metaRow}>
          <View style={s.metaPill}>
            <Feather name="book" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={s.metaText}>{subject.chapters.length} Chapters</Text>
          </View>
          <View style={s.metaPill}>
            <Feather name="credit-card" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={s.metaText}>Flashcards</Text>
          </View>
          <View style={s.metaPill}>
            <Feather name="check-square" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={s.metaText}>Quizzes</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.body, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Chapters</Text>
        {subject.chapters.map((chapter, i) => (
            <TouchableOpacity
              key={chapter.id}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/chapter/${chapter.id}?subjectId=${subject.id}`);
              }}
              activeOpacity={0.85}
              style={[
                s.chapterCard,
                {
                  backgroundColor: colors.card,
                  borderColor: subject.color + "33",
                },
              ]}
            >
              <View style={[s.chapterNum, { backgroundColor: subject.color + "18" }]}>
                <Text style={[s.chapterNumText, { color: subject.color }]}>
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.chapterTitle, { color: colors.foreground }]}>
                  {chapter.title}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  subjectInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  subjectName: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 3,
  },
  subjectCode: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  subjectDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  body: { padding: 16, gap: 10, maxWidth: 860, width: "100%", alignSelf: "center" },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  chapterCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  chapterNum: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chapterNumText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  chapterTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  lockBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
});
