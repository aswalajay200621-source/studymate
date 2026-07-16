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
import { useColors } from "@/hooks/useColors";
import { LinearGradient } from "expo-linear-gradient";

const isWeb = Platform.OS === "web";

const YEARS       = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const YEAR_VALUES = ["1", "2", "3", "4"];

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

// ─── Custom Web Styles Injection ──────────────────────────────────────────────
function InjectSignupWebStyles() {
  if (!isWeb) return null;
  const colors = useColors();
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    
    .signup-input:focus-within {
      border-color: ${colors.accent} !important;
      background-color: ${colors.card} !important;
    }
  `;
  return React.createElement("style", { dangerouslySetInnerHTML: { __html: css } });
}

// ─── Styled text input ─────────────────────────────────────────────────────────
function FormInput({
  value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, autoComplete, rightEl,
}: any) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [hov,     setHov]     = useState(false);
  const lit = focused || hov;

  return (
    <View
      {...(webHover(setHov) as any)}
      style={[
        si.inputRow,
        {
          backgroundColor: colors.input,
          borderColor: focused ? colors.accent : colors.border,
        },
        isWeb ? {
          transition: "all 0.2s ease",
        } as any : {},
      ]}
    >
      <TextInput
        style={[
          si.input,
          {
            color: colors.text,
            fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
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
  const colors = useColors();
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      {...(webHover(setHov) as any)}
      style={[
        si.pill,
        {
          borderColor: active ? colors.accent : colors.border,
          backgroundColor: active ? colors.secondary : "transparent",
        },
        isWeb ? { transition: "all 0.2s ease" } as any : {},
      ]}
    >
      <Text style={[
        si.pillText,
        {
          color: active ? colors.text : colors.mutedForeground,
          fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
        },
        active && { fontWeight: "600" as any },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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

  // ── Shared form fields ──────────────────────────────────────────────────────
  const formFields = (
    <>
      <InjectSignupWebStyles />
      {/* Name row */}
      <View style={si.nameRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[si.label, { color: colors.mutedForeground }]}>FIRST NAME *</Text>
          <FormInput
            value={firstName} onChangeText={setFirstName}
            placeholder="Ajay" autoCapitalize="words"
          />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[si.label, { color: colors.mutedForeground }]}>LAST NAME</Text>
          <FormInput
            value={lastName} onChangeText={setLastName}
            placeholder="Kumar" autoCapitalize="words"
          />
        </View>
      </View>

      {/* Email */}
      <Text style={[si.label, { color: colors.mutedForeground, marginTop: 12 }]}>EMAIL ADDRESS *</Text>
      <FormInput
        value={email} onChangeText={setEmail}
        placeholder="you@college.edu"
        keyboardType="email-address" autoCapitalize="none" autoComplete="email"
        rightEl={<Feather name="mail" size={16} color={colors.accent} />}
      />

      {/* Password */}
      <Text style={[si.label, { color: colors.mutedForeground, marginTop: 12 }]}>PASSWORD *</Text>
      <FormInput
        value={password} onChangeText={setPassword}
        placeholder="Min. 8 characters"
        secureTextEntry={!showPassword} autoComplete="new-password"
        rightEl={
          <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      {/* College */}
      <Text style={[si.label, { color: colors.mutedForeground, marginTop: 12 }]}>COLLEGE *</Text>
      <View style={si.pillRow}>
        {(["CSE", "EEE"] as const).map(c => (
          <Pill key={c} label={c} active={college === c} onPress={() => setCollege(c)} />
        ))}
      </View>

      {/* Year */}
      <Text style={[si.label, { color: colors.mutedForeground, marginTop: 12 }]}>YEAR *</Text>
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
        <View style={[si.errorBox, { borderColor: colors.border }]}>
          <Feather name="alert-circle" size={14} color={colors.destructive} />
          <Text style={[si.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSignup} disabled={loading} activeOpacity={0.88}
        style={[si.btn, { marginTop: 24 }]}
      >
        <LinearGradient colors={[colors.primary, colors.tint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={si.btnInner}>
          {loading
            ? <ActivityIndicator color={colors.primaryForeground} />
            : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="user-plus" size={18} color={colors.primaryForeground} />
                <Text style={[si.btnText, { color: colors.primaryForeground }]}>Create Account</Text>
              </View>
            )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Switch to login */}
      <TouchableOpacity onPress={() => router.replace("/login")} style={si.switchLink}>
        <Text style={[si.switchText, { color: colors.mutedForeground }]}>
          Already have an account?{" "}
          <Text style={{ color: colors.destructive, fontWeight: "600" as any }}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  // ── Desktop layout ──────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <View style={[sd.root, { backgroundColor: colors.background }]}>
        <ParticleMesh />

        {/* Nav */}
        <View style={[
          sd.nav,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
          isWeb ? {
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 1px 0 rgba(184,147,90,0.06), 0 4px 24px rgba(0,0,0,0.03)",
          } as any : {},
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={sd.navBack} activeOpacity={0.8}>
            <Feather name="arrow-left" size={16} color={colors.accent} />
            <Text style={[sd.navBackText, { color: colors.accent }]}>Back</Text>
          </TouchableOpacity>
          <View style={[sd.navLogoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="book-open" size={18} color={colors.accent} />
          </View>
          <Text style={[
            sd.navBrand,
            {
              color: colors.text,
              fontFamily: isWeb ? "'Playfair Display', serif" : "System",
              fontWeight: "700" as any,
            }
          ]}>
            StudyMate
          </Text>
        </View>

        {/* Card */}
        <ScrollView
          contentContainerStyle={sd.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[
            sd.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            isWeb ? {
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.02)",
            } as any : {},
          ]}>
            {/* Crest Icon */}
            <View style={[sd.iconBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="user-plus" size={22} color={colors.accent} />
            </View>

            <Text style={[
              sd.title,
              {
                color: colors.text,
                fontFamily: isWeb ? "'Playfair Display', serif" : "System",
                fontWeight: "700" as any,
              }
            ]}>
              Create Student Ticket
            </Text>
            <Text style={[
              sd.sub,
              {
                color: colors.mutedForeground,
                fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
              }
            ]}>
              Register for member access to note archives
            </Text>

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
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mobile header */}
        <View style={[sm.header, { paddingTop: topPad, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[sm.backBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={20} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[
            sm.appName,
            {
              color: colors.text,
              fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            }
          ]}>
            Create Account
          </Text>
          <Text style={[
            sm.tagline,
            {
              color: colors.mutedForeground,
              fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
            }
          ]}>
            Join StudyMate shelf today
          </Text>
        </View>

        <View style={[sm.body, { backgroundColor: colors.background }]}>
          <View style={[sm.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {formFields}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const si = StyleSheet.create({
  nameRow:  { flexDirection: "row", gap: 12 },
  label: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  input: { flex: 1, fontSize: 14, outlineStyle: "none" as any },
  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: { borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16, alignItems: "center" },
  pillText: { fontSize: 13, fontWeight: "600" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12, marginTop: 12, backgroundColor: "rgba(239,68,68,0.06)", borderWidth: 1 },
  errorText: { fontSize: 13, flex: 1 },
  btn:       { borderRadius: 10, overflow: "hidden" },
  btnInner:  { height: 50, alignItems: "center", justifyContent: "center" },
  btnText:   { fontSize: 15, fontWeight: "700" },
  switchLink:{ alignItems: "center", marginTop: 16, paddingVertical: 4 },
  switchText:{ fontSize: 14 },
});

const sd = StyleSheet.create({
  root: { flex: 1 },
  nav: { flexDirection: "row", alignItems: "center", paddingHorizontal: 40, paddingVertical: 16, borderBottomWidth: 1, gap: 12 },
  navBack:     { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 8 },
  navBackText: { fontSize: 14, fontWeight: "500" },
  navLogoBox: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  navBrand: { fontSize: 18, letterSpacing: 0.3 },
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 20 },
  card: { width: 520, maxWidth: "100%" as any, borderRadius: 10, borderWidth: 1, padding: 36, gap: 4 },
  iconBox: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 16, alignSelf: "center" },
  title: { fontSize: 26, textAlign: "center", marginBottom: 6 },
  sub: { fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 22 },
});

const sm = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingBottom: 36, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 20, borderWidth: 1 },
  appName: { fontSize: 26, fontWeight: "700", marginBottom: 4 },
  tagline: { fontSize: 14 },
  body:    { flex: 1, padding: 20, marginTop: -1 },
  card:    { borderRadius: 10, borderWidth: 1, padding: 20, gap: 8 },
});
