import { Redirect } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import type { College } from "@/data/content";

export default function Index() {
  const { selectedCollege, isLoading, selectCollege } = useApp();
  const { user, isAuthLoading } = useAuth();
  const colors = useColors();

  useEffect(() => {
    if (user?.college && !selectedCollege) {
      selectCollege(user.college as College);
    }
  }, [user, selectedCollege]);

  if (isLoading || isAuthLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === "admin") {
    return <Redirect href="/(admin)" />;
  }

  if (!selectedCollege && !user?.college) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
