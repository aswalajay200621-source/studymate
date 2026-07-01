import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
interface Flashcard {
  question: string;
  answer: string;
}

interface Props {
  card: Flashcard;
  index: number;
  total: number;
}

export default function FlashCard({ card, index, total }: Props) {
  const colors = useColors();
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const frontInterp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backInterp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  function flip() {
    Haptics.selectionAsync();
    Animated.spring(anim, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
    setFlipped(!flipped);
  }

  return (
    <View style={s.wrapper}>
      <Text style={[s.counter, { color: colors.mutedForeground }]}>
        {index + 1} / {total}
      </Text>
      <TouchableWithoutFeedback onPress={flip}>
        <View style={s.cardOuter}>
          <Animated.View
            style={[
              s.card,
              s.front,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                transform: [{ rotateY: frontInterp }],
              },
            ]}
          >
            <Text style={[s.badge, { color: colors.primary }]}>QUESTION</Text>
            <Text style={[s.cardText, { color: colors.foreground }]}>
              {card.question}
            </Text>
            <Text style={[s.hint, { color: colors.mutedForeground }]}>
              Tap to reveal answer
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              s.card,
              s.back,
              {
                backgroundColor: colors.primary,
                transform: [{ rotateY: backInterp }],
              },
            ]}
          >
            <Text style={[s.badge, { color: "rgba(255,255,255,0.7)" }]}>
              ANSWER
            </Text>
            <Text style={[s.cardText, { color: "#fff" }]}>{card.answer}</Text>
            <Text style={[s.hint, { color: "rgba(255,255,255,0.6)" }]}>
              Tap to flip back
            </Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  counter: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 16,
  },
  cardOuter: {
    width: "100%",
    height: 240,
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    padding: 28,
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  front: {},
  back: { borderWidth: 0 },
  badge: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  cardText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 26,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 20,
  },
});
