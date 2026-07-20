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

const isWeb = Platform.OS === "web";

const NAV_ITEMS = [
  { name: "index",    route: "/(tabs)",          label: "Home",     icon: "home"      as const },
  { name: "courses",  route: "/(tabs)/courses",  label: "Courses",  icon: "book-open" as const },
  { name: "planner",  route: "/(tabs)/planner",  label: "Planner",  icon: "calendar"  as const },
  { name: "profile",  route: "/(tabs)/profile",   label: "Profile",  icon: "user"      as const },
];

// Custom CSS Injector for Web (to import fonts and support hover styles)
function InjectWebLayoutStyles() {
  if (!isWeb) return null;
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  `;
  return React.createElement("style", { dangerouslySetInnerHTML: { __html: css } });
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="courses">
        <Icon sf={{ default: "books.vertical", selected: "books.vertical.fill" }} />
        <Label>Courses</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="planner">
        <Icon sf={{ default: "calendar", selected: "calendar.fill" }} />
        <Label>Planner</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function NavItem({ item, active }: { item: typeof NAV_ITEMS[0]; active: boolean }) {
  const colors = useColors();
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
        { borderColor: "transparent" },
        lit && {
          backgroundColor: active ? colors.secondary : "rgba(184, 147, 90, 0.08)",
          borderColor: active ? colors.border : "rgba(184, 147, 90, 0.15)",
          ...(isWeb ? { boxShadow: "0 2px 8px rgba(0,0,0,0.05)" } : {}),
        },
        isWeb ? { transition: "all 0.25s ease" } as any : {},
      ] as any}
    >
      <Feather
        name={item.icon}
        size={15}
        color={active ? colors.text : hov ? colors.accent : colors.mutedForeground}
        style={{ marginRight: 6 }}
      />
      <Text style={[
        dh.navLabel,
        {
          color: active ? colors.text : hov ? colors.accent : colors.mutedForeground,
          fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System",
        },
        active && { fontWeight: "600" },
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

function DesktopHeader() {
  const colors = useColors();
  const { isDark, toggleTheme } = useApp();
  const pathname = usePathname();
  const [logoHov, setLogoHov] = useState(false);

  function isActive(name: string) {
    if (name === "index") return pathname === "/" || pathname === "/index";
    return pathname.includes(name);
  }

  return (
    <View style={[
      dh.header,
      {
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
      },
      isWeb ? {
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 1px 0 " + colors.border + ", 0 4px 20px rgba(0,0,0,0.04)",
      } as any : {},
    ]}>
      <InjectWebLayoutStyles />
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
          {
            backgroundColor: logoHov ? colors.accent : colors.primary,
            borderColor: colors.border,
            borderWidth: 1,
          },
          isWeb ? { transition: "all 0.25s ease" } as any : {},
        ]}>
          <Feather name="book-open" size={17} color={logoHov ? colors.primaryForeground : colors.accent} />
        </View>
        <Text style={[
          dh.brandText,
          {
            color: colors.text,
            fontFamily: isWeb ? "'Playfair Display', serif" : "System",
            fontWeight: "700" as any,
          }
        ]}>
          StudyMate
        </Text>
      </TouchableOpacity>

      <View style={dh.rightContainer}>
        {/* Navigation Items */}
        <View style={dh.navItems}>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.name} item={item} active={isActive(item.name)} />
          ))}
        </View>

        {/* Theme Toggle Option */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[
            dh.themeToggle,
            { backgroundColor: colors.secondary, borderColor: colors.border }
          ]}
          activeOpacity={0.8}
        >
          <Feather name={isDark ? "sun" : "moon"} size={14} color={colors.text} />
          <Text style={[
            dh.themeToggleText,
            { color: colors.text, fontFamily: isWeb ? "'IBM Plex Sans', sans-serif" : "System" }
          ]}>
            {isDark ? "Light" : "Dark"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { isDark } = useApp();
  const isIOS = Platform.OS === "ios";
  const isDesktop = useIsDesktop();

  return (
    <View style={{ flex: 1, flexDirection: "column", backgroundColor: colors.background }}>
      {isDesktop && <DesktopHeader />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.text,
            tabBarInactiveTintColor: colors.mutedForeground,
            headerShown: false,
            tabBarStyle: isDesktop
              ? { display: "none" }
              : {
                  position: "absolute",
                  backgroundColor: isIOS ? "transparent" : colors.card,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  elevation: 0,
                  ...(isWeb ? { height: 84 } : {}),
                },
            tabBarBackground: () =>
              isDesktop ? null
              : isIOS ? (
                <BlurView
                  intensity={100}
                  tint={isDark ? "dark" : "light"}
                  style={StyleSheet.absoluteFill}
                />
              ) : isWeb ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
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
            name="courses"
            options={{
              title: "Courses",
              tabBarIcon: ({ color }) =>
                isIOS
                  ? <SymbolView name="books.vertical" tintColor={color} size={24} />
                  : <Feather name="book-open" size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="planner"
            options={{
              title: "Planner",
              tabBarIcon: ({ color }) =>
                isIOS
                  ? <SymbolView name="calendar" tintColor={color} size={24} />
                  : <Feather name="calendar" size={22} color={color} />,
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
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  brandText: { fontSize: 18, letterSpacing: 0.3 },
  rightContainer: { flexDirection: "row", alignItems: "center", gap: 16 },
  navItems:  { flexDirection: "row", alignItems: "center", gap: 4 },
  navItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1,
  },
  navLabel: { fontSize: 14, letterSpacing: 0.2 },
  themeToggle: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1,
  },
  themeToggleText: { fontSize: 13, fontWeight: "600" },
});
