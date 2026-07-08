import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "@/context/AuthContext";
import { getApiBase } from "@/utils/api";
import { ParticleMesh } from "@/components/ParticleMesh";

const isWeb = Platform.OS === "web";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG        = "#080B1A";
const CARD      = "rgba(15,18,40,0.85)";
const CARD_HOV  = "rgba(20,24,52,0.95)";
const BORDER    = "rgba(124,92,252,0.18)";
const BORDER_H  = "rgba(124,92,252,0.45)";
const PURPLE    = "#7C5CFC";
const PURPLE_TXT = "#A78BFA";
const PURPLE_LIT = "#C4B5FD";
const MUTED     = "#6B7280";
const FG        = "#E2E8F0";
// ─────────────────────────────────────────────────────────────────────────────

interface CustomNoteSummary {
  id: string;
  title: string;
  fileName: string;
  prompt: string | null;
  createdAt: string;
}

export default function MakeOwnScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = isWeb ? 67 : insets.top;

  const [pdfFile, setPdfFile] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<CustomNoteSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Fetch user's custom notes history ──────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/user-notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load custom notes:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Pick PDF File ─────────────────────────────────────────────────────────
  async function handlePickFile() {
    try {
      if (isWeb) {
        // Direct HTML file picker for highly robust web support
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,application/pdf";
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) return;
          setPdfFile({
            name: file.name,
            size: file.size,
            type: file.type || "application/pdf",
            rawFile: file,
          });
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setPdfFile({
            name: asset.name,
            size: asset.size ?? 0,
            type: asset.mimeType ?? "application/pdf",
            uri: asset.uri,
          });
        }
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select document");
    }
  }

  // ── Submit / Convert notes ────────────────────────────────────────────────
  async function handleConvert() {
    if (!pdfFile) {
      Alert.alert("Select PDF", "Please upload a PDF textbook or lecture note first.");
      return;
    }
    if (!token) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("prompt", prompt.trim());

      if (isWeb && pdfFile.rawFile) {
        formData.append("pdf", pdfFile.rawFile, pdfFile.name);
      } else {
        // Native upload using file uri
        formData.append("pdf", {
          uri: pdfFile.uri,
          name: pdfFile.name,
          type: pdfFile.type,
        } as any);
      }

      const res = await fetch(`${getApiBase()}/user-notes/convert`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to convert PDF");
      }

      Alert.alert("Success 🎉", `Created HTML study notes: "${body.title}"!`);
      setPdfFile(null);
      setPrompt("");
      loadHistory();
      
      // Navigate to the newly generated note
      router.push(`/custom-note/${body.id}`);
    } catch (err: any) {
      Alert.alert("Conversion Failed", err.message ?? "Failed to convert PDF");
    } finally {
      setLoading(false);
    }
  }

  // ── Delete Notes ──────────────────────────────────────────────────────────
  async function handleDelete(id: string, title: string) {
    Alert.alert("Delete custom notes", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${getApiBase()}/user-notes/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              setHistory((prev) => prev.filter((item) => item.id !== id));
            } else {
              throw new Error("Delete failed");
            }
          } catch (err: any) {
            Alert.alert("Error", err.message ?? "Failed to delete notes");
          }
        },
      },
    ]);
  }

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <ParticleMesh />

      <ScrollView
        contentContainerStyle={[s.body, { paddingTop: topPad + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Make Your Own</Text>
        <Text style={s.subtitle}>Convert textbook PDFs into structured HTML notes using Gemini 2.5 Flash</Text>

        {/* ── File Picker & Custom Prompt Card ───────────────────────────────── */}
        <View style={s.glassCard}>
          <Text style={s.cardLabel}>UPLOAD PDF LECTURE NOTE / BOOK *</Text>
          <TouchableOpacity onPress={handlePickFile} style={s.uploadZone} activeOpacity={0.8}>
            <View style={s.iconWrap}>
              <Feather name="file-text" size={28} color={pdfFile ? PURPLE_TXT : MUTED} />
            </View>
            <Text style={s.uploadTitle}>
              {pdfFile ? pdfFile.name : "Choose PDF file…"}
            </Text>
            <Text style={s.uploadDesc}>
              {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : "Select PDF files up to 10MB"}
            </Text>
          </TouchableOpacity>

          <Text style={[s.cardLabel, { marginTop: 16 }]}>WHAT TOPICS OR FEATURES DO YOU WANT TO FOCUS ON? (OPTIONAL)</Text>
          <TextInput
            style={s.promptInput}
            multiline
            numberOfLines={4}
            placeholder="e.g. Focus on mathematical derivations / simplify with analogy / summarize core formulas at the top..."
            placeholderTextColor="#4B5563"
            value={prompt}
            onChangeText={setPrompt}
          />

          <TouchableOpacity
            onPress={handleConvert}
            disabled={loading}
            style={[s.generateBtn, loading && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="zap" size={15} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.generateBtnText}>Convert to Study Notes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Generated Notes History ──────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Your Generated Study Notes</Text>

        {historyLoading ? (
          <ActivityIndicator color={PURPLE} size="large" style={{ marginTop: 24 }} />
        ) : history.length === 0 ? (
          <View style={s.emptyState}>
            <Feather name="file-plus" size={32} color={MUTED} />
            <Text style={s.emptyText}>You haven't converted any PDFs yet.</Text>
          </View>
        ) : (
          history.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(`/custom-note/${item.id}`)}
              style={s.historyCard}
              activeOpacity={0.85}
            >
              <View style={s.historyIcon}>
                <Ionicons name="sparkles" size={18} color={PURPLE_TXT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.historyTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.historyFile} numberOfLines={1}>File: {item.fileName}</Text>
                {item.prompt && (
                  <Text style={s.historyPrompt} numberOfLines={1}>Focus: "{item.prompt}"</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.title)}
                style={s.deleteBtn}
              >
                <Feather name="trash-2" size={15} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 120 },
  title: {
    color: FG, fontSize: 32, fontFamily: "Inter_800ExtraBold", letterSpacing: -0.8,
  },
  subtitle: {
    color: PURPLE_TXT, fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 20,
  },
  glassCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
  },
  cardLabel: {
    color: MUTED, fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginBottom: 8,
  },
  uploadZone: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  uploadTitle: {
    color: FG, fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center", paddingHorizontal: 16,
  },
  uploadDesc: {
    color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2,
  },
  promptInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: FG,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
    marginBottom: 16,
    minHeight: 80,
  },
  generateBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  generateBtnText: {
    color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold",
  },
  sectionTitle: {
    color: FG, fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.4, marginBottom: 12,
  },
  emptyState: {
    alignItems: "center", justifyContent: "center", paddingVertical: 32, gap: 8,
  },
  emptyText: {
    color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular",
  },
  historyCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  historyIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(124,92,252,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  historyTitle: {
    color: FG, fontSize: 14, fontFamily: "Inter_600SemiBold",
  },
  historyFile: {
    color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1,
  },
  historyPrompt: {
    color: PURPLE_TXT, fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic", marginTop: 1,
  },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
});
