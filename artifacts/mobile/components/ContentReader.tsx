import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { ContentBlock } from "@/data/content";

interface Props {
  blocks: ContentBlock[];
}

function highlight(text: string, query: string, highlightColor: string) {
  if (!query.trim()) return <Text>{text}</Text>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let idx = lower.indexOf(q, cursor);
  while (idx !== -1) {
    if (idx > cursor) parts.push(<Text key={`t${cursor}`}>{text.slice(cursor, idx)}</Text>);
    parts.push(
      <Text key={`h${idx}`} style={{ backgroundColor: highlightColor, borderRadius: 2 }}>
        {text.slice(idx, idx + q.length)}
      </Text>
    );
    cursor = idx + q.length;
    idx = lower.indexOf(q, cursor);
  }
  if (cursor < text.length) parts.push(<Text key={`t${cursor}`}>{text.slice(cursor)}</Text>);
  return <>{parts}</>;
}

function blockMatchesQuery(block: ContentBlock, q: string): boolean {
  const lq = q.toLowerCase();
  switch (block.type) {
    case "heading":
      return block.text.toLowerCase().includes(lq);
    case "paragraph":
      return block.text.toLowerCase().includes(lq);
    case "list":
    case "numbered":
      return block.items.some((i) => i.toLowerCase().includes(lq));
    case "code":
      return block.code.toLowerCase().includes(lq);
    case "tip":
      return block.text.toLowerCase().includes(lq);
    case "definition":
      return (
        block.term.toLowerCase().includes(lq) ||
        block.definition.toLowerCase().includes(lq)
      );
  }
}

export default function ContentReader({ blocks }: Props) {
  const colors = useColors();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return blocks;
    return blocks.filter((b) => blockMatchesQuery(b, query));
  }, [blocks, query]);

  const s = styles(colors);

  function renderBlock(block: ContentBlock, idx: number) {
    const q = query.trim();
    switch (block.type) {
      case "heading":
        return (
          <Text
            key={idx}
            style={[
              s.heading,
              block.level === 1 && s.h1,
              block.level === 2 && s.h2,
              block.level === 3 && s.h3,
            ]}
          >
            {highlight(block.text, q, colors.warning + "66")}
          </Text>
        );
      case "paragraph":
        return (
          <Text key={idx} style={s.paragraph}>
            {highlight(block.text, q, colors.warning + "66")}
          </Text>
        );
      case "list":
        return (
          <View key={idx} style={s.listContainer}>
            {block.items.map((item, i) => (
              <View key={i} style={s.listItem}>
                <View style={[s.bullet, { backgroundColor: colors.primary }]} />
                <Text style={s.listText}>
                  {highlight(item, q, colors.warning + "66")}
                </Text>
              </View>
            ))}
          </View>
        );
      case "numbered":
        return (
          <View key={idx} style={s.listContainer}>
            {block.items.map((item, i) => (
              <View key={i} style={s.listItem}>
                <Text style={[s.numberedBullet, { color: colors.primary }]}>
                  {i + 1}.
                </Text>
                <Text style={s.listText}>
                  {highlight(item, q, colors.warning + "66")}
                </Text>
              </View>
            ))}
          </View>
        );
      case "code":
        return (
          <View key={idx} style={s.codeContainer}>
            <View style={s.codeHeader}>
              <Feather name="code" size={12} color={colors.mutedForeground} />
              <Text style={s.codeLang}>{block.language}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={s.codeText}>{block.code}</Text>
            </ScrollView>
          </View>
        );
      case "tip":
        return (
          <View key={idx} style={[s.tipContainer, { borderColor: colors.success }]}>
            <Feather name="zap" size={14} color={colors.success} />
            <Text style={[s.tipText, { color: colors.success }]}>
              {highlight(block.text, q, colors.warning + "66")}
            </Text>
          </View>
        );
      case "definition":
        return (
          <View key={idx} style={[s.defContainer, { borderColor: colors.primary + "44" }]}>
            <Text style={[s.defTerm, { color: colors.primary }]}>
              {highlight(block.term, q, colors.warning + "66")}
            </Text>
            <Text style={s.defText}>
              {highlight(block.definition, q, colors.warning + "66")}
            </Text>
          </View>
        );
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search in notes..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      {query.trim() !== "" && (
        <Text style={[s.resultCount, { color: colors.mutedForeground }]}>
          {filtered.length} section{filtered.length !== 1 ? "s" : ""} found
        </Text>
      )}
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((block, i) => renderBlock(block, i))}
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Feather name="search" size={32} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
              No results for "{query}"
            </Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginVertical: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    resultCount: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      paddingHorizontal: 20,
      marginBottom: 4,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    heading: {
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginTop: 20,
      marginBottom: 6,
    },
    h1: { fontSize: 22 },
    h2: { fontSize: 18 },
    h3: { fontSize: 16 },
    paragraph: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
    },
    listContainer: { marginBottom: 12 },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 6,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 9,
    },
    numberedBullet: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      minWidth: 20,
      marginTop: 2,
    },
    listText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    codeContainer: {
      backgroundColor: "#1A1A2E",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 16,
    },
    codeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: "#252540",
    },
    codeLang: {
      fontSize: 11,
      color: "#94A3B8",
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase",
    },
    codeText: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      lineHeight: 20,
      color: "#E2E8F0",
      padding: 14,
    },
    tipContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: "#ECFDF5",
      borderLeftWidth: 3,
      borderRadius: 8,
      padding: 12,
      marginBottom: 14,
    },
    tipText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: "Inter_400Regular",
    },
    defContainer: {
      borderLeftWidth: 3,
      paddingLeft: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    defTerm: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    defText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
  });
