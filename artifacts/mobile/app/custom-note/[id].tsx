import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { getApiBase } from "@/utils/api";

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

export default function CustomNoteViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const insets  = useSafeAreaInsets();
  const topPad  = isWeb ? 67 : insets.top;

  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNote() {
      if (!token || !id) return;
      try {
        const res = await fetch(`${getApiBase()}/user-notes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNote(data);
        }
      } catch (err) {
        console.error("Failed to load custom note details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNote();
  }, [id, token]);

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: BG, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={PURPLE} size="large" />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[s.root, { backgroundColor: BG, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: FG }}>Study notes not found</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View
        style={[
          s.header,
          { paddingTop: topPad + 8, borderBottomColor: "rgba(124,92,252,0.25)", borderLeftColor: PURPLE },
          isWeb ? {
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            backgroundColor: "rgba(8,11,26,0.82)",
            boxShadow: `0 1px 0 rgba(124,92,252,0.15)`,
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
            <Text style={s.subjectLabel} numberOfLines={1}>
              Custom Study Guide
            </Text>
            <Text style={s.chapterTitle} numberOfLines={2}>
              {note.title}
            </Text>
          </View>
        </View>
      </View>

      {/* ── HTML Viewer ─────────────────────────────────────────── */}
      <HtmlViewer html={note.contentHtml} background={BG} />
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
    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2, color: "#C4B5FD",
  },
  chapterTitle: {
    color: FG, fontSize: 17, fontFamily: "Inter_700Bold", lineHeight: 23,
  },
});
