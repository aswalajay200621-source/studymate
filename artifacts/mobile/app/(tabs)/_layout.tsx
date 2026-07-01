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

function NavItem({ item, active }: { item: typeof NAV_ITEMS[0]; active: boolean }) {
  const [hovered, setHovered] = useState(false);

  const isHighlit = active || hovered;

  return (
    <TouchableOpacity
      key={item.name}
      onPress={() => router.replace(item.route as any)}
      activeOpacity={0.85}
      {...(Platform.OS === "web" ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      } : {})}
      style={[
        dh.navItem,
        isHighlit && {
          backgroundColor: "rgba(124, 92, 252, 0.12)",
          ...(Platform.OS === "web" ? {
            boxShadow: "0 0 12px rgba(124, 92, 252, 0.15)",
          } : {}),
        },
        active && {
          backgroundColor: "rgba(124, 92, 252, 0.18)",
          borderWidth: 1,
          borderColor: "rgba(124, 92, 252, 0.25)",
        },
      ] as any}
    >
      <Feather
        name={item.icon}
        size={15}
        color={active ? "#C4B5FD" : hovered ? "#A78BFA" : "#6B7280"}
        style={{ marginRight: 6 }}
      />
      <Text
        style={[
          dh.navLabel,
          { color: active ? "#C4B5FD" : hovered ? "#A78BFA" : "#6B7280" },
          (active || hovered) && { fontFamily: "Inter_600SemiBold" },
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

function DesktopHeader() {
  const pathname = usePathname();
  const [logoHovered, setLogoHovered] = useState(false);

  function isActive(name: string) {
    if (name === "index") return pathname === "/" || pathname === "/index";
    return pathname.includes(name);
  }

  return (
    <View
      style={[
        dh.header,
        Platform.OS === "web" ? {
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          backgroundColor: "rgba(8, 11, 26, 0.65)",
          borderBottomColor: "rgba(124, 92, 252, 0.15)",
          boxShadow: "0 1px 0 rgba(124,92,252,0.08), 0 4px 24px rgba(0,0,0,0.35)",
        } as any : {
          backgroundColor: "#080B1A",
          borderBottomColor: "#1E2240",
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.replace("/(tabs)")}
        {...(Platform.OS === "web" ? {
          onMouseEnter: () => setLogoHovered(true),
          onMouseLeave: () => setLogoHovered(false),
        } : {})}
        style={dh.left}
      >
        <View
          style={[
            dh.logoBox,
            logoHovered && Platform.OS === "web" ? {
              backgroundColor: "rgba(124,92,252,0.25)",
              ...(Platform.OS === "web" ? {
                boxShadow: "0 0 16px rgba(124,92,252,0.4)",
              } : {}),
            } as any : {},
          ]}
        >
          <Feather name="book-open" size={18} color={logoHovered ? "#C4B5FD" : "#A78BFA"} />
        </View>
        <Text
          style={[
            dh.brandText,
            logoHovered && { color: "#C4B5FD" },
          ]}
        >
          StudyMate
        </Text>
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
  const colors = useColors();
  const { isDark } = useApp();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const isDesktop = useIsDesktop();

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      {isDesktop && <DesktopHeader />}
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

const dh = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1E1040",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    color: "#E2E8F0",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  navItems: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  navLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
  },
});
