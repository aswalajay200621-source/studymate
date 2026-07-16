import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/content";
import type { College } from "@/data/content";
import { ParticleMesh } from "@/components/ParticleMesh";

const isWeb = Platform.OS === "web";

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

export default function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectCollege } = useApp();
  const [selected, setSelected]   = useState<College | null>(null);
  const [loading, setLoading]     = useState(false);
  const [hoveredId, setHoveredId] = useState<College | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width >= 900;

  const topPad = isWeb ? 0 : insets.top;
  const botPad = isWeb ? 0 : insets.bottom;

  async function proceed() {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await selectCollege(selected);
    router.replace("/(tabs)");
  }

  // ── Shared Content rendering ───────────────────────────────────────────────
  const contentBody = (
    <>
      <View style={sd.heading}>
        <View style={[sd.logoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="book-open" size={20} color={colors.accent} />
        </View>
        <Text style={[
          sd.title,
          {
            color: colors.text,
            fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            fontWeight: "700" as any,
          }
        ]}>
          Choose your stream
        </Text>
        <Text style={[
          sd.sub,
          {
            color: colors.mutedForeground,
            fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
          }
        ]}>
          Your study materials are tailored to your college shelf
        </Text>
      </View>

      <View style={isDesktop ? sd.grid : sm.cardList}>
        {(["CSE", "EEE"] as College[]).map((id) => {
          const col       = COLLEGES[id];
          const isSelected = selected === id;
          const borderStripColor = id === "CSE" ? "#9B3131" : "#B8935A";

          return (
            <TouchableOpacity
              key={id}
              onPress={() => { Haptics.selectionAsync(); setSelected(id); }}
              activeOpacity={0.85}
              {...(webHover((v) => setHoveredId(v ? id : null)) as any)}
              style={[
                isDesktop ? sd.card : sm.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? colors.accent : colors.border,
                  borderLeftColor: borderStripColor,
                },
                isWeb ? {
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: isSelected
                    ? "0 4px 16px rgba(184,147,90,0.12), inset 0 1px 0 rgba(255,255,255,0.02)"
                    : "0 1px 4px rgba(0,0,0,0.02)",
                  transition: "all 0.22s ease",
                } as any : {},
              ]}
            >
              <View style={[sd.cardIcon, { backgroundColor: col.color + "12", borderColor: col.color + "25", borderWidth: 1 }]}>
                <Ionicons name={col.icon as any} size={24} color={col.color} />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[
                  sd.cardTitle,
                  {
                    color: colors.text,
                    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
                    fontWeight: "700" as any,
                  }
                ]}>
                  {col.name}
                </Text>
                <Text style={[
                  sd.cardDept,
                  {
                    color: colors.accent,
                    fontFamily: isWeb ? "'JetBrains Mono', monospace" : "System",
                  }
                ]}>
                  {col.fullName}
                </Text>
                <Text style={[
                  sd.cardDesc,
                  {
                    color: colors.mutedForeground,
                    fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
                  }
                ]}>
                  {col.description}
                </Text>
              </View>

              <View style={[
                sd.radio,
                {
                  borderColor: isSelected ? colors.accent : colors.border,
                  backgroundColor: isSelected ? colors.accent : "transparent",
                },
              ]}>
                {isSelected && <Feather name="check" size={12} color={colors.primaryForeground} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={proceed}
        disabled={!selected || loading}
        activeOpacity={0.85}
        style={[sd.btn, !selected && { opacity: 0.5 }, { marginTop: 24 }]}
      >
        <LinearGradient colors={[colors.primary, colors.tint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={sd.btnInner}>
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
              <Text style={[sd.btnText, { color: colors.primaryForeground, fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System" }]}>
                Enter Library Shelf
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  // ── Desktop layout ──────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <View style={[sd.root, { backgroundColor: colors.background }]}>
        <ParticleMesh />
        <View style={[sd.center, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} isWeb={isWeb}>
          {contentBody}
        </View>
      </View>
    );
  }

  // ── Mobile layout ───────────────────────────────────────────────────────────
  return (
    <View style={[sm.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[sm.scrollContent, { paddingTop: topPad + 40, paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {contentBody}
      </ScrollView>
    </View>
  );
}

const sd = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { width: 540, borderRadius: 10, padding: 36, gap: 10, zIndex: 10 },
  heading: { alignItems: "center", marginBottom: 24, gap: 6 },
  logoBox: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 26, textAlign: "center" },
  sub: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  grid: { gap: 12, width: "100%" },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, borderLeftWidth: 4, padding: 18, gap: 16 },
  cardIcon: { width: 48, height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardTitle: { fontSize: 16 },
  cardDept: { fontSize: 11, fontWeight: "600" },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btn: { borderRadius: 10, overflow: "hidden", width: "100%" },
  btnInner: { height: 50, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 15, fontWeight: "700" },
});

const sm = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, alignItems: "stretch" },
  cardList: { gap: 12, width: "100%" },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, borderLeftWidth: 4, padding: 16, gap: 14 },
});
