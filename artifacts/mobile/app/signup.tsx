import { router } from "expo-router";
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
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { ParticleMesh } from "@/components/ParticleMesh";

// ─── design tokens ────────────────────────────────────────────────────────────
const BG        = "#09090B";
const GLASS     = "rgba(255,255,255,0.07)";
const GLASS_HOV = "rgba(255,255,255,0.10)";
const BORDER    = "rgba(255,255,255,0.08)";
const PURPLE    = "#8B5CF6";
const PURPLE_TXT= "#A78BFA";
const PURPLE_LIT= "#C4B5FD";
const MUTED     = "#6B7280";
const FG        = "#E2E8F0";
const isWeb     = Platform.OS === "web";
// ──────────────────────────────────────────────────────────────────────────────

const YEARS       = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const YEAR_VALUES = ["1", "2", "3", "4"];

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

// ─── Glass text input ─────────────────────────────────────────────────────────
function GlassInput({
  value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, autoComplete, rightEl,
}: any) {
  const [focused, setFocused] = useState(false);
  const [hov,     setHov]     = useState(false);
  const lit = focused || hov;

  return (
    <View
      {...(webHover(setHov) as any)}
      style={[
        si.inputRow,
        {
          backgroundColor: lit ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)",
          borderColor: focused
            ? "rgba(139,92,246,0.65)"
            : hov ? "rgba(139,92,246,0.30)" : BORDER,
        } as any,
        isWeb && lit && {
          boxShadow: focused
            ? "0 0 0 3px rgba(139,92,246,0.14), 0 0 18px rgba(139,92,246,0.10)"
            : "0 0 8px rgba(139,92,246,0.07)",
          transition: "all 0.25s ease",
        } as any,
      ]}
    >
      <TextInput
        style={si.input}
        placeholder={placeholder}
        placeholderTextColor="#4B5563"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightEl}
    </View>
  );
}

