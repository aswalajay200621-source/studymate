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
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { COLLEGES } from "@/data/content";
import { useApiSubjects, type ApiSubject } from "@/hooks/useApiSubjects";

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedCollege } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
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
      <View
        style={[
          s.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[s.title, { color: colors.foreground }]}>Library</Text>
        <Text style={[s.subtitle, { color: college.color }]}>
          {college.fullName}
        </Text>
        <View
          style={[
            s.searchRow,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[s.searchInput, { color: colors.foreground }]}
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

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.body, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {sem1.length > 0 && (
            <SubjectGroup
              title="Semester 1"
              subjects={sem1}
              colors={colors}
            />
          )}
          {sem2.length > 0 && (
            <SubjectGroup
              title="Semester 2"
              subjects={sem2}
              colors={colors}
            />
          )}
          {filtered.length === 0 && (
            <View style={s.empty}>
              <Feather name="search" size={36} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                No subjects found
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SubjectGroup({
  title,
  subjects,
  colors,
}: {
  title: string;
  subjects: ApiSubject[];
  colors: any;
}) {
  return (
    <View style={sg.group}>
      <Text style={[sg.groupTitle, { color: colors.foreground }]}>{title}</Text>
      {subjects.map((sub) => (
          <TouchableOpacity
            key={sub.id}
            onPress={() => router.push(`/subject/${sub.id}`)}
            activeOpacity={0.85}
            style={[
              sg.card,
              {
                backgroundColor: colors.card,
                borderColor: sub.color + "33",
              },
            ]}
          >
            <View style={[sg.iconWrap, { backgroundColor: sub.color + "15" }]}>
              {/^[a-z][a-z0-9-]*$/.test(sub.icon)
                ? <Ionicons name={sub.icon as any} size={22} color={sub.color} />
                : <Text style={{ fontSize: 22 }}>{sub.icon}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sg.name, { color: colors.foreground }]}>
                {sub.name}
              </Text>
              <Text style={[sg.code, { color: sub.color }]}>{sub.code}</Text>
              <Text style={[sg.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
                {sub.description}
              </Text>
              <Text style={[sg.chapters, { color: colors.mutedForeground }]}>
                {sub.chapterCount} chapter{sub.chapterCount !== 1 ? "s" : ""}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  body: { maxWidth: 860, width: "100%", alignSelf: "center",
    padding: 16,
    gap: 8,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});

const sg = StyleSheet.create({
  group: { marginBottom: 8, gap: 10 },
  groupTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
    marginTop: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  freeBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  freeBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  code: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  chapters: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
