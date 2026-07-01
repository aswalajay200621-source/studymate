import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/content";
import type { College } from "@/data/content";

export default function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectCollege } = useApp();
  const [selected, setSelected] = useState<College | null>(null);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 900;

  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const botPad = Platform.OS === "web" ? 0 : insets.bottom;

  async function proceed() {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await selectCollege(selected);
    router.replace("/(tabs)");
  }

  if (isDesktop) {
    return (
      <View style={[s.desktopRoot, { backgroundColor: colors.background }]}>
        <View style={s.desktopLeft}>
          <View style={[s.desktopBrand, { backgroundColor: colors.primary }]}>
            <Feather name="book-open" size={48} color="#fff" />
          </View>
          <Text style={[s.desktopTitle, { color: "#fff" }]}>StudyMate</Text>
          <Text style={[s.desktopTagline, { color: "rgba(255,255,255,0.8)" }]}>
            Smart notes for{"\n"}engineering students
          </Text>
          <View style={{ marginTop: 32, gap: 12 }}>
            {["Search Notes", "PYQs", "Subject-wise content"].map((f) => (
              <View key={f} style={s.desktopFeatureRow}>
                <Feather name="check-circle" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={[s.desktopFeatureText, { color: "rgba(255,255,255,0.9)" }]}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.desktopRight}>
          <View style={[s.desktopCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.prompt, { color: colors.foreground, marginBottom: 4 }]}>
              Select your college
            </Text>
            <Text style={[s.promptSub, { color: colors.mutedForeground, marginBottom: 20 }]}>
              Your study materials are tailored to your stream
            </Text>

            {(["CSE", "EEE"] as College[]).map((id) => {
              const col = COLLEGES[id];
              const isSelected = selected === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => { Haptics.selectionAsync(); setSelected(id); }}
                  activeOpacity={0.85}
                  style={[s.card, { borderColor: isSelected ? col.color : colors.border, backgroundColor: isSelected ? col.color + "0D" : colors.background, marginBottom: 12 }]}
                >
                  <LinearGradient colors={col.gradient} style={s.cardIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name={col.icon as any} size={26} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: colors.foreground }]}>{col.name}</Text>
                    <Text style={[s.cardDept, { color: col.color }]}>{col.fullName}</Text>
                    <Text style={[s.cardDesc, { color: colors.mutedForeground }]}>{col.description}</Text>
                  </View>
                  <View style={[s.radioOuter, { borderColor: isSelected ? col.color : colors.border, backgroundColor: isSelected ? col.color : "transparent" }]}>
                    {isSelected && <Feather name="check" size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity onPress={proceed} disabled={!selected || loading} activeOpacity={0.85} style={{ borderRadius: 16, overflow: "hidden", marginTop: 8 }}>
              <LinearGradient
                colors={selected ? COLLEGES[selected].gradient : [colors.muted, colors.muted]}
                style={s.btn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={s.btnText}>{selected ? `Continue with ${COLLEGES[selected].name}` : "Choose your college above"}</Text>
                    {selected && <Feather name="arrow-right" size={18} color="#fff" />}
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[s.terms, { color: colors.mutedForeground, marginTop: 12 }]}>
              You can switch your college later from profile
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.top, { paddingTop: topPad + 16 }]}>
        <View style={s.logoRow}>
          <View style={[s.logoCircle, { backgroundColor: colors.primary }]}>
            <Feather name="book-open" size={28} color="#fff" />
          </View>
        </View>
        <Text style={[s.title, { color: colors.foreground }]}>StudyMate</Text>
        <Text style={[s.sub, { color: colors.mutedForeground }]}>
          Smart notes for engineering students
        </Text>
      </View>

      <View style={s.mid}>
        <Text style={[s.prompt, { color: colors.foreground }]}>
          Select your college
        </Text>
        <Text style={[s.promptSub, { color: colors.mutedForeground }]}>
          Your study materials are tailored to your stream
        </Text>

        {(["CSE", "EEE"] as College[]).map((id) => {
          const col = COLLEGES[id];
          const isSelected = selected === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => {
                Haptics.selectionAsync();
                setSelected(id);
              }}
              activeOpacity={0.85}
              style={[
                s.card,
                {
                  borderColor: isSelected ? col.color : colors.border,
                  backgroundColor: isSelected ? col.color + "0D" : colors.card,
                },
              ]}
            >
              <LinearGradient
                colors={col.gradient}
                style={s.cardIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={col.icon as any} size={26} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: colors.foreground }]}>
                  {col.name}
                </Text>
                <Text style={[s.cardDept, { color: col.color }]}>
                  {col.fullName}
                </Text>
                <Text style={[s.cardDesc, { color: colors.mutedForeground }]}>
                  {col.description}
                </Text>
              </View>
              <View
                style={[
                  s.radioOuter,
                  {
                    borderColor: isSelected ? col.color : colors.border,
                    backgroundColor: isSelected ? col.color : "transparent",
                  },
                ]}
              >
                {isSelected && (
                  <Feather name="check" size={12} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={[s.featureRow, { marginTop: 12 }]}>
          {["Search Notes", "PYQs"].map((f) => (
            <View key={f} style={[s.featurePill, { backgroundColor: colors.secondary }]}>
              <Text style={[s.featureText, { color: colors.primary }]}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[s.bottom, { paddingBottom: botPad + 16 }]}>
        <TouchableOpacity
          onPress={proceed}
          disabled={!selected || loading}
          activeOpacity={0.85}
          style={{ borderRadius: 16, overflow: "hidden" }}
        >
          <LinearGradient
            colors={
              selected
                ? COLLEGES[selected].gradient
                : [colors.muted, colors.muted]
            }
            style={s.btn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.btnText}>
                  {selected
                    ? `Continue with ${COLLEGES[selected].name}`
                    : "Choose your college above"}
                </Text>
                {selected && <Feather name="arrow-right" size={18} color="#fff" />}
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[s.terms, { color: colors.mutedForeground }]}>
          You can switch your college later from profile
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    flexDirection: "row",
  },
  desktopLeft: {
    flex: 1,
    backgroundColor: "#4361EE",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 56,
    paddingVertical: 48,
  },
  desktopBrand: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  desktopTitle: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
  },
  desktopTagline: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    lineHeight: 28,
  },
  desktopFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  desktopFeatureText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  desktopRight: {
    width: 460,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  desktopCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
  },
  root: { flex: 1 },
  top: {
    alignItems: "center",
    paddingBottom: 8,
  },
  logoRow: { marginBottom: 12 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4361EE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  mid: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  prompt: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  promptSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
    marginBottom: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    gap: 14,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  cardDept: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featurePill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  featureText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    paddingHorizontal: 24,
    gap: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  terms: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 4,
  },
});