// ─── Pill selector ────────────────────────────────────────────────────────────
function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      {...(webHover(setHov) as any)}
      style={[
        si.pill,
        {
          borderColor: active ? PURPLE : hov ? "rgba(139,92,246,0.30)" : BORDER,
          backgroundColor: active
            ? "rgba(139,92,246,0.22)"
            : hov ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.04)",
        },
        isWeb ? { transition: "all 0.2s ease" } as any : {},
      ]}
    >
      <Text style={[
        si.pillText,
        { color: active ? PURPLE_LIT : hov ? PURPLE_TXT : MUTED },
        active && { fontFamily: "Inter_700Bold" },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SignupScreen() {
  const insets    = useSafeAreaInsets();
  const { emailSignup } = useAuth();
  const isDesktop = useIsDesktop();

  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [college,      setCollege]      = useState<"CSE" | "EEE">("CSE");
  const [year,         setYear]         = useState("1");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const topPad = Platform.OS === "web" ? 32 : insets.top + 16;

  async function handleSignup() {
    setError("");
    if (!firstName.trim()) { setError("First name is required"); return; }
    if (!email.trim())     { setError("Email is required"); return; }
    if (!password)         { setError("Password is required"); return; }
    setLoading(true);
    const result = await emailSignup({
      firstName: firstName.trim(), lastName: lastName.trim(),
      email: email.trim(), password, college, year,
    });
    setLoading(false);
    if (result.error) { setError(result.error); }
    else { router.replace("/onboarding"); }
  }

  // ── shared form fields ──────────────────────────────────────────────────────
  const formFields = (
    <>
      {/* Name row */}
      <View style={si.nameRow}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={si.label}>FIRST NAME *</Text>
          <GlassInput
            value={firstName} onChangeText={setFirstName}
            placeholder="Ajay" autoCapitalize="words"
          />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={si.label}>LAST NAME</Text>
          <GlassInput
            value={lastName} onChangeText={setLastName}
            placeholder="Kumar" autoCapitalize="words"
          />
        </View>
      </View>

      {/* Email */}
      <Text style={[si.label, { marginTop: 4 }]}>EMAIL ADDRESS *</Text>
      <GlassInput
        value={email} onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address" autoCapitalize="none" autoComplete="email"
        rightEl={<Feather name="mail" size={16} color="#4B5563" />}
      />

      {/* Password */}
      <Text style={[si.label, { marginTop: 4 }]}>PASSWORD *</Text>
      <GlassInput
        value={password} onChangeText={setPassword}
        placeholder="Min. 6 characters"
        secureTextEntry={!showPassword} autoComplete="new-password"
        rightEl={
          <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={MUTED} />
          </TouchableOpacity>
        }
      />

      {/* College */}
      <Text style={[si.label, { marginTop: 8 }]}>COLLEGE *</Text>
      <View style={si.pillRow}>
        {(["CSE", "EEE"] as const).map(c => (
          <Pill key={c} label={c} active={college === c} onPress={() => setCollege(c)} />
        ))}
      </View>

      {/* Year */}
      <Text style={[si.label, { marginTop: 8 }]}>YEAR *</Text>
      <View style={si.pillRow}>
        {YEARS.map((lbl, i) => (
          <Pill
            key={lbl} label={lbl}
            active={year === YEAR_VALUES[i]}
            onPress={() => setYear(YEAR_VALUES[i])}
          />
        ))}
      </View>

      {/* Error */}
      {!!error && (
        <View style={si.errorBox}>
          <Feather name="alert-circle" size={14} color="#F87171" />
          <Text style={si.errorText}>{error}</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSignup} disabled={loading} activeOpacity={0.88}
        style={[
          si.btn,
          isWeb && { boxShadow: "0 0 18px rgba(139,92,246,0.32), 0 4px 12px rgba(0,0,0,0.35)" } as any,
        ]}
      >
        <View style={[si.btnInner, { backgroundColor: PURPLE }]}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="user-plus" size={18} color="#fff" />
                <Text style={si.btnText}>Create Account</Text>
              </View>
            )}
        </View>
      </TouchableOpacity>

      {/* Switch to login */}
      <TouchableOpacity onPress={() => router.replace("/login")} style={si.switchLink}>
        <Text style={si.switchText}>
          Already have an account?{" "}
          <Text style={si.switchHighlight}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  // ── Desktop layout ──────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <View style={[sd.root, { backgroundColor: BG }]}>
        <ParticleMesh />

        {/* Ambient glow */}
        {isWeb && React.createElement("div", {
          style: {
            position: "absolute",
            width: "700px", height: "700px", borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 65%)",
            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          },
        } as any)}

        {/* Nav */}
        <View style={[
          sd.nav,
          isWeb ? {
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            backgroundColor: "rgba(9,9,11,0.80)",
            borderBottomColor: "rgba(139,92,246,0.12)",
            boxShadow: "0 1px 0 rgba(139,92,246,0.07), 0 4px 24px rgba(0,0,0,0.4)",
          } as any : { borderBottomColor: BORDER },
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={sd.navBack} activeOpacity={0.8}>
            <Feather name="arrow-left" size={16} color={PURPLE_TXT} />
            <Text style={sd.navBackText}>Back</Text>
          </TouchableOpacity>
          <View style={sd.navLogoBox}>
            <Feather name="book-open" size={18} color={PURPLE_TXT} />
          </View>
          <Text style={sd.navBrand}>StudyMate</Text>
        </View>

        {/* Card */}
        <ScrollView
          contentContainerStyle={sd.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[
            sd.card,
            isWeb ? {
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              backgroundColor: GLASS,
              borderColor: BORDER,
              boxShadow: "0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            } as any : { backgroundColor: GLASS, borderColor: BORDER },
          ]}>
            {/* Icon */}
            <View style={[
              sd.iconBox,
              isWeb ? {
                background: "linear-gradient(135deg, rgba(109,40,217,0.35), rgba(139,92,246,0.18))",
                boxShadow: "0 0 22px rgba(139,92,246,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
              } as any : {},
            ]}>
              <Feather name="user-plus" size={22} color={PURPLE_TXT} />
            </View>

            <Text style={sd.title}>Create Account</Text>
            <Text style={sd.sub}>Join StudyMate and start learning</Text>

            {formFields}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Mobile layout ───────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mobile header */}
        <View style={[sm.header, { paddingTop: topPad, backgroundColor: "rgba(139,92,246,0.10)" }]}>
          <TouchableOpacity onPress={() => router.back()} style={sm.backBtn}>
            <Feather name="arrow-left" size={22} color={PURPLE_TXT} />
          </TouchableOpacity>
          <Text style={sm.appName}>Create Account</Text>
          <Text style={sm.tagline}>Join StudyMate and start learning</Text>
        </View>

        <View style={[sm.body, { backgroundColor: BG }]}>
          <View style={[sm.card, { backgroundColor: GLASS, borderColor: BORDER }]}>
            {formFields}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Shared input/pill styles ─────────────────────────────────────────────────
const si = StyleSheet.create({
  nameRow:  { flexDirection: "row", gap: 12 },
  label: {
    color: MUTED, fontSize: 10, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5, marginBottom: 8,
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
  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 16, alignItems: "center",
  },
  pillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 12, marginTop: 4,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1, borderColor: "rgba(248,113,113,0.18)",
  },
  errorText: { color: "#F87171", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  btn:       { borderRadius: 14, overflow: "hidden", marginTop: 20 },
  btnInner:  { height: 52, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  btnText:   { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  switchLink:{ alignItems: "center", marginTop: 16, paddingVertical: 4 },
  switchText:{ color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular" },
  switchHighlight: { color: PURPLE_TXT, fontFamily: "Inter_600SemiBold" },
});

// ─── Desktop styles ───────────────────────────────────────────────────────────
const sd = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 40, paddingVertical: 16,
    borderBottomWidth: 1, gap: 12,
  },
  navBack:     { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 8 },
  navBackText: { color: PURPLE_TXT, fontSize: 14, fontFamily: "Inter_500Medium" },
  navLogoBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  navBrand: { color: FG, fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  scrollContent: {
    flexGrow: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 48, paddingHorizontal: 20,
  },
  card: {
    width: 520, maxWidth: "100%" as any,
    borderRadius: 24, borderWidth: 1, padding: 36, gap: 4,
  },
  iconBox: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16, alignSelf: "center",
  },
  title: {
    color: FG, fontSize: 26, fontFamily: "Inter_700Bold",
    textAlign: "center", marginBottom: 6,
  },
  sub: {
    color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular",
    textAlign: "center", marginBottom: 20, lineHeight: 22,
  },
});

// ─── Mobile styles ────────────────────────────────────────────────────────────
const sm = StyleSheet.create({
  header: {
    paddingHorizontal: 24, paddingBottom: 36,
    borderBottomWidth: 1, borderBottomColor: "rgba(139,92,246,0.15)",
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.12)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 20, borderWidth: 1, borderColor: "rgba(139,92,246,0.20)",
  },
  appName: { color: FG, fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tagline: { color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular" },
  body:    { flex: 1, padding: 20, marginTop: -1 },
  card:    { borderRadius: 22, borderWidth: 1, padding: 20, gap: 8 },
});
