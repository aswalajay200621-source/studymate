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
import { WaveFlow } from "@/components/WaveFlow";

const isWeb = Platform.OS === "web";

// ─── design tokens ────────────────────────────────────────────────────────────
const BG         = "#09090B";
const GLASS      = "rgba(255,255,255,0.07)";
const GLASS_HOV  = "rgba(255,255,255,0.10)";
const BORDER     = "rgba(255,255,255,0.08)";
const BORDER_HOV = "rgba(139,92,246,0.35)";
const PURPLE     = "#8B5CF6";
const PURPLE_DIM = "rgba(139,92,246,0.18)";
const PURPLE_TXT = "#A78BFA";
const PURPLE_LIT = "#C4B5FD";
const MUTED      = "#6B7280";
const FG         = "#E2E8F0";
// ──────────────────────────────────────────────────────────────────────────────

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAuthLoading, emailLogin } = useAuth();
  const isDesktop = useIsDesktop();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  if (!isAuthLoading && user) return <Redirect href="/(tabs)" />;

  async function handleLogin() {
    setError("");
    if (!email.trim())  { setError("Please enter your email"); return; }
    if (!password)      { setError("Please enter your password"); return; }
    setLoading(true);
    const result = await emailLogin(email.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  if (isDesktop) {
    return (
      <DesktopLogin
        email={email}           setEmail={setEmail}
        password={password}     setPassword={setPassword}
        showPassword={showPassword} setShowPassword={setShowPassword}
        loading={loading}       error={error}
        handleLogin={handleLogin}
      />
    );
  }

  // ── mobile fallback ───────────────────────────────────────────────────────
  const topPad = Platform.OS === "web" ? 40 : insets.top + 24;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["#4C1D95", "#6D28D9"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.header, { paddingTop: topPad }]}
        >
          <View style={s.logoBox}>
            <Feather name="book-open" size={36} color="#fff" />
          </View>
          <Text style={s.appName}>StudyMate</Text>
          <Text style={s.tagline}>Smart notes for engineering students</Text>
        </LinearGradient>

        <View style={[s.body, { backgroundColor: BG }]}>
          <View style={[s.mobileCard, { backgroundColor: GLASS, borderColor: BORDER }]}>
            <Text style={[s.welcomeTitle, { color: FG }]}>Welcome back!</Text>
            <Text style={[s.welcomeDesc, { color: MUTED }]}>Sign in with your email and password</Text>

            <Text style={[s.label, { color: MUTED }]}>Email Address</Text>
            <TextInput
              style={[s.input, { color: FG, borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.04)" }]}
              placeholder="you@example.com"
              placeholderTextColor={MUTED}
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"
            />
            <Text style={[s.label, { color: MUTED }]}>Password</Text>
            <View style={[s.pwRow, { borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.04)" }]}>
              <TextInput
                style={[s.pwInput, { color: FG }]}
                placeholder="Your password" placeholderTextColor={MUTED}
                value={password} onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onSubmitEditing={handleLogin} returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={MUTED} />
              </TouchableOpacity>
            </View>

            {!!error && (
              <View style={s.errorBox}>
                <Feather name="alert-circle" size={14} color="#F87171" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleLogin} activeOpacity={0.85} disabled={loading}
              style={[s.loginBtn, { marginTop: 8 }]}>
              <View style={[s.loginGradient, { backgroundColor: PURPLE }]}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <View style={s.loginBtnInner}>
                    <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={s.loginText}>Sign In</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/signup")} style={s.switchLink}>
              <Text style={[s.switchText, { color: MUTED }]}>
                Don't have an account?{" "}
                <Text style={{ color: PURPLE_TXT, fontFamily: "Inter_600SemiBold" }}>Create one</Text>
              </Text>
            </TouchableOpacity>

            <View style={[s.divider, { borderColor: BORDER }]} />
            <View style={s.features}>
              {[
                { icon: "book-open",    text: "Study notes for CSE & EEE" },
                { icon: "zap",          text: "Flashcards for quick revision" },
                { icon: "check-circle", text: "Quizzes to test your knowledge" },
              ].map((f) => (
                <View key={f.text} style={s.feature}>
                  <Feather name={f.icon as any} size={16} color={PURPLE} style={{ marginRight: 10 }} />
                  <Text style={[s.featureText, { color: MUTED }]}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Glass input ───────────────────────────────────────────────────────────────
function GlassInput({ value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, onSubmitEditing, returnKeyType, rightEl }: any) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const lit = focused || hovered;

  return (
    <View
      {...(webHover(setHovered) as any)}
      style={[
        ds.inputRow,
        {
          backgroundColor: lit ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
          borderColor: focused ? "rgba(139,92,246,0.65)" : hovered ? "rgba(139,92,246,0.30)" : BORDER,
          transition: isWeb ? "all 0.25s ease" : undefined,
          ...(isWeb && lit
            ? { boxShadow: focused
                ? "0 0 0 3px rgba(139,92,246,0.14), 0 0 18px rgba(139,92,246,0.10)"
                : "0 0 8px rgba(139,92,246,0.07)"
              }
            : {}),
        } as any,
      ]}
    >
      <TextInput
        style={ds.input}
        placeholder={placeholder} placeholderTextColor="#4B5563"
        value={value} onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize}
        onSubmitEditing={onSubmitEditing} returnKeyType={returnKeyType}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
      {rightEl}
    </View>
  );
}

// ── Nav link ──────────────────────────────────────────────────────────────────
function GlassNavLink({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress} activeOpacity={0.8}
      {...(webHover(setHov) as any)}
      style={[
        ds.navLink,
        (hov || active) && {
          backgroundColor: active ? "rgba(139,92,246,0.18)" : "rgba(139,92,246,0.10)",
          borderRadius: 8,
          ...(isWeb ? { boxShadow: "0 0 12px rgba(139,92,246,0.15)" } : {}),
        },
      ] as any}
    >
      <Text style={[
        active ? ds.navLinkActive : ds.navLinkText,
        hov && !active && { color: PURPLE_TXT },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Feature row ───────────────────────────────────────────────────────────────
function FeatureRow({ icon, text }: { icon: any; text: string }) {
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      {...(webHover(setHov) as any)}
      style={[
        ds.featureRow,
        hov && isWeb && {
          backgroundColor: "rgba(139,92,246,0.07)",
          borderRadius: 8,
          paddingHorizontal: 8,
          marginHorizontal: -8,
        } as any,
      ]}
    >
      <Feather name={icon} size={15} color={hov ? PURPLE_LIT : PURPLE_TXT} style={{ marginRight: 10 }} />
      <Text style={[ds.featureText, hov && { color: PURPLE_LIT }]}>{text}</Text>
    </TouchableOpacity>
  );
}

// ── Footer link ───────────────────────────────────────────────────────────────
function FooterLink({ label }: { label: string }) {
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.8} {...(webHover(setHov) as any)}>
      <Text style={[ds.footerLink, hov && { color: PURPLE_TXT }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Desktop login ─────────────────────────────────────────────────────────────
function DesktopLogin(props: any) {
  const [btnHov,  setBtnHov]  = useState(false);
  const [cardHov, setCardHov] = useState(false);
  const [logoHov, setLogoHov] = useState(false);

  return (
    <View style={[ds.root, { backgroundColor: BG }]}>
      {/* Flowing wave particle streams */}
      <WaveFlow />

      {/* Ambient glow centred behind card */}
      {isWeb && React.createElement("div", {
        style: {
          position: "absolute",
          width: "600px", height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(109,40,217,0.18) 0%, transparent 65%)",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        },
      } as any)}

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <View style={[
        ds.topNav,
        isWeb ? {
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          backgroundColor: "rgba(9,9,11,0.75)",
          borderBottomColor: "rgba(139,92,246,0.12)",
          boxShadow: "0 1px 0 rgba(139,92,246,0.07), 0 4px 24px rgba(0,0,0,0.4)",
        } as any : { borderBottomColor: BORDER },
      ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          {...(webHover(setLogoHov) as any)}
          style={ds.navLeft}
        >
          <View style={[
            ds.navLogoBox,
            logoHov && isWeb && {
              backgroundColor: "rgba(139,92,246,0.22)",
              boxShadow: "0 0 16px rgba(139,92,246,0.35)",
            } as any,
          ]}>
            <Feather name="book-open" size={18} color={logoHov ? PURPLE_LIT : PURPLE_TXT} />
          </View>
          <Text style={[ds.navBrand, logoHov && { color: PURPLE_LIT }]}>StudyMate</Text>
        </TouchableOpacity>

        <View style={ds.navRight}>
          <GlassNavLink label="Login" active />
        </View>
      </View>

      {/* ── Card ────────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={ds.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          {...(webHover(setCardHov) as any)}
          style={[
            ds.card,
            isWeb ? {
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              backgroundColor: cardHov ? GLASS_HOV : GLASS,
              borderColor: cardHov ? "rgba(139,92,246,0.22)" : BORDER,
              boxShadow: cardHov
                ? "0 8px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(139,92,246,0.14), inset 0 1px 0 rgba(255,255,255,0.05)"
                : "0 4px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
              transition: "all 0.25s ease",
            } as any : { backgroundColor: GLASS, borderColor: BORDER },
          ]}
        >
          {/* Icon */}
          <View style={[
            ds.cardIconBox,
            isWeb ? {
              background: "linear-gradient(135deg, rgba(109,40,217,0.35), rgba(139,92,246,0.18))",
              boxShadow: "0 0 22px rgba(139,92,246,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
            } as any : {},
          ]}>
            <Feather name="users" size={22} color={PURPLE_TXT} />
          </View>

          <Text style={ds.welcomeTitle}>Welcome back!</Text>
          <Text style={ds.welcomeDesc}>Sign in with your email and password</Text>

          <Text style={ds.label}>EMAIL ADDRESS</Text>
          <GlassInput
            value={props.email} onChangeText={props.setEmail}
            placeholder="you@example.com"
            keyboardType="email-address" autoCapitalize="none"
            rightEl={<Feather name="mail" size={16} color="#4B5563" />}
          />

          <Text style={[ds.label, { marginTop: 16 }]}>PASSWORD</Text>
          <GlassInput
            value={props.password} onChangeText={props.setPassword}
            placeholder="Your password"
            secureTextEntry={!props.showPassword}
            onSubmitEditing={props.handleLogin} returnKeyType="go"
            rightEl={
              <TouchableOpacity onPress={() => props.setShowPassword((v: boolean) => !v)}>
                <Feather name={props.showPassword ? "eye-off" : "eye"} size={16} color={MUTED} />
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
            onPress={props.handleLogin} activeOpacity={0.9} disabled={props.loading}
            {...(webHover(setBtnHov) as any)}
            style={[
              ds.loginBtn,
              isWeb ? {
                transform: btnHov ? [{ scale: 1.015 }] : [{ scale: 1 }],
                boxShadow: btnHov
                  ? "0 0 30px rgba(139,92,246,0.55), 0 4px 16px rgba(0,0,0,0.4)"
                  : "0 0 16px rgba(139,92,246,0.28), 0 2px 8px rgba(0,0,0,0.3)",
                transition: "all 0.25s ease",
              } as any : {},
            ]}
          >
            <View style={[
              ds.loginGradient,
              { backgroundColor: btnHov ? "#7C3AED" : PURPLE },
              isWeb ? { transition: "background-color 0.25s ease" } as any : {},
            ]}>
              {props.loading
                ? <ActivityIndicator color="#fff" />
                : (
                  <View style={ds.loginBtnInner}>
                    <Feather name="log-in" size={18} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={ds.loginText}>Sign In</Text>
                  </View>
                )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/signup")} style={ds.switchLink}>
            <Text style={ds.switchText}>
              Don't have an account?{" "}
              <Text style={ds.switchHighlight}>Create one</Text>
            </Text>
          </TouchableOpacity>

          <View style={[ds.divider, { borderColor: BORDER }]} />

          <View style={ds.features}>
            {[
              { icon: "book-open",    text: "Study notes for CSE & EEE" },
              { icon: "zap",          text: "Flashcards for quick revision" },
              { icon: "check-circle", text: "Quizzes to test your knowledge" },
            ].map((f) => (
              <FeatureRow key={f.text} icon={f.icon as any} text={f.text} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <View style={[
        ds.footer,
        isWeb ? {
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          backgroundColor: "rgba(9,9,11,0.75)",
          borderTopColor: "rgba(139,92,246,0.10)",
        } as any : { borderTopColor: BORDER },
      ]}>
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

// ─── Desktop styles ───────────────────────────────────────────────────────────
const ds = StyleSheet.create({
  root:        { flex: 1 },
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 40, paddingVertical: 18, borderBottomWidth: 1,
  },
  navLeft:     { flexDirection: "row", alignItems: "center", gap: 10 },
  navLogoBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  navBrand:    { color: FG, fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  navRight:    { flexDirection: "row", alignItems: "center", gap: 4 },
  navLink:     { paddingHorizontal: 14, paddingVertical: 7 },
  navLinkText: { color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular", letterSpacing: 0.2 },
  navLinkActive:{ color: FG,   fontSize: 14, fontFamily: "Inter_600SemiBold", letterSpacing: 0.2 },
  scrollContent: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 48, paddingHorizontal: 20,
  },
  card: {
    width: 480, maxWidth: "100%" as any,
    borderRadius: 24, borderWidth: 1, padding: 36, gap: 4,
  },
  cardIconBox: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16, alignSelf: "center",
  },
  welcomeTitle: {
    color: FG, fontSize: 26, fontFamily: "Inter_700Bold",
    textAlign: "center", marginBottom: 6,
  },
  welcomeDesc: {
    color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular",
    textAlign: "center", marginBottom: 24, lineHeight: 22,
  },
  label: {
    color: MUTED, fontSize: 10, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5, marginBottom: 8, marginTop: 4,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, gap: 8,
  },
  input: {
    flex: 1, color: FG, fontSize: 14, fontFamily: "Inter_400Regular",
    outlineStyle: "none" as any,
  },
  forgotRow:  { alignSelf: "flex-end", marginTop: 8, marginBottom: 4 },
  forgotText: { color: PURPLE_TXT, fontSize: 13, fontFamily: "Inter_400Regular" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 12, marginTop: 4,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1, borderColor: "rgba(248,113,113,0.18)",
  },
  errorText:   { color: "#F87171", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  loginBtn:    { borderRadius: 14, overflow: "hidden", marginTop: 20 },
  loginGradient: { height: 52, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  loginBtnInner: { flexDirection: "row", alignItems: "center" },
  loginText:   { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  switchLink:  { alignItems: "center", paddingVertical: 16 },
  switchText:  { color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular" },
  switchHighlight: { color: PURPLE_TXT, fontFamily: "Inter_600SemiBold" },
  divider:     { borderTopWidth: 1, marginVertical: 8 },
  features:    { gap: 4, marginTop: 4 },
  featureRow:  { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  featureText: { color: MUTED, fontSize: 13, fontFamily: "Inter_400Regular" },
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 40, paddingVertical: 14, borderTopWidth: 1,
  },
  footerLeft:  { color: "#374151", fontSize: 12, fontFamily: "Inter_400Regular" },
  footerLinks: { flexDirection: "row", gap: 20 },
  footerLink:  { color: "#374151", fontSize: 12, fontFamily: "Inter_400Regular" },
});

// ─── Mobile styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header:      { alignItems: "center", paddingHorizontal: 24, paddingBottom: 48 },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  appName:     { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 6 },
  tagline:     { color: "rgba(255,255,255,0.8)", fontSize: 15, fontFamily: "Inter_400Regular" },
  body:        { flex: 1, padding: 20, marginTop: -24 },
  mobileCard:  { borderRadius: 24, borderWidth: 1, padding: 24, gap: 8 },
  welcomeTitle:{ fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  welcomeDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 8 },
  label:       { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 4, marginTop: 4 },
  input: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  pwRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 2,
  },
  pwInput:     { flex: 1, paddingVertical: 10, fontSize: 15, fontFamily: "Inter_400Regular" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 12,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1, borderColor: "rgba(248,113,113,0.18)",
  },
  errorText:   { color: "#F87171", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  loginBtn:    { borderRadius: 14, overflow: "hidden" },
  loginGradient: { height: 54, alignItems: "center", justifyContent: "center" },
  loginBtnInner: { flexDirection: "row", alignItems: "center" },
  loginText:   { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  switchLink:  { alignItems: "center", paddingVertical: 4 },
  switchText:  { fontSize: 14, fontFamily: "Inter_400Regular" },
  divider:     { borderTopWidth: 1, marginVertical: 16 },
  features:    { gap: 14 },
  feature:     { flexDirection: "row", alignItems: "center" },
  featureText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
});
