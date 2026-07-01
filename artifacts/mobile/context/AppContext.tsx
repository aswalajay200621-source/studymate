import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import type { College } from "@/data/content";

interface AppContextValue {
  selectedCollege: College | null;
  isSubscribed: boolean;
  isLoading: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  selectCollege: (college: College) => Promise<void>;
  subscribe: () => Promise<void>;
  resetCollege: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const COLLEGE_KEY = "@studymate_college";
const SUBSCRIBED_KEY = "@studymate_subscribed";
const THEME_KEY = "@studymate_theme";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(Platform.OS === "web");

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== "web") {
          const [college, subscribed, theme] = await Promise.all([
            AsyncStorage.getItem(COLLEGE_KEY),
            AsyncStorage.getItem(SUBSCRIBED_KEY),
            AsyncStorage.getItem(THEME_KEY),
          ]);
          if (college === "CSE" || college === "EEE") setSelectedCollege(college);
          if (subscribed === "true") setIsSubscribed(true);
          if (theme === "dark") setIsDark(true);
        } else {
          const college = localStorage.getItem(COLLEGE_KEY);
          if (college === "CSE" || college === "EEE") setSelectedCollege(college as College);
        }
      } catch (_) {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const selectCollege = useCallback(async (college: College) => {
    if (Platform.OS !== "web") {
      await AsyncStorage.setItem(COLLEGE_KEY, college);
    } else {
      localStorage.setItem(COLLEGE_KEY, college);
    }
    setSelectedCollege(college);
  }, []);

  const subscribe = useCallback(async () => {
    if (Platform.OS !== "web") await AsyncStorage.setItem(SUBSCRIBED_KEY, "true");
    setIsSubscribed(true);
  }, []);

  const resetCollege = useCallback(async () => {
    if (Platform.OS !== "web") {
      await AsyncStorage.removeItem(COLLEGE_KEY);
    } else {
      localStorage.removeItem(COLLEGE_KEY);
    }
    setSelectedCollege(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (Platform.OS !== "web") AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{ selectedCollege, isSubscribed, isLoading, isDark, toggleTheme, selectCollege, subscribe, resetCollege }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
