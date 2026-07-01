import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const FEATURES = [
  "All subjects for your college stream",
  "Rich interactive notes with search",
  "Chapter summaries after every topic",
  "Flip-card flashcards for quick revision",
  "Chapter-end quizzes with explanations",
  "New content added every semester",
];

export default function SubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSubscribed, subscribe } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    await subscribe();
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#F72585", "#7C3AED", "#4361EE"]}
          style={[s.hero, { paddingTop: topPad + 20 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backBtn}
          >
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={s.heroContent}>
            <View style={s.starRow}>
              {[...Array(5)].map((_, i) => (
                <Feather key={i} name="star" size={16} color="#FFD700" />
              ))}
            </View>
            <Text style={s.heroTitle}>StudyMate Pro</Text>
            <Text style={s.heroSub}>
              Study smarter — not harder
            </Text>
            <View style={s.priceRow}>
              <Text style={s.priceCurrency}>₹</Text>
              <Text style={s.priceAmount}>99</Text>
              <Text style={s.pricePer}>/month</Text>
            </View>
            <Text style={s.priceNote}>Cancel anytime · No hidden fees</Text>
          </View>
        </LinearGradient>

        <View style={s.body}>
          {isSubscribed ? (
            <View
              style={[
                s.alreadyCard,
                { backgroundColor: colors.success + "15", borderColor: colors.success },
              ]}
            >
              <Feather name="check-circle" size={24} color={colors.success} />
              <View>
                <Text style={[s.alreadyTitle, { color: colors.foreground }]}>
                  You're a Pro Member!
                </Text>
                <Text style={[s.alreadySub, { color: colors.mutedForeground }]}>
                  All content is unlocked for you.
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>
                What you get
              </Text>
              <View
                style={[s.featCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {FEATURES.map((feat, i) => (
                  <View key={i} style={[s.featRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View style={[s.checkCircle, { backgroundColor: "#F72585" + "18" }]}>
                      <Feather name="check" size={12} color="#F72585" />
                    </View>
                    <Text style={[s.featText, { color: colors.foreground }]}>{feat}</Text>
                  </View>
                ))}
              </View>

              <View
                style={[
                  s.compareCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[s.compareTitle, { color: colors.foreground }]}>
                  Why StudyMate?
                </Text>
                <View style={s.compareRow}>
                  <View style={s.compareCol}>
                    <Text style={[s.compareHeader, { color: colors.mutedForeground }]}>
                      Plain PDFs
                    </Text>
                    {[
                      "Can't search words",
                      "No summaries",
                      "No flashcards",
                      "No quizzes",
                      "Boring to read",
                    ].map((item) => (
                      <View key={item} style={s.compareItem}>
                        <Feather name="x" size={13} color={colors.destructive} />
                        <Text style={[s.compareText, { color: colors.mutedForeground }]}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={[s.compareDivider, { backgroundColor: colors.border }]} />
                  <View style={s.compareCol}>
                    <Text style={[s.compareHeader, { color: "#F72585" }]}>
                      StudyMate Pro
                    </Text>
                    {[
                      "Instant search",
                      "Auto summaries",
                      "Flip flashcards",
                      "Chapter quizzes",
                      "Beautiful notes",
                    ].map((item) => (
                      <View key={item} style={s.compareItem}>
                        <Feather name="check" size={13} color={colors.success} />
                        <Text style={[s.compareText, { color: colors.foreground }]}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View
                style={[
                  s.vsCard,
                  { backgroundColor: "#4361EE" + "10", borderColor: "#4361EE" + "30" },
                ]}
              >
                <Feather name="info" size={14} color="#4361EE" />
                <Text style={[s.vsText, { color: colors.foreground }]}>
                  StudyMate Pro at{" "}
                  <Text style={{ fontFamily: "Inter_700Bold", color: "#4361EE" }}>₹99/mo</Text>{" "}
                  vs AI subscriptions at{" "}
                  <Text style={{ fontFamily: "Inter_700Bold" }}>₹1,700+/mo</Text>
                  {" "}— tailored study content for a fraction of the cost.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {!isSubscribed && (
        <View
          style={[
            s.footer,
            {
              paddingBottom: botPad + 16,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={loading}
            activeOpacity={0.85}
            style={{ borderRadius: 16, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#F72585", "#7C3AED"]}
              style={s.subscribeBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="unlock" size={18} color="#fff" />
                  <Text style={s.subscribeBtnText}>Subscribe for ₹99/month</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  heroContent: { alignItems: "center" },
  starRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 14,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  heroSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 2,
    marginBottom: 8,
  },
  priceCurrency: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  priceAmount: {
    color: "#fff",
    fontSize: 60,
    fontFamily: "Inter_700Bold",
    lineHeight: 68,
  },
  pricePer: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    marginTop: 40,
  },
  priceNote: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  body: {
    padding: 16,
    gap: 14,
  },
  alreadyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
  },
  alreadyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  alreadySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  featCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  featRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  featText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  compareCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  compareTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  compareRow: {
    flexDirection: "row",
    gap: 12,
  },
  compareCol: { flex: 1, gap: 10 },
  compareHeader: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  compareItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compareText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  compareDivider: { width: 1 },
  vsCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  vsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  subscribeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
  },
  subscribeBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
});
