import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

interface CustomNoteSummary {
  id: string;
  title: string;
  fileName: string;
  prompt: string | null;
  createdAt: string;
}

export default function MakeOwnScreen() {
  const { token } = useAuth();
  const colors = useColors();
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
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ParticleMesh />

      <ScrollView
        contentContainerStyle={[s.body, { paddingTop: topPad + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[
          s.title,
          {
            color: colors.text,
            fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            fontWeight: "700" as any,
          }
        ]}>
          Make Your Own
        </Text>
        <Text style={[
          s.subtitle,
          {
            color: colors.accent,
            fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
          }
        ]}>
          Convert textbook PDFs into structured HTML notes using Gemini 2.5 Flash
        </Text>

        {/* ── File Picker & Custom Prompt Card ───────────────────────────────── */}
        <View style={[s.glassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardLabel, { color: colors.mutedForeground }]}>UPLOAD PDF LECTURE NOTE / BOOK *</Text>
          <TouchableOpacity
            onPress={handlePickFile}
            style={[s.uploadZone, { borderColor: colors.border, backgroundColor: colors.input }]}
            activeOpacity={0.8}
          >
            <View style={s.iconWrap}>
              <Feather name="file-text" size={28} color={pdfFile ? colors.text : colors.mutedForeground} />
            </View>
            <Text style={[
              s.uploadTitle,
              {
                color: colors.text,
                fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
              }
            ]}>
              {pdfFile ? pdfFile.name : "Choose PDF file…"}
            </Text>
            <Text style={[s.uploadDesc, { color: colors.mutedForeground }]}>
              {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : "Select PDF files up to 10MB"}
            </Text>
          </TouchableOpacity>

          <Text style={[s.cardLabel, { color: colors.mutedForeground, marginTop: 16 }]}>WHAT TOPICS OR FEATURES DO YOU WANT TO FOCUS ON? (OPTIONAL)</Text>
          <TextInput
            style={[
              s.promptInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.input,
                fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
              }
            ]}
            multiline
            numberOfLines={4}
            placeholder="e.g. Focus on mathematical derivations / simplify with analogy / summarize core formulas at the top..."
            placeholderTextColor={colors.mutedForeground}
            value={prompt}
            onChangeText={setPrompt}
          />

          <TouchableOpacity
            onPress={handleConvert}
            disabled={loading}
            style={[s.generateBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <View style={s.btnContent}>
                <Feather name="zap" size={15} color={colors.primaryForeground} style={{ marginRight: 6 }} />
                <Text style={[s.generateBtnText, { color: colors.primaryForeground }]}>Convert to Study Notes</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Generated Notes History ──────────────────────────────────────── */}
        <Text style={[
          s.sectionTitle,
          {
            color: colors.text,
            fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            fontWeight: "700" as any,
          }
        ]}>
          Your Generated Study Notes
        </Text>

        {historyLoading ? (
          <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 24 }} />
        ) : history.length === 0 ? (
          <View style={s.emptyState}>
            <Feather name="file-plus" size={32} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>You haven't converted any PDFs yet.</Text>
          </View>
        ) : (
          history.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(`/custom-note/${item.id}`)}
              style={[s.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.85}
            >
              <View style={[s.historyIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="sparkles" size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[
                  s.historyTitle,
                  {
                    color: colors.text,
                    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
                    fontWeight: "700" as any,
                  }
                ]} numberOfLines={1}>{item.title}</Text>
                <Text style={[
                  s.historyFile,
                  {
                    color: colors.mutedForeground,
                    fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
                  }
                ]} numberOfLines={1}>File: {item.fileName}</Text>
                {item.prompt && (
                  <Text style={[s.historyPrompt, { color: colors.accent }]} numberOfLines={1}>Focus: "{item.prompt}"</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.title)}
                style={s.deleteBtn}
              >
                <Feather name="trash-2" size={15} color={colors.destructive} />
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
  body: { paddingHorizontal: 20, paddingBottom: 120, maxWidth: 860, width: "100%" as any, alignSelf: "center" as any },
  title: { fontSize: 32, letterSpacing: -0.8 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 20 },
  glassCard: { borderRadius: 10, borderWidth: 1, padding: 16, marginBottom: 28 },
  cardLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.8, marginBottom: 8 },
  uploadZone: { borderWidth: 1, borderStyle: "dashed", borderRadius: 10, paddingVertical: 24, alignItems: "center" },
  iconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(0,0,0,0.03)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  uploadTitle: { fontSize: 14, fontWeight: "600", textAlign: "center", paddingHorizontal: 16 },
  uploadDesc: { fontSize: 12, marginTop: 2 },
  promptInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: "top", marginBottom: 16, minHeight: 80 },
  generateBtn: { borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  btnContent: { flexDirection: "row", alignItems: "center" },
  generateBtnText: { fontSize: 14, fontWeight: "700" },
  sectionTitle: { fontSize: 20, letterSpacing: -0.4, marginBottom: 12, marginTop: 8 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14 },
  historyCard: { borderRadius: 10, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 12 },
  historyIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  historyTitle: { fontSize: 14, marginBottom: 2 },
  historyFile: { fontSize: 11 },
  historyPrompt: { fontSize: 11, fontStyle: "italic", marginTop: 2 },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
