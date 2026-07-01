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
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { Feather } from "@expo/vector-icons";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthLoading, emailLogin } = useAuth();
  const isDesktop = useIsDesktop();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthLoading && user) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleLogin() {
    setError("");
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setLoading(true);
    const result = await emailLogin(email.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  if (isDesktop) {
    return <DesktopLogin
      colors={colors}
      email={email} setEmail={setEmail}
      password={password} setPassword={setPassword}
      showPassword={showPassword} setShowPassword={setShowPassword}
      loading={loading} error={error}
      handleLogin={handleLogin}
    />;
  }

  const topPad = Platform.OS === "web" ? 40 : insets.top + 24;

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
          <LoginCard
            colors={colors}
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPassword={showPassword} setShowPassword={setShowPassword}
            loading={loading} error={error}
            handleLogin={handleLogin}
            isDesktop={false}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DesktopLogin(props: any) {
  const { colors } = props;
  return (
    <View style={[ds.root, { backgroundColor: "#080B1A" }]}>
      <View style={[ds.topNav, { borderBottomColor: "#1E2240" }]}>
        <View style={ds.navLeft}>
          <View style={ds.navLogoBox}>
            <Feather name="book-open" size={18} color="#A78BFA" />
          </View>
          <Text style={ds.navBrand}>StudyMate</Text>
        </View>
        <View style={ds.navRight}>
          <TouchableOpacity style={ds.navLink}>
            <Text style={ds.navLinkActiveText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/library")} style={ds.navLink}>
            <Text style={ds.navLinkText}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ds.navLink}>
            <Text style={ds.navLinkText}>Flashcards</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={ds.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[ds.card, { backgroundColor: "#0F1228", borderColor: "#1E2240" }]}>
          <View style={ds.cardIconBox}>
            <Feather name="users" size={22} color="#A78BFA" />
          </View>

          <Text style={ds.welcomeTitle}>Welcome back!</Text>
          <Text style={ds.welcomeDesc}>Sign in with your email and password</Text>

          <Text style={ds.label}>EMAIL ADDRESS</Text>
          <View style={[ds.inputRow, { backgroundColor: "#141830", borderColor: "#1E2240" }]}>
            <TextInput
              style={ds.input}
              placeholder="you@example.com"
              placeholderTextColor="#4B5563"
              value={props.email}
              onChangeText={props.setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Feather name="mail" size={16} color="#4B5563" />
          </View>

          <Text style={[ds.label, { marginTop: 16 }]}>PASSWORD</Text>
          <View style={[ds.inputRow, { backgroundColor: "#141830", borderColor: "#1E2240" }]}>
            <TextInput
              style={ds.input}
              placeholder="Your password"
              placeholderTextColor="#4B5563"
              value={props.password}
              onChangeText={props.setPassword}
              secureTextEntry={!props.showPassword}
              onSubmitEditing={props.handleLogin}
              returnKeyType="go"
            />
            <TouchableOpacity onPress={() => props.setShowPassword((v: boolean) => !v)}>
              <Feather name={props.showPassword ? "eye-off" : "eye"} size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={ds.forgotRow}>
            <Text style={ds.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {!!props.error && (
            <View style={ds.errorBox}>
              <Feather name="alert-circle" size={14} color="#F87171" />
              <Text style={ds.errorText}>{props.error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={props.handleLogin}
            activeOpacity={0.85}
            disabled={props.loading}
            style={ds.loginBtn}
          >
            <LinearGradient
              colors={["#6D28D9", "#7C5CFC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={ds.loginGradient}
            >
              {props.loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={ds.loginBtnInner}>
                  <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={ds.loginText}>Sign In</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/signup")} style={ds.switchLink}>
            <Text style={ds.switchText}>
              Don't have an account?{" "}
              <Text style={ds.switchHighlight}>Create one</Text>
            </Text>
          </TouchableOpacity>

          <View style={[ds.divider, { borderColor: "#1E2240" }]} />

          <View style={ds.features}>
            {[
              { icon: "book-open", text: "Study notes for CSE & EEE" },
              { icon: "zap", text: "Flashcards for quick revision" },
              { icon: "check-circle", text: "Quizzes to test your knowledge" },
            ].map((f) => (
              <View key={f.text} style={ds.featureRow}>
                <Feather name={f.icon as any} size={15} color="#7C5CFC" style={{ marginRight: 10 }} />
                <Text style={ds.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[ds.footer, { borderTopColor: "#1E2240" }]}>
        <Text style={ds.footerLeft}>StudyMate  © 2024 StudyMate</Text>
        <View style={ds.footerLinks}>
          <Text style={ds.footerLink}>Login</Text>
          <Text style={ds.footerLink}>Notes</Text>
          <Text style={ds.footerLink}>Flashcards</Text>
          <Text style={ds.footerLink}>Quizzes</Text>
        </View>
      </View>
    </View>
  );
}

function LoginCard(props: any) {
  const { colors } = props;
  return (
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
        value={props.email}
        onChangeText={props.setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={[s.label, { color: colors.mutedForeground }]}>Password</Text>
      <View style={[s.pwRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          style={[s.pwInput, { color: colors.foreground }]}
          placeholder="Your password"
          placeholderTextColor={colors.mutedForeground}
          value={props.password}
          onChangeText={props.setPassword}
          secureTextEntry={!props.showPassword}
          onSubmitEditing={props.handleLogin}
          returnKeyType="go"
        />
        <TouchableOpacity onPress={() => props.setShowPassword((v: boolean) => !v)} style={{ padding: 4 }}>
          <Feather name={props.showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {!!props.error && (
        <View style={[s.errorBox, { backgroundColor: "#FEE2E2" }]}>
          <Feather name="alert-circle" size={14} color="#DC2626" />
          <Text style={s.errorText}>{props.error}</Text>
        </View>
      )}

      <TouchableOpacity onPress={props.handleLogin} activeOpacity={0.85} disabled={props.loading} style={[s.loginBtn, { marginTop: 8 }]}>
        <LinearGradient colors={["#4361EE", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.loginGradient}>
          {props.loading ? (
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
  );
}

const ds = StyleSheet.create({
  root: { flex: 1 },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  navLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  navLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1E1040",
    alignItems: "center",
    justifyContent: "center",
  },
  navBrand: {
    color: "#E2E8F0",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  navRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  navLink: { paddingHorizontal: 14, paddingVertical: 6 },
  navLinkText: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
  },
  navLinkActiveText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  scrollContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  card: {
    width: 480,
    maxWidth: "100%" as any,
    borderRadius: 20,
    borderWidth: 1,
    padding: 36,
    gap: 4,
  },
  cardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#1E1040",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    alignSelf: "center",
  },
  welcomeTitle: {
    color: "#E2E8F0",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  welcomeDesc: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  label: {
    color: "#6B7280",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    color: "#E2E8F0",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    outlineStyle: "none" as any,
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 4,
  },
  forgotText: {
    color: "#22D3EE",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "rgba(248,113,113,0.1)",
    marginTop: 4,
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  loginBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
  },
  loginGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtnInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  switchLink: {
    alignItems: "center",
    paddingVertical: 16,
  },
  switchText: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  switchHighlight: {
    color: "#A78BFA",
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 8,
  },
  features: { gap: 14, marginTop: 4 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureText: {
    color: "#6B7280",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  footerLeft: {
    color: "#374151",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  footerLinks: {
    flexDirection: "row",
    gap: 20,
  },
  footerLink: {
    color: "#374151",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

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
