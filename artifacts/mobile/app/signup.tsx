import { LinearGradient } from "expo-linear-gradient";
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
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const YEAR_VALUES = ["1", "2", "3", "4"];

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { emailSignup } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [college, setCollege] = useState<"CSE" | "EEE">("CSE");
  const [year, setYear] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 32 : insets.top + 16;

  async function handleSignup() {
    setError("");
    if (!firstName.trim()) { setError("First name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }

    setLoading(true);
    const result = await emailSignup({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, college, year });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.replace("/onboarding");
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
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.appName}>Create Account</Text>
          <Text style={s.tagline}>Join StudyMate and start learning</Text>
        </LinearGradient>

        <View style={[s.body, { backgroundColor: colors.background }]}>
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>First Name *</Text>
                <TextInput
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="Ajay"
                  placeholderTextColor={colors.mutedForeground}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: colors.mutedForeground }]}>Last Name</Text>
                <TextInput
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="Kumar"
                  placeholderTextColor={colors.mutedForeground}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Text style={[s.label, { color: colors.mutedForeground }]}>Email Address *</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={[s.label, { color: colors.mutedForeground }]}>Password *</Text>
            <View style={[s.pwRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[s.pwInput, { color: colors.foreground }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[s.label, { color: colors.mutedForeground, marginTop: 4 }]}>College *</Text>
            <View style={s.pillRow}>
              {(["CSE", "EEE"] as const).map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCollege(c)}
                  style={[s.pill, {
                    borderColor: college === c ? "#4361EE" : colors.border,
                    backgroundColor: college === c ? "#4361EE" : colors.background,
                  }]}
                >
                  <Text style={[s.pillText, { color: college === c ? "#fff" : colors.foreground }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.label, { color: colors.mutedForeground, marginTop: 4 }]}>Year *</Text>
            <View style={s.pillRow}>
              {YEARS.map((label, i) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => setYear(YEAR_VALUES[i])}
                  style={[s.pill, {
                    borderColor: year === YEAR_VALUES[i] ? "#4361EE" : colors.border,
                    backgroundColor: year === YEAR_VALUES[i] ? "#4361EE" : colors.background,
                  }]}
                >
                  <Text style={[s.pillText, { color: year === YEAR_VALUES[i] ? "#fff" : colors.foreground, fontSize: 12 }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!!error && (
              <View style={[s.errorBox, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
              style={[s.btnWrap, { marginTop: 8 }]}
            >
              <LinearGradient colors={["#4361EE", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Feather name="user-plus" size={18} color="#fff" />
                    <Text style={s.btnText}>Create Account</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/login")} style={s.switchLink}>
              <Text style={[s.switchText, { color: colors.mutedForeground }]}>
                Already have an account?{" "}
                <Text style={{ color: "#4361EE", fontFamily: "Inter_600SemiBold" }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tagline: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontFamily: "Inter_400Regular" },
  body: { flex: 1, padding: 20, marginTop: -20 },
  card: { borderRadius: 24, borderWidth: 1, padding: 24, gap: 8 },
  row: { flexDirection: "row", gap: 12 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 4, marginTop: 4 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  pwRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 2,
  },
  pwInput: { flex: 1, paddingVertical: 10, fontSize: 15, fontFamily: "Inter_400Regular" },
  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    borderWidth: 2, borderRadius: 12,
    paddingVertical: 9, paddingHorizontal: 14, alignItems: "center",
  },
  pillText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12 },
  errorText: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  btnWrap: { borderRadius: 14, overflow: "hidden" },
  btn: { height: 52, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  switchLink: { alignItems: "center", marginTop: 8 },
  switchText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
