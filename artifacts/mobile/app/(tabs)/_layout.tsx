import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, usePathname, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";

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
  { name: "index", route: "/(tabs)", label: "Home", icon: "home" as const },
  { name: "library", route: "/(tabs)/library", label: "Library", icon: "book-open" as const },
  { name: "profile", route: "/(tabs)/profile", label: "Profile", icon: "user" as const },
];

function DesktopSidebar() {
  const colors = useColors();
  const pathname = usePathname();

  function isActive(name: string) {
    if (name === "index") return pathname === "/" || pathname === "/index";
    return pathname.includes(name);
  }

  return (
    <View
      style={[
        desktopStyles.sidebar,
        { backgroundColor: colors.card, borderRightColor: colors.border },
      ]}
    >
      <View style={desktopStyles.logoRow}>
        <View style={[desktopStyles.logoCircle, { backgroundColor: colors.primary }]}>
          <Feather name="book-open" size={20} color="#fff" />
        </View>
        <Text style={[desktopStyles.logoText, { color: colors.foreground }]}>
          StudyMate
        </Text>
      </View>

      <View style={desktopStyles.navSection}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.name);
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => router.replace(item.route as any)}
              activeOpacity={0.75}
              style={[
                desktopStyles.navItem,
                active && { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Feather
                name={item.icon}
                size={18}
                color={active ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  desktopStyles.navLabel,
                  { color: active ? colors.primary : colors.mutedForeground },
                  active && { fontFamily: "Inter_600SemiBold" },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[desktopStyles.footer, { borderTopColor: colors.border }]}>
        <Text style={[desktopStyles.footerText, { color: colors.mutedForeground }]}>
          Engineering Notes
        </Text>
      </View>
    </View>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { isDark } = useApp();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const isDesktop = useIsDesktop();

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {isDesktop && <DesktopSidebar />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.mutedForeground,
            headerShown: false,
            tabBarStyle: isDesktop
              ? { display: "none" }
              : {
                  position: "absolute",
                  backgroundColor: isIOS ? "transparent" : colors.background,
                  borderTopWidth: isWeb ? 1 : 0,
                  borderTopColor: colors.border,
                  elevation: 0,
                  ...(isWeb ? { height: 84 } : {}),
                },
            tabBarBackground: () =>
              isDesktop
                ? null
                : isIOS
                ? (
                  <BlurView
                    intensity={100}
                    tint={isDark ? "dark" : "light"}
                    style={StyleSheet.absoluteFill}
                  />
                ) : isWeb ? (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: colors.background },
                    ]}
                  />
                ) : null,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) =>
                isIOS ? (
                  <SymbolView name="house" tintColor={color} size={24} />
                ) : (
                  <Feather name="home" size={22} color={color} />
                ),
            }}
          />
          <Tabs.Screen
            name="library"
            options={{
              title: "Library",
              tabBarIcon: ({ color }) =>
                isIOS ? (
                  <SymbolView name="books.vertical" tintColor={color} size={24} />
                ) : (
                  <Feather name="book-open" size={22} color={color} />
                ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color }) =>
                isIOS ? (
                  <SymbolView name="person.circle" tintColor={color} size={24} />
                ) : (
                  <Feather name="user" size={22} color={color} />
                ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const desktopStyles = StyleSheet.create({
  sidebar: {
    width: 220,
    borderRightWidth: 1,
    flexDirection: "column",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  navSection: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  navLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
