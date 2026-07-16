import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApiSubject } from "@/hooks/useApiSubject";
import { useApiChapter } from "@/hooks/useApiChapter";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

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
  const colors = useColors();
  const insets  = useSafeAreaInsets();
  const topPad  = isWeb ? 67 : insets.top;

  const { subject } = useApiSubject(subjectId);
  const { chapter, loading } = useApiChapter(subjectId, id);

  const subjectColor = subject?.color ?? colors.accent;
  const subjectName  = subject?.name ?? "";

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text }}>Chapter shelf not found</Text>
      </View>
    );
  }

  const borderStripColor = subject?.college === "CSE" ? "#9B3131" : "#B8935A";

  const htmlContent = chapter.contentHtml
    ? chapter.contentHtml
    : `<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;min-height:80vh;font-family:sans-serif;color:#a79c82;text-align:center;margin:0;background-color:${colors.card}"><div><div style="font-size:48px;margin-bottom:16px">📄</div><p style="font-size:16px">No notes uploaded to this chapter shelf yet</p></div></body></html>`;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View
        style={[
          s.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            borderLeftColor: borderStripColor,
          },
          isWeb ? {
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: `0 1px 0 rgba(184,147,90,0.06)`,
          } as any : {},
        ]}
      >
        <View style={s.headerInner}>
          <View style={s.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[s.backBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
            >
              <Feather name="arrow-left" size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[s.subjectLabel, { color: colors.accent, fontFamily: isWeb ? "'JetBrains Mono', monospace" : "System" }]} numberOfLines={1}>
                {subjectName}
              </Text>
              <Text style={[
                s.chapterTitle,
                {
                  color: colors.text,
                  fontFamily: isWeb ? "'Playfair Display', serif" : "System",
                  fontWeight: "700" as any,
                }
              ]} numberOfLines={2}>
                {chapter.title}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── HTML Notes Viewer ─────────────────────────────────────── */}
      <HtmlViewer html={htmlContent} background={colors.card} />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    borderBottomWidth: 1, borderLeftWidth: 4,
    paddingBottom: 12, position: "relative" as any,
  },
  headerInner: { maxWidth: 860, width: "100%" as any, alignSelf: "center" as any },
  headerTop: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, paddingHorizontal: 16, paddingTop: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    marginTop: 2, borderWidth: 1,
  },
  subjectLabel: {
    fontSize: 11,
    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2,
  },
  chapterTitle: { fontSize: 17, lineHeight: 23 },
});
