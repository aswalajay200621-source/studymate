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

const isWeb = Platform.OS === "web";

// ── Design tokens ─────────────────────────────────────────────────────────
const BG         = "#080B1A";
const BORDER     = "rgba(124,92,252,0.18)";
const PURPLE     = "#7C5CFC";
const MUTED      = "#6B7280";
const FG         = "#E2E8F0";
// ─────────────────────────────────────────────────────────────────────────

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
      </View>

      {/* ── HTML Notes Viewer ─────────────────────────────────────── */}
      <HtmlViewer html={htmlContent} background={BG} />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    borderBottomWidth: 1, borderLeftWidth: 3,
    paddingBottom: 12, position: "relative" as any,
  },
  headerTop: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, paddingHorizontal: 16, paddingTop: 8,
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
});
