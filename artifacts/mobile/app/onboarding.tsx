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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/content";
import type { College } from "@/data/content";
import { PurpleAura } from "@/components/PurpleAura";

// ─── design tokens ────────────────────────────────────────────────────────────
const BG        = "#09090B";
const GLASS     = "rgba(255,255,255,0.07)";
const GLASS_HOV = "rgba(255,255,255,0.11)";
const BORDER    = "rgba(255,255,255,0.08)";
const PURPLE    = "#8B5CF6";
const PURPLE_TXT= "#A78BFA";
const PURPLE_LIT= "#C4B5FD";
const MUTED     = "#6B7280";
const FG        = "#E2E8F0";
const isWeb     = Platform.OS === "web";
// ──────────────────────────────────────────────────────────────────────────────

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

  // ── Desktop ───────────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <View style={[d.root, { backgroundColor: BG }]}>
        <PurpleAura />

        {/* centred glass panel */}
        <View style={d.center}>
          {/* heading */}
          <View style={d.heading}>
            <View style={d.logoBox}>
              <Feather name="book-open" size={22} color={PURPLE_TXT} />
            </View>
            <Text style={d.title}>Choose your stream</Text>
            <Text style={d.sub}>Your study materials are tailored to your college</Text>
          </View>

          {/* college cards grid */}
          <View style={d.grid}>
            {(["CSE", "EEE"] as College[]).map((id) => {
              const col       = COLLEGES[id];
              const isSelected = selected === id;
              const isHovered  = hoveredId === id;
              const lit        = isSelected || isHovered;

              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => { Haptics.selectionAsync(); setSelected(id); }}
                  activeOpacity={0.85}
                  {...(webHover((v) => setHoveredId(v ? id : null)) as any)}
                  style={[
                    d.card,
                    isWeb ? {
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      backgroundColor: isSelected
                        ? "rgba(139,92,246,0.12)"
                        : isHovered ? GLASS_HOV : GLASS,
                      borderColor: isSelected
                        ? "rgba(139,92,246,0.45)"
                        : isHovered ? "rgba(139,92,246,0.22)" : BORDER,
                      boxShadow: isSelected
                        ? "0 0 32px rgba(139,92,246,0.30), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)"
                        : isHovered
                          ? "0 0 18px rgba(139,92,246,0.18), 0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)"
                          : "0 2px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                      transition: "all 0.25s ease",
                    } as any : {
                      backgroundColor: isSelected ? "rgba(139,92,246,0.10)" : GLASS,
                      borderColor: isSelected ? PURPLE : BORDER,
                    },
                  ]}
                >
                  {/* college icon */}
                  <LinearGradient
                    colors={col.gradient as any}
                    style={d.cardIcon}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={col.icon as any} size={28} color="#fff" />
                  </LinearGradient>

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[d.cardTitle, lit && { color: PURPLE_LIT }]}>{col.name}</Text>
                    <Text style={[d.cardDept, { color: col.color }]}>{col.fullName}</Text>
                    <Text style={d.cardDesc}>{col.description}</Text>
                  </View>

                  {/* radio */}
                  <View style={[
                    d.radio,
                    {
                      borderColor: isSelected ? PURPLE : BORDER,
                      backgroundColor: isSelected ? PURPLE : "transparent",
                    },
                    isWeb && isSelected && { boxShadow: "0 0 10px rgba(139,92,246,0.45)" } as any,
                  ]}>
                    {isSelected && <Feather name="check" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={proceed}
            disabled={!selected || loading}
            activeOpacity={0.85}
            style={[
              d.cta,
              !selected && d.ctaDisabled,
              isWeb && selected && {
                boxShadow: "0 0 22px rgba(139,92,246,0.40), 0 4px 14px rgba(0,0,0,0.35)",
              } as any,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={d.ctaText}>
                  {selected ? `Continue with ${COLLEGES[selected].name}` : "Choose your college above"}
                </Text>
                {selected && <Feather name="arrow-right" size={18} color="#fff" />}
              </>
            )}
          </TouchableOpacity>

          <Text style={d.terms}>You can switch your college later from profile</Text>
        </View>
      </View>
    );
  }

  // ── Mobile ────────────────────────────────────────────────────────────────
  return (
    <View style={[m.root, { backgroundColor: BG }]}>
      <View style={[m.top, { paddingTop: topPad + 16 }]}>
        <View style={[m.logoCircle, { backgroundColor: "rgba(139,92,246,0.15)" }]}>
          <Feather name="book-open" size={28} color={PURPLE_TXT} />
        </View>
        <Text style={m.title}>StudyMate</Text>
        <Text style={m.sub}>Smart notes for engineering students</Text>
      </View>

      <View style={m.mid}>
        <Text style={m.prompt}>Select your college</Text>
        <Text style={m.promptSub}>Your study materials are tailored to your stream</Text>

        {(["CSE", "EEE"] as College[]).map((id) => {
          const col = COLLEGES[id];
          const isSel = selected === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => { Haptics.selectionAsync(); setSelected(id); }}
              activeOpacity={0.85}
              style={[
                m.card,
                {
                  borderColor: isSel ? PURPLE : BORDER,
                  backgroundColor: isSel ? "rgba(139,92,246,0.10)" : GLASS,
                },
              ]}
            >
              <LinearGradient colors={col.gradient as any} style={m.cardIcon}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={col.icon as any} size={26} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[m.cardTitle, { color: isSel ? PURPLE_LIT : FG }]}>{col.name}</Text>
                <Text style={[m.cardDept, { color: col.color }]}>{col.fullName}</Text>
                <Text style={[m.cardDesc, { color: MUTED }]}>{col.description}</Text>
              </View>
              <View style={[m.radio, {
                borderColor: isSel ? PURPLE : BORDER,
                backgroundColor: isSel ? PURPLE : "transparent",
              }]}>
                {isSel && <Feather name="check" size={12} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={[m.pillRow, { marginTop: 12 }]}>
          {["Search Notes", "PYQs"].map((f) => (
            <View key={f} style={m.pill}>
              <Text style={m.pillText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[m.bottom, { paddingBottom: botPad + 16 }]}>
        <TouchableOpacity
          onPress={proceed} disabled={!selected || loading} activeOpacity={0.85}
          style={[m.cta, !selected && m.ctaDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={m.ctaText}>
                {selected ? `Continue with ${COLLEGES[selected].name}` : "Choose your college above"}
              </Text>
              {selected && <Feather name="arrow-right" size={18} color="#fff" />}
            </>
          )}
        </TouchableOpacity>
        <Text style={[m.terms, { color: MUTED }]}>
          You can switch your college later from profile
        </Text>
      </View>
    </View>
  );
}

// ─── Desktop styles ───────────────────────────────────────────────────────────
const d = StyleSheet.create({
  root:    { flex: 1, alignItems: "center", justifyContent: "center" },
  center:  { width: 640, maxWidth: "90%" as any, gap: 24 },
  heading: { alignItems: "center", gap: 10 },
  logoBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.14)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  title: { color: FG, fontSize: 30, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub:   { color: MUTED, fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },

  grid:     { gap: 14 },
  card: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, borderWidth: 1, padding: 20, gap: 16,
  },
  cardIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardTitle: { color: FG, fontSize: 17, fontFamily: "Inter_700Bold" },
  cardDept:  { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  cardDesc:  { color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 2 },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    height: 54, borderRadius: 16, gap: 8,
    backgroundColor: PURPLE,
  },
  ctaDisabled: { backgroundColor: "rgba(139,92,246,0.25)" },
  ctaText:     { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  terms:       { color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
});

// ─── Mobile styles ────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  root: { flex: 1 },
  top: { alignItems: "center", paddingBottom: 8, gap: 8 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  title: { color: FG, fontSize: 30, fontFamily: "Inter_700Bold" },
  sub:   { color: MUTED, fontSize: 15, fontFamily: "Inter_400Regular" },
  mid:   { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  prompt:    { color: FG, fontSize: 20, fontFamily: "Inter_700Bold" },
  promptSub: { color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular", marginTop: -4, marginBottom: 4 },
  card: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, borderWidth: 1.5, padding: 16, gap: 14,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  cardDept:  { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  cardDesc:  { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.20)",
  },
  pillText: { color: PURPLE_TXT, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  bottom: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 17, paddingHorizontal: 24, borderRadius: 16, gap: 8,
    backgroundColor: PURPLE,
  },
  ctaDisabled: { backgroundColor: "rgba(139,92,246,0.28)" },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  terms:   { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 4 },
});
