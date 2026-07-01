import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, usePathname, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";

// ─── design tokens ────────────────────────────────────────────────────────────
const BG        = "#09090B";
const BORDER    = "rgba(255,255,255,0.08)";
const PURPLE    = "#8B5CF6";
const PURPLE_TXT= "#A78BFA";
const PURPLE_LIT= "#C4B5FD";
const MUTED     = "#6B7280";
const FG        = "#E2E8F0";
const isWeb     = Platform.OS === "web";
// ──────────────────────────────────────────────────────────────────────────────

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <Icon sf={{ default: "books.vertical", selected: "books.vertical.fill" }} />
        <Label>Library</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const NAV_ITEMS = [
  { name: "index",   route: "/(tabs)",         label: "Home",    icon: "home"      as const },
  { name: "library", route: "/(tabs)/library",  label: "Library", icon: "book-open" as const },
  { name: "profile", route: "/(tabs)/profile",  label: "Profile", icon: "user"      as const },
];

function NavItem({ item, active }: { item: typeof NAV_ITEMS[0]; active: boolean }) {
  const [hov, setHov] = useState(false);
  const lit = active || hov;

  return (
    <TouchableOpacity
      onPress={() => router.replace(item.route as any)}
      activeOpacity={0.85}
      {...(isWeb ? {
        onMouseEnter: () => setHov(true),
        onMouseLeave: () => setHov(false),
      } : {})}
      style={[
        dh.navItem,
        lit && {
          backgroundColor: active
            ? "rgba(139,92,246,0.18)"
            : "rgba(139,92,246,0.10)",
          borderColor: active
            ? "rgba(139,92,246,0.28)"
            : "rgba(139,92,246,0.14)",
          ...(isWeb ? { boxShadow: "0 0 12px rgba(139,92,246,0.14)" } : {}),
        },
        isWeb ? { transition: "all 0.25s ease" } as any : {},
      ] as any}
    >
      <Feather
        name={item.icon}
        size={15}
        color={active ? PURPLE_LIT : hov ? PURPLE_TXT : MUTED}
        style={{ marginRight: 6 }}
      />
      <Text style={[
        dh.navLabel,
        { color: active ? PURPLE_LIT : hov ? PURPLE_TXT : MUTED },
        lit && { fontFamily: "Inter_600SemiBold" },
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

function DesktopHeader() {
  const pathname = usePathname();
  const [logoHov, setLogoHov] = useState(false);

  function isActive(name: string) {
    if (name === "index") return pathname === "/" || pathname === "/index";
    return pathname.includes(name);
  }

  return (
    <View style={[
      dh.header,
      isWeb ? {
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        backgroundColor: "rgba(9,9,11,0.80)",
        borderBottomColor: "rgba(139,92,246,0.12)",
        boxShadow: "0 1px 0 rgba(139,92,246,0.07), 0 4px 24px rgba(0,0,0,0.45)",
      } as any : {
        backgroundColor: BG,
        borderBottomColor: BORDER,
      },
    ]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.replace("/(tabs)")}
        {...(isWeb ? {
          onMouseEnter: () => setLogoHov(true),
          onMouseLeave: () => setLogoHov(false),
        } : {})}
        style={dh.left}
      >
        <View style={[
          dh.logoBox,
          logoHov && isWeb && {
            backgroundColor: "rgba(139,92,246,0.22)",
            boxShadow: "0 0 16px rgba(139,92,246,0.38)",
          } as any,
          isWeb ? { transition: "all 0.25s ease" } as any : {},
        ]}>
          <Feather name="book-open" size={18} color={logoHov ? PURPLE_LIT : PURPLE_TXT} />
        </View>
        <Text style={[dh.brandText, logoHov && { color: PURPLE_LIT }]}>StudyMate</Text>
      </TouchableOpacity>

      <View style={dh.navItems}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.name} item={item} active={isActive(item.name)} />
        ))}
      </View>
    </View>
  );
}

function ClassicTabLayout() {
  const colors    = useColors();
  const { isDark } = useApp();
  const isIOS     = Platform.OS === "ios";
  const isDesktop = useIsDesktop();

  return (
    <View style={{ flex: 1, flexDirection: "column", backgroundColor: BG }}>
      {isDesktop && <DesktopHeader />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor:   PURPLE_TXT,
            tabBarInactiveTintColor: MUTED,
            headerShown: false,
            tabBarStyle: isDesktop
              ? { display: "none" }
              : {
                  position: "absolute",
                  backgroundColor: isIOS ? "transparent" : BG,
                  borderTopWidth: isWeb ? 1 : 0,
                  borderTopColor: BORDER,
                  elevation: 0,
                  ...(isWeb ? { height: 84 } : {}),
                },
            tabBarBackground: () =>
              isDesktop ? null
              : isIOS ? (
                <BlurView
                  intensity={100}
                  tint={isDark ? "dark" : "systemChromeMaterialDark"}
                  style={StyleSheet.absoluteFill}
                />
              ) : isWeb ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
              ) : null,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) =>
                isIOS
                  ? <SymbolView name="house" tintColor={color} size={24} />
                  : <Feather name="home" size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="library"
            options={{
              title: "Library",
              tabBarIcon: ({ color }) =>
                isIOS
                  ? <SymbolView name="books.vertical" tintColor={color} size={24} />
                  : <Feather name="book-open" size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color }) =>
                isIOS
                  ? <SymbolView name="person.circle" tintColor={color} size={24} />
                  : <Feather name="user" size={22} color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

const dh = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 40, paddingVertical: 16, borderBottomWidth: 1,
  },
  left:  { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  brandText: { color: FG, fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  navItems:  { flexDirection: "row", alignItems: "center", gap: 4 },
  navItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: "transparent",
  },
  navLabel: { fontSize: 14, fontFamily: "Inter_400Regular", letterSpacing: 0.2 },
});
