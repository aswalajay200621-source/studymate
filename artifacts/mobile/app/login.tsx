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

const isWeb = Platform.OS === "web";

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

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
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.85} disabled={loading} style={[s.loginBtn, { marginTop: 8 }]}>
              <LinearGradient colors={["#4361EE", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.loginGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : (
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

function GlassNavLink({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      {...(webHover(setHovered) as any)}
      style={[
        ds.navLink,
        (hovered || active) && {
          backgroundColor: "rgba(124,92,252,0.14)",
          borderRadius: 8,
          ...(isWeb ? { boxShadow: "0 0 10px rgba(124,92,252,0.18)" } : {}),
        },
      ] as any}
    >
      <Text
        style={[
          active ? ds.navLinkActiveText : ds.navLinkText,
          hovered && !active && { color: "#A78BFA" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function GlassInput({ value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, onSubmitEditing, returnKeyType, rightEl }: any) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isLit = focused || hovered;

  return (
    <View
      {...(webHover(setHovered) as any)}
      style={[
        ds.inputRow,
        {
          backgroundColor: isLit ? "rgba(30,18,70,0.9)" : "#141830",
          borderColor: focused
            ? "rgba(124,92,252,0.7)"
            : hovered
            ? "rgba(124,92,252,0.35)"
            : "#1E2240",
          ...(isWeb && isLit
            ? { boxShadow: focused ? "0 0 0 3px rgba(124,92,252,0.15), 0 0 16px rgba(124,92,252,0.12)" : "0 0 8px rgba(124,92,252,0.08)" }
            : {}),
        },
      ] as any}
    >
      <TextInput
        style={ds.input}
        placeholder={placeholder}
        placeholderTextColor="#4B5563"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightEl}
    </View>
  );
}

function DesktopLogin(props: any) {
  const [btnHovered, setBtnHovered] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  return (
    <View style={[ds.root, { backgroundColor: "#080B1A" }]}>
      <View
        style={[
          ds.topNav,
          isWeb ? {
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            backgroundColor: "rgba(8, 11, 26, 0.65)",
            borderBottomColor: "rgba(124, 92, 252, 0.15)",
            boxShadow: "0 1px 0 rgba(124,92,252,0.08), 0 4px 24px rgba(0,0,0,0.35)",
          } as any : { borderBottomColor: "#1E2240" },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          {...(webHover(setLogoHovered) as any)}
          style={ds.navLeft}
        >
          <View
            style={[
              ds.navLogoBox,
              logoHovered && isWeb ? {
                backgroundColor: "rgba(124,92,252,0.25)",
                ...(isWeb ? { boxShadow: "0 0 14px rgba(124,92,252,0.35)" } : {}),
              } as any : {},
            ]}
          >
            <Feather name="book-open" size={18} color={logoHovered ? "#C4B5FD" : "#A78BFA"} />
          </View>
          <Text style={[ds.navBrand, logoHovered && { color: "#C4B5FD" }]}>StudyMate</Text>
        </TouchableOpacity>

        <View style={ds.navRight}>
          <GlassNavLink label="Login" active />
          <GlassNavLink label="Notes" onPress={() => router.push("/(tabs)/library")} />
          <GlassNavLink label="Flashcards" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={ds.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          {...(webHover(setCardHovered) as any)}
          style={[
            ds.card,
            isWeb ? {
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              backgroundColor: cardHovered
                ? "rgba(18, 22, 52, 0.92)"
                : "rgba(15, 18, 40, 0.85)",
              borderColor: cardHovered
                ? "rgba(124, 92, 252, 0.28)"
                : "rgba(30, 34, 64, 0.8)",
              boxShadow: cardHovered
                ? "0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,92,252,0.15), inset 0 1px 0 rgba(255,255,255,0.04)"
                : "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
            } as any : {
              backgroundColor: "#0F1228",
              borderColor: "#1E2240",
            },
          ]}
        >
          <View
            style={[
              ds.cardIconBox,
              isWeb ? {
                background: "linear-gradient(135deg, rgba(109,40,217,0.3), rgba(124,92,252,0.15))",
                boxShadow: "0 0 20px rgba(124,92,252,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
              } as any : {},
            ]}
          >
            <Feather name="users" size={22} color="#A78BFA" />
          </View>

          <Text style={ds.welcomeTitle}>Welcome back!</Text>
          <Text style={ds.welcomeDesc}>Sign in with your email and password</Text>

          <Text style={ds.label}>EMAIL ADDRESS</Text>
          <GlassInput
            value={props.email}
            onChangeText={props.setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            rightEl={<Feather name="mail" size={16} color="#4B5563" />}
          />

          <Text style={[ds.label, { marginTop: 16 }]}>PASSWORD</Text>
          <GlassInput
            value={props.password}
            onChangeText={props.setPassword}
            placeholder="Your password"
            secureTextEntry={!props.showPassword}
            onSubmitEditing={props.handleLogin}
            returnKeyType="go"
            rightEl={
              <TouchableOpacity onPress={() => props.setShowPassword((v: boolean) => !v)}>
                <Feather name={props.showPassword ? "eye-off" : "eye"} size={16} color="#6B7280" />
              </TouchableOpacity>
            }
          />

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
            activeOpacity={0.9}
            disabled={props.loading}
            {...(webHover(setBtnHovered) as any)}
            style={[
              ds.loginBtn,
              isWeb ? {
                transform: btnHovered ? [{ scale: 1.015 }] : [{ scale: 1 }],
                boxShadow: btnHovered
                  ? "0 0 28px rgba(124,92,252,0.55), 0 4px 16px rgba(0,0,0,0.4)"
                  : "0 0 14px rgba(124,92,252,0.25), 0 2px 8px rgba(0,0,0,0.3)",
              } as any : {},
            ]}
          >
            <LinearGradient
              colors={btnHovered ? ["#7C3AED", "#8B5CF6"] : ["#6D28D9", "#7C5CFC"]}
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

          <View style={[ds.divider, { borderColor: "rgba(30,34,64,0.8)" }]} />

          <View style={ds.features}>
            {[
              { icon: "book-open", text: "Study notes for CSE & EEE" },
              { icon: "zap", text: "Flashcards for quick revision" },
              { icon: "check-circle", text: "Quizzes to test your knowledge" },
            ].map((f) => (
              <FeatureRow key={f.text} icon={f.icon as any} text={f.text} />
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          ds.footer,
          isWeb ? {
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            backgroundColor: "rgba(8,11,26,0.7)",
            borderTopColor: "rgba(124,92,252,0.1)",
          } as any : { borderTopColor: "#1E2240" },
        ]}
      >
        <Text style={ds.footerLeft}>StudyMate  © 2024 StudyMate</Text>
        <View style={ds.footerLinks}>
          {["Login", "Notes", "Flashcards", "Quizzes"].map((l) => (
            <FooterLink key={l} label={l} />
          ))}
        </View>
      </View>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: any; text: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      {...(webHover(setHovered) as any)}
      style={[
        ds.featureRow,
        hovered && isWeb ? {
          backgroundColor: "rgba(124,92,252,0.07)",
          borderRadius: 8,
          paddingHorizontal: 8,
          marginHorizontal: -8,
        } as any : {},
      ]}
    >
      <Feather
        name={icon}
        size={15}
        color={hovered ? "#A78BFA" : "#7C5CFC"}
        style={{ marginRight: 10 }}
      />
      <Text style={[ds.featureText, hovered && { color: "#A78BFA" }]}>{text}</Text>
    </TouchableOpacity>
  );
}

function FooterLink({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      {...(webHover(setHovered) as any)}
    >
      <Text style={[ds.footerLink, hovered && { color: "#A78BFA" }]}>{label}</Text>
    </TouchableOpacity>
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
  navRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  navLink: { paddingHorizontal: 14, paddingVertical: 7 },
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
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
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
  features: { gap: 4, marginTop: 4 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
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
