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
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/content";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useApiSubjects } from "@/hooks/useApiSubjects";

const isWeb = Platform.OS === "web";

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

function SubjectIconCell({ icon, color }: { icon: string; color: string }) {
  if (/^[a-z][a-z0-9-]*$/.test(icon)) {
    return <Ionicons name={icon as any} size={20} color={color} />;
  }
  return <Text style={{ fontSize: 18 }}>{icon}</Text>;
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatCard({ icon, label, color }: { icon: string; label: string; color: string }) {
  const colors = useColors();
  const [hov, setHov] = useState(false);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      {...(webHover(setHov) as any)}
      style={[
        s.featCard,
        {
          backgroundColor: colors.card,
          borderColor: hov ? colors.accent : colors.border,
        },
        isWeb ? {
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: hov
            ? (isDark ? "0 4px 14px rgba(99,102,241,0.15)" : "0 4px 14px rgba(79,70,229,0.08)")
            : "0 2px 8px rgba(0,0,0,0.03)",
          transition: "all 0.22s ease",
        } as any : {},
      ]}
    >
      <View style={[s.featIcon, { backgroundColor: color + "12" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[
        s.featLabel,
        {
          color: colors.text,
          fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Subject card (Library ticket layout) ──────────────────────────────────────
function SubjectRow({ sub }: { sub: any }) {
  const colors = useColors();
  const [hov, setHov] = useState(false);
  
  // Left border color strip: use Oxblood for CSE, Gold for EEE, or standard sub.color
  const borderStripColor = sub.college === "CSE" ? colors.cseColor : colors.eeeColor;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/subject/${sub.id}`)}
      activeOpacity={0.85}
      {...(webHover(setHov) as any)}
      style={[
        s.subjectRow,
        {
          backgroundColor: colors.card,
          borderColor: hov ? colors.accent : colors.border,
          borderLeftColor: borderStripColor,
        },
        isWeb ? {
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: hov
            ? ("0 4px 16px rgba(0,0,0,0.06), 0 0 1px " + colors.accent)
            : "0 1px 4px rgba(0,0,0,0.02)",
          transition: "all 0.22s ease",
        } as any : {},
      ]}
    >
      <View style={[s.subjectIcon, { backgroundColor: sub.color + "12" }]}>
        <SubjectIconCell icon={sub.icon} color={sub.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[
          s.subjectName,
          {
            color: colors.text,
            fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            fontWeight: "700" as any,
          }
        ]}>
          {sub.name}
        </Text>
        <Text style={[
          s.subjectMeta,
          {
            color: colors.mutedForeground,
            fontFamily: isWeb ? "'JetBrains Mono', monospace" : "System",
          }
        ]}>
          {sub.code} · Sem {sub.semester} · {sub.chapterCount} chapters
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.accent} />
    </TouchableOpacity>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { selectedCollege, isDark, toggleTheme } = useApp();
  const isDesktop = useIsDesktop();
  const topPad    = isDesktop ? 0 : Platform.OS === "web" ? 67 : insets.top;

  const { subjects, loading } = useApiSubjects(selectedCollege);

  if (!selectedCollege) return null;

  const college = COLLEGES[selectedCollege];
  const recent  = subjects.slice(0, 3);

  const features = [
    { icon: "search",  label: "Search Notes", color: colors.accent },
    { icon: "archive", label: "PYQs",         color: colors.destructive },
  ] as const;

  return (
    <View style={[s.wrapper, { backgroundColor: colors.background }]}>
      <ScrollView
        style={s.root}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Library Ticket Header Card ──────────────────────────────────── */}
        <View style={[
          s.header,
          { paddingTop: topPad + 24, paddingHorizontal: isDesktop ? 40 : 20 },
          isDesktop && { maxWidth: 900, alignSelf: "center" as any, width: "100%" as any },
        ]}>
          <View style={[
            s.headerCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            isWeb ? {
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.02)",
            } as any : {},
          ]}>
            {/* Perforated top bar styling */}
            <View style={[s.headerTop, { borderBottomWidth: 1, borderBottomColor: colors.border, pb: 16 } as any]}>
              <View style={{ gap: 4, flex: 1 }}>
                <Text style={[s.greeting, { color: colors.mutedForeground }]}>Student Member Access</Text>
                <Text style={[
                  s.collegeName,
                  {
                    color: colors.text,
                    fontFamily: isWeb ? "'Playfair Display', serif" : "System",
                  }
                ]}>
                  {college.name}
                </Text>
                <Text style={[
                  s.collegeStream,
                  {
                    color: colors.accent,
                    fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
                  }
                ]}>
                  {college.fullName}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end", gap: 10 }}>
                {/* Book Crest/Avatar */}
                <View style={[
                  s.avatarCircle,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                  }
                ]}>
                  <Feather name="book-open" size={20} color={colors.accent} />
                </View>

                {/* Mobile-only theme toggle */}
                {!isDesktop && (
                  <TouchableOpacity
                    onPress={toggleTheme}
                    style={[
                      s.mobileToggle,
                      { backgroundColor: colors.secondary, borderColor: colors.border }
                    ]}
                  >
                    <Feather name={isDark ? "sun" : "moon"} size={13} color={colors.text} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Header bottom details */}
            <View style={[s.pillRow, { paddingTop: 14 }]}>
              <View style={[s.pill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="layers" size={12} color={colors.accent} />
                <Text style={[s.pillText, { color: colors.text }]}>{subjects.length} Subjects Shelf</Text>
              </View>
              {isDark ? (
                <View style={[s.pill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="moon" size={11} color={colors.accent} />
                  <Text style={[s.pillText, { color: colors.text }]}>Midnight Library</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <View style={[
          s.body,
          isDesktop && { maxWidth: 900, alignSelf: "center" as any, width: "100%" as any, paddingHorizontal: 40 },
        ]}>

          {/* Section: Features */}
          <Text style={[
            s.sectionTitle,
            {
              color: colors.text,
              fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            }
          ]}>
            Features
          </Text>
          <View style={s.featGrid}>
            {features.map((f) => (
              <FeatCard key={f.label} icon={f.icon} label={f.label} color={f.color} />
            ))}
          </View>

          {/* Section: Subjects */}
          <Text style={[
            s.sectionTitle,
            {
              color: colors.text,
              fontFamily: isWeb ? "'Playfair Display', serif" : "System",
              marginTop: 18,
            }
          ]}>
            Your Subjects Shelf
          </Text>

          {loading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : recent.length === 0 ? (
            <View style={[
              s.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}>
              <Feather name="book" size={24} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No subjects shelf found</Text>
            </View>
          ) : (
            recent.map((sub) => <SubjectRow key={sub.id} sub={sub} />)
          )}

          {!loading && subjects.length > 3 && (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/library")}
              style={[
                s.viewAllBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }
              ]}
            >
              <Text style={[
                s.viewAllText,
                {
                  color: colors.accent,
                  fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
                }
              ]}>
                View all {subjects.length} subjects shelf
              </Text>
              <Feather name="arrow-right" size={14} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:      { flex: 1 },
  root:         { flex: 1, backgroundColor: "transparent" },
  header:       { paddingBottom: 0 },
  headerCard:   { borderRadius: 10, borderWidth: 1, padding: 20 },
  headerTop:    { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 14 },
  greeting:     { fontSize: 10, letterSpacing: 1, textTransform: "uppercase", fontFamily: "System", fontWeight: "600" },
  collegeName:  { fontSize: 24, fontWeight: "700", marginTop: 4 },
  collegeStream:{ fontSize: 13, fontWeight: "500", marginTop: 2 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  mobileToggle: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1, marginTop: 4 },
  pillRow:      { flexDirection: "row", gap: 8 },
  pill:         { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 },
  pillText:     { fontSize: 11, fontWeight: "600" },
  body:         { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  featGrid:     { flexDirection: "row", gap: 12 },
  featCard:     { flex: 1, borderRadius: 10, borderWidth: 1, padding: 16, alignItems: "center", gap: 10 },
  featIcon:     { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featLabel:    { fontSize: 13, fontWeight: "600", textAlign: "center" },
  subjectRow:   { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, borderLeftWidth: 4, padding: 16, gap: 14 },
  subjectIcon:  { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  subjectName:  { fontSize: 15, marginBottom: 2 },
  subjectMeta:  { fontSize: 11 },
  loadingRow:   { paddingVertical: 28, alignItems: "center" },
  emptyCard:    { borderRadius: 10, borderWidth: 1, padding: 36, alignItems: "center", gap: 12 },
  emptyText:    { fontSize: 13 },
  viewAllBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 14 },
  viewAllText:  { fontSize: 13, fontWeight: "600" },
});
