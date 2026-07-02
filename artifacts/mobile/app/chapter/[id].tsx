import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApiSubject } from "@/hooks/useApiSubject";
import { useApiChapter } from "@/hooks/useApiChapter";
import FlashCard from "@/components/FlashCard";
import QuizView from "@/components/QuizView";

const isWeb = Platform.OS === "web";

// ── Design tokens ─────────────────────────────────────────────────────────
const BG      = "#080B1A";
const CARD    = "rgba(15,18,40,0.88)";
const BORDER  = "rgba(124,92,252,0.18)";
const PURPLE  = "#7C5CFC";
const PURPLE_TXT = "#A78BFA";
const MUTED   = "#6B7280";
const FG      = "#E2E8F0";
// ─────────────────────────────────────────────────────────────────────────

type Tab = "notes" | "flashcards" | "quiz";
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "notes",      label: "Notes",      icon: "file-text"   },
  { key: "flashcards", label: "Flashcards", icon: "credit-card" },
  { key: "quiz",       label: "Quiz",       icon: "check-square" },
];

function HtmlViewer({ html, background }: { html: string; background: string }) {
  if (isWeb) {
    const IFrame = "iframe" as unknown as React.ComponentType<{
      srcDoc: string;
      style: React.CSSProperties;
    }>;
    return (
      <IFrame
        srcDoc={html}
        style={{
          flex: 1,
          border: "none",
          width: "100%",
          height: "100%",
          backgroundColor: background,
        }}
      />
    );
  }
  const { WebView } = require("react-native-webview");
  return (
    <WebView
      source={{ html }}
      style={{ flex: 1, backgroundColor: background }}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      scalesPageToFit={false}
    />
  );
}

export default function ChapterScreen() {
  const { id, subjectId } = useLocalSearchParams<{ id: string; subjectId: string }>();
  const insets  = useSafeAreaInsets();
  const topPad  = isWeb ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<Tab>("notes");

  const { subject } = useApiSubject(subjectId);
  const { chapter, loading } = useApiChapter(subjectId, id);

  const subjectColor = subject?.color ?? PURPLE;
  const subjectName  = subject?.name ?? "";

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: BG, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={PURPLE} size="large" />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={[s.root, { backgroundColor: BG, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: FG }}>Chapter not found</Text>
      </View>
    );
  }

  const htmlContent = chapter.contentHtml
    ? chapter.contentHtml
    : `<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;min-height:80vh;font-family:sans-serif;color:#9ca3af;text-align:center;margin:0;"><div><div style="font-size:48px;margin-bottom:16px">📄</div><p style="font-size:16px">No notes uploaded yet</p></div></body></html>`;

  const flashcards = chapter.flashcards ?? [];
  const quizzes    = chapter.quiz ?? [];

  // Tabs that have content
  const availableTabs = TABS.filter((t) => {
    if (t.key === "notes") return true;
    if (t.key === "flashcards") return flashcards.length > 0;
    if (t.key === "quiz") return quizzes.length > 0;
    return false;
  });

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View
        style={[
          s.header,
          { paddingTop: topPad + 8, borderBottomColor: subjectColor + "40", borderLeftColor: subjectColor },
          isWeb ? {
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            backgroundColor: "rgba(8,11,26,0.82)",
            boxShadow: `0 1px 0 ${subjectColor}25`,
          } as any : { backgroundColor: "rgba(12,14,32,0.96)" },
        ]}
      >
        <View style={s.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[s.backBtn, { borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.06)" }]}
          >
            <Feather name="arrow-left" size={18} color={FG} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.subjectLabel, { color: subjectColor }]} numberOfLines={1}>
              {subjectName}
            </Text>
            <Text style={s.chapterTitle} numberOfLines={2}>
              {chapter.title}
            </Text>
          </View>
        </View>

        {/* ── Tab Selector ───────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabBar}
        >
          {availableTabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  s.tabBtn,
                  active
                    ? { backgroundColor: subjectColor + "22", borderColor: subjectColor + "55" }
                    : { backgroundColor: "rgba(255,255,255,0.04)", borderColor: BORDER },
                  isWeb && active ? { boxShadow: `0 0 10px ${subjectColor}30` } as any : {},
                ]}
              >
                <Feather
                  name={tab.icon as any}
                  size={13}
                  color={active ? subjectColor : MUTED}
                />
                <Text style={[s.tabLabel, { color: active ? subjectColor : MUTED }]}>
                  {tab.label}
                  {tab.key === "flashcards" && flashcards.length > 0 && (
                    <Text style={[s.tabCount, { color: active ? subjectColor : MUTED }]}>
                      {" "}({flashcards.length})
                    </Text>
                  )}
                  {tab.key === "quiz" && quizzes.length > 0 && (
                    <Text style={[s.tabCount, { color: active ? subjectColor : MUTED }]}>
                      {" "}({quizzes.length})
                    </Text>
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ──────────────────────────────────────────────── */}
      {activeTab === "notes" && (
        <HtmlViewer html={htmlContent} background={BG} />
      )}

      {activeTab === "flashcards" && (
        flashcards.length > 0 ? (
          <FlatList
            data={flashcards}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}
            renderItem={({ item, index }) => (
              <FlashCard card={item} index={index} total={flashcards.length} />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={s.empty}>
            <Feather name="credit-card" size={40} color={MUTED} />
            <Text style={s.emptyText}>No flashcards yet for this chapter</Text>
          </View>
        )
      )}

      {activeTab === "quiz" && (
        quizzes.length > 0 ? (
          <QuizView questions={quizzes} />
        ) : (
          <View style={s.empty}>
            <Feather name="check-square" size={40} color={MUTED} />
            <Text style={s.emptyText}>No quiz questions yet for this chapter</Text>
          </View>
        )
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    borderBottomWidth: 1, borderLeftWidth: 3,
    paddingBottom: 0, position: "relative" as any,
  },
  headerTop: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginTop: 2, borderWidth: 1,
  },
  subjectLabel: {
    fontSize: 11, fontFamily: "Inter_700Bold",
    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2,
  },
  chapterTitle: {
    color: FG, fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 23,
  },
  tabBar: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4,
  },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, borderWidth: 1,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  tabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 14,
  },
  emptyText: { color: MUTED, fontSize: 15, fontFamily: "Inter_400Regular" },
});
