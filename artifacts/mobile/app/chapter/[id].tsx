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
import { useColors } from "@/hooks/useColors";
import { useApiSubject } from "@/hooks/useApiSubject";
import { useApiChapter } from "@/hooks/useApiChapter";

function HtmlViewer({ html, background }: { html: string; background: string }) {
  if (Platform.OS === "web") {
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

  // Native: use WebView
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
  const { id, subjectId } = useLocalSearchParams<{
    id: string;
    subjectId: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { subject } = useApiSubject(subjectId);
  const { chapter, loading } = useApiChapter(subjectId, id);

  const subjectColor = subject?.color ?? "#4361EE";
  const subjectName = subject?.name ?? "";

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={[s.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.foreground }}>Chapter not found</Text>
      </View>
    );
  }

  const htmlContent = chapter.contentHtml
    ? chapter.contentHtml
    : `<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;min-height:80vh;font-family:sans-serif;color:#9ca3af;text-align:center;margin:0;"><div><div style="font-size:48px;margin-bottom:16px">📄</div><p style="font-size:16px">No notes uploaded yet</p></div></body></html>`;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          s.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            borderLeftColor: subjectColor,
          },
        ]}
      >
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.subjectLabel, { color: subjectColor }]} numberOfLines={1}>
              {subjectName}
            </Text>
            <Text style={[s.chapterTitle, { color: colors.foreground }]} numberOfLines={2}>
              {chapter.title}
            </Text>
          </View>
        </View>
      </View>

      <HtmlViewer html={htmlContent} background={colors.background} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    borderLeftWidth: 4,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  subjectLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  chapterTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    lineHeight: 23,
  },
});
