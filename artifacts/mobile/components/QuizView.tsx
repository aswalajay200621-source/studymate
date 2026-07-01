import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Props {
  questions: QuizQuestion[];
}

export default function QuizView({ questions }: Props) {
  const colors = useColors();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const score = Object.entries(answers).filter(
    ([qi, ai]) => questions[Number(qi)].correctIndex === ai
  ).length;

  function select(qi: number, ai: number) {
    if (showResults) return;
    Haptics.selectionAsync();
    setAnswers((prev) => ({ ...prev, [qi]: ai }));
  }

  function submit() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowResults(true);
  }

  function reset() {
    setAnswers({});
    setShowResults(false);
  }

  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <ScrollView
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      {showResults && (
        <View
          style={[
            s.scoreCard,
            {
              backgroundColor:
                score === questions.length
                  ? colors.success + "15"
                  : score >= questions.length / 2
                  ? colors.warning + "15"
                  : colors.destructive + "15",
              borderColor:
                score === questions.length
                  ? colors.success
                  : score >= questions.length / 2
                  ? colors.warning
                  : colors.destructive,
            },
          ]}
        >
          <Text style={[s.scoreEmoji]}>
            {score === questions.length
              ? "🎉"
              : score >= questions.length / 2
              ? "👍"
              : "📚"}
          </Text>
          <Text style={[s.scoreText, { color: colors.foreground }]}>
            {score} / {questions.length} correct
          </Text>
          <Text style={[s.scoreSubtext, { color: colors.mutedForeground }]}>
            {score === questions.length
              ? "Perfect score!"
              : score >= questions.length / 2
              ? "Good effort — review the explanations below"
              : "Keep studying — the explanations will help"}
          </Text>
        </View>
      )}

      {questions.map((q, qi) => {
        const selected = answers[qi];
        const answered = selected !== undefined;
        const correct = q.correctIndex;

        return (
          <View
            key={qi}
            style={[s.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={s.qHeader}>
              <View style={[s.qNum, { backgroundColor: colors.secondary }]}>
                <Text style={[s.qNumText, { color: colors.primary }]}>Q{qi + 1}</Text>
              </View>
              <Text style={[s.qText, { color: colors.foreground }]}>
                {q.question}
              </Text>
            </View>

            <View style={s.options}>
              {q.options.map((opt, ai) => {
                let bg = colors.background;
                let border = colors.border;
                let textColor = colors.foreground;
                let icon: keyof typeof Feather.glyphMap | null = null;

                if (showResults) {
                  if (ai === correct) {
                    bg = colors.success + "18";
                    border = colors.success;
                    textColor = colors.success;
                    icon = "check-circle";
                  } else if (answered && ai === selected && ai !== correct) {
                    bg = colors.destructive + "12";
                    border = colors.destructive;
                    textColor = colors.destructive;
                    icon = "x-circle";
                  }
                } else if (answered && ai === selected) {
                  bg = colors.primary + "15";
                  border = colors.primary;
                  textColor = colors.primary;
                }

                return (
                  <TouchableOpacity
                    key={ai}
                    onPress={() => select(qi, ai)}
                    style={[
                      s.option,
                      { backgroundColor: bg, borderColor: border },
                    ]}
                    activeOpacity={showResults ? 1 : 0.7}
                  >
                    <View style={[s.optLetter, { borderColor: border }]}>
                      <Text style={[s.optLetterText, { color: textColor }]}>
                        {["A", "B", "C", "D"][ai]}
                      </Text>
                    </View>
                    <Text style={[s.optText, { color: textColor, flex: 1 }]}>
                      {opt}
                    </Text>
                    {icon && (
                      <Feather
                        name={icon}
                        size={16}
                        color={ai === correct ? colors.success : colors.destructive}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {showResults && (
              <View
                style={[
                  s.explanation,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Feather
                  name="info"
                  size={14}
                  color={colors.mutedForeground}
                />
                <Text style={[s.explText, { color: colors.mutedForeground }]}>
                  {q.explanation}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {!showResults ? (
        <TouchableOpacity
          onPress={submit}
          disabled={!allAnswered}
          style={[
            s.submitBtn,
            {
              backgroundColor: allAnswered ? colors.primary : colors.muted,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              s.submitText,
              { color: allAnswered ? "#fff" : colors.mutedForeground },
            ]}
          >
            {allAnswered ? "Submit Quiz" : `Answer all ${questions.length} questions`}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={reset}
          style={[s.submitBtn, { backgroundColor: colors.secondary }]}
          activeOpacity={0.8}
        >
          <Feather name="refresh-cw" size={16} color={colors.primary} />
          <Text style={[s.submitText, { color: colors.primary }]}>
            Retry Quiz
          </Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  scoreCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  scoreEmoji: { fontSize: 36 },
  scoreText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  scoreSubtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  qHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  qNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  qNumText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  qText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
    flex: 1,
  },
  options: { gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  optLetter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optLetterText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  optText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  explanation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  explText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
  submitBtn: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
