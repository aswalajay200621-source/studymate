import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/content";
import { useApiSubjects, type ApiSubject } from "@/hooks/useApiSubjects";
import { ParticleMesh } from "@/components/ParticleMesh";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

function webHover(setFn: (v: boolean) => void) {
  if (!isWeb) return {};
  return { onMouseEnter: () => setFn(true), onMouseLeave: () => setFn(false) };
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { selectedCollege } = useApp();
  const topPad = isWeb ? 67 : insets.top;
  const [query, setQuery] = useState("");

  const { subjects, loading } = useApiSubjects(selectedCollege);

  if (!selectedCollege) return null;
  const college = COLLEGES[selectedCollege];

  const filtered = useMemo(() => {
    if (!query.trim()) return subjects;
    const q = query.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [subjects, query]);

  const sem1 = filtered.filter((s) => s.semester === 1);
  const sem2 = filtered.filter((s) => s.semester === 2);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Drifting warm library particles background */}
      <ParticleMesh />

      {/* Header */}
      <View
        style={[
          s.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          },
          isWeb ? {
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 1px 0 " + colors.border + ", 0 4px 20px rgba(0,0,0,0.03)",
          } as any : {},
        ]}
      >
        <View style={s.headerInner}>
          <Text style={[
            s.title,
            {
              color: colors.text,
              fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            }
          ]}>
            Library Shelf
          </Text>
          <Text style={[
            s.subtitle,
            {
              color: colors.accent,
              fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
            }
          ]}>
            {college.fullName}
          </Text>

          {/* Search bar */}
          <View
            style={[
              s.searchRow,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="search" size={16} color={colors.accent} />
            <TextInput
              style={[
                s.searchInput,
                {
                  color: colors.text,
                  fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
                }
              ]}
              placeholder="Search subjects..."
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.body, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {sem1.length > 0 && (
            <SubjectGroup title="Semester 1 Shelf" subjects={sem1} />
          )}
          {sem2.length > 0 && (
            <SubjectGroup title="Semester 2 Shelf" subjects={sem2} />
          )}
          {filtered.length === 0 && (
            <View style={s.empty}>
              <Feather name="search" size={32} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground, fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System" }]}>
                No subjects shelf found
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SubjectCard({ sub }: { sub: ApiSubject }) {
  const colors = useColors();
  const [hov, setHov] = useState(false);
  const borderStripColor = sub.college === "CSE" ? colors.cseColor : colors.eeeColor;

  return (
    <TouchableOpacity
      key={sub.id}
      onPress={() => router.push(`/subject/${sub.id}`)}
      activeOpacity={0.85}
      {...(webHover(setHov) as any)}
      style={[
        sg.card,
        {
          backgroundColor: colors.card,
          borderColor: hov ? colors.accent : colors.border,
          borderLeftColor: borderStripColor,
        },
        isWeb ? {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: hov
            ? ("0 4px 16px rgba(0,0,0,0.06), 0 0 1px " + colors.accent)
            : `0 1px 4px rgba(0,0,0,0.02)`,
          transition: "all 0.22s ease",
        } as any : {},
      ]}
    >
      <View style={[sg.iconWrap, { backgroundColor: sub.color + "12", borderColor: sub.color + "25", borderWidth: 1 }]}>
        {/^[a-z][a-z0-9-]*$/.test(sub.icon)
          ? <Ionicons name={sub.icon as any} size={20} color={sub.color} />
          : <Text style={{ fontSize: 20 }}>{sub.icon}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[
          sg.name,
          {
            color: colors.text,
            fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            fontWeight: "700" as any,
          }
        ]}>
          {sub.name}
        </Text>
        <Text style={[
          sg.code,
          {
            color: colors.accent,
            fontFamily: isWeb ? "'JetBrains Mono', monospace" : "System",
          }
        ]}>
          {sub.code}
        </Text>
        <Text style={[
          sg.desc,
          {
            color: colors.mutedForeground,
            fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
          }
        ]} numberOfLines={1}>
          {sub.description}
        </Text>
        <Text style={[
          sg.chapters,
          {
            color: colors.mutedForeground,
            fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
          }
        ]}>
          {sub.chapterCount} chapter{sub.chapterCount !== 1 ? "s" : ""}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.accent} />
    </TouchableOpacity>
  );
}

function SubjectGroup({ title, subjects }: { title: string; subjects: ApiSubject[] }) {
  const colors = useColors();
  return (
    <View style={sg.group}>
      <Text style={[
        sg.groupTitle,
        {
          color: colors.text,
          fontFamily: isWeb ? "'Playfair Display', serif" : "System",
          fontWeight: "700" as any,
        }
      ]}>
        {title}
      </Text>
      {subjects.map((sub) => <SubjectCard key={sub.id} sub={sub} />)}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, position: "relative" as any },
  header: {
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerInner: { maxWidth: 860, width: "100%" as any, alignSelf: "center" as any },
  title:      { fontSize: 28, fontWeight: "700", marginBottom: 2 },
  subtitle:   { fontSize: 13, fontWeight: "600", marginBottom: 14 },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, outlineStyle: "none" as any, borderWidth: 0 },
  body:    { maxWidth: 860, width: "100%" as any, alignSelf: "center" as any, padding: 16, gap: 8 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },
  empty:   { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14 },
});

const sg = StyleSheet.create({
  group:      { marginBottom: 8, gap: 8 },
  groupTitle: {
    fontSize: 16,
    marginBottom: 6, marginTop: 10,
    letterSpacing: 0.3,
  },
  card: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 10, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 12,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  name:     { fontSize: 15, marginBottom: 2 },
  code:     { fontSize: 11, marginBottom: 2 },
  desc:     { fontSize: 12, marginBottom: 2 },
  chapters: { fontSize: 11 },
});
