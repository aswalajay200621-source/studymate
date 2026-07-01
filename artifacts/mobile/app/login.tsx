import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { Redirect, router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthLoading, emailLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthLoading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const topPad = Platform.OS === "web" ? 40 : insets.top + 24;

  async function handleLogin() {
    setError("");
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password) { setError("Please enter your password"); return; }

    setLoading(true);
    const result = await emailLogin(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["#4361EE", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.header, { paddingTop: topPad }]}
        >
          <View style={s.logoBox}>
            <Text style={s.logoEmoji}>📚</Text>
          </View>
          <Text style={s.appName}>StudyMate</Text>
          <Text style={s.tagline}>Smart notes for engineering students</Text>
        </LinearGradient>

        <View style={[s.body, { backgroundColor: colors.background }]}>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.welcomeTitle, { color: colors.foreground }]}>Welcome back!</Text>
            <Text style={[s.welcomeDesc, { color: colors.mutedForeground }]}>
              Sign in with your email and password
            </Text>

            <Text style={[s.label, { color: colors.mutedForeground }]}>Email Address</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus={Platform.OS !== "web"}
            />

            <Text style={[s.label, { color: colors.mutedForeground }]}>Password</Text>
            <View style={[s.pwRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[s.pwInput, { color: colors.foreground }]}
                placeholder="Your password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {!!error && (
              <View style={[s.errorBox, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
              style={[s.loginBtn, { marginTop: 8 }]}
            >
              <LinearGradient
                colors={["#4361EE", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.loginGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={s.loginBtnInner}>
                    <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={s.loginText}>Sign In</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/signup")} style={s.switchLink}>
              <Text style={[s.switchText, { color: colors.mutedForeground }]}>
                Don't have an account?{" "}
                <Text style={{ color: "#4361EE", fontFamily: "Inter_600SemiBold" }}>Create one</Text>
              </Text>
            </TouchableOpacity>

            <View style={[s.divider, { borderColor: colors.border }]} />

            <View style={s.features}>
              {[
                { icon: "book-open", text: "Study notes for CSE & EEE" },
                { icon: "zap", text: "Flashcards for quick revision" },
                { icon: "check-circle", text: "Quizzes to test your knowledge" },
              ].map((f) => (
                <View key={f.text} style={s.feature}>
                  <Feather name={f.icon as any} size={16} color="#4361EE" style={{ marginRight: 10 }} />
                  <Text style={[s.featureText, { color: colors.mutedForeground }]}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  tagline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  body: {
    flex: 1,
    padding: 20,
    marginTop: -24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  welcomeDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  pwRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  pwInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  loginBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  loginGradient: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  switchLink: {
    alignItems: "center",
    paddingVertical: 4,
  },
  switchText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 16,
  },
  features: { gap: 14 },
  feature: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
});
