import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { router } from "expo-router";

const AUTH_TOKEN_KEY = "auth_session_token";

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  college: string;
  year: string;
  role: "admin" | "student";
  profileImageUrl: string | null;
}

interface EmailLoginResult { error?: string }
interface EmailSignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  college: "CSE" | "EEE";
  year?: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  college?: string;
  year?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthLoading: boolean;
  isAdmin: boolean;
  emailLogin: (email: string, password: string) => Promise<EmailLoginResult>;
  emailSignup: (data: EmailSignupData) => Promise<EmailLoginResult>;
  updateProfile: (data: UpdateProfileData) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL as string;
    return url.endsWith("/api") || url.endsWith("/api/")
      ? url.replace(/\/+$/, "")
      : `${url.replace(/\/+$/, "")}/api`;
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  }
  return "http://localhost:5000/api";
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, value); } catch {}
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.removeItem(key); } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchUser = useCallback(async (sid?: string) => {
    try {
      const storedToken = sid ?? (await secureGet(AUTH_TOKEN_KEY));
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsAuthLoading(false);
        return;
      }

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/auth/user`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const data = await res.json();

      if (data.user) {
        const u = data.user;
        const normalized: AuthUser = {
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "User",
          email: u.email ?? null,
          college: u.college ?? "CSE",
          year: u.year ?? "1",
          role: u.role === "admin" ? "admin" : "student",
          profileImageUrl: u.profileImageUrl ?? null,
        };
        setUser(normalized);
        setToken(storedToken);
        await secureSet(AUTH_TOKEN_KEY, storedToken);
      } else {
        await secureDelete(AUTH_TOKEN_KEY);
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const emailLogin = useCallback(async (email: string, password: string): Promise<EmailLoginResult> => {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/auth/email-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: data.error ?? "Login failed. Please try again." };
      }

      if (data.token) {
        await secureSet(AUTH_TOKEN_KEY, data.token);
        setIsAuthLoading(true);
        await fetchUser(data.token);
        // Redirect based on role returned from the API login response
        const role = data.user?.role ?? "student";
        if (role === "admin") {
          router.replace("/(admin)");
        } else {
          router.replace("/(tabs)");
        }
      }
      return {};
    } catch {
      return { error: "Network error. Please check your connection." };
    }
  }, [fetchUser]);

  const emailSignup = useCallback(async (data: EmailSignupData): Promise<EmailLoginResult> => {
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/auth/email-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();

      if (!res.ok) {
        return { error: body.error ?? "Sign up failed. Please try again." };
      }

      if (body.token) {
        await secureSet(AUTH_TOKEN_KEY, body.token);
        setIsAuthLoading(true);
        await fetchUser(body.token);
        router.replace("/onboarding");
      }
      return {};
    } catch {
      return { error: "Network error. Please check your connection." };
    }
  }, [fetchUser]);

  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<{ error?: string }> => {
    try {
      const storedToken = await secureGet(AUTH_TOKEN_KEY);
      if (!storedToken) return { error: "Not logged in" };
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${storedToken}` },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) return { error: body.error ?? "Update failed" };
      const u = body.user;
      setUser({
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "User",
        email: u.email ?? null,
        college: u.college ?? "CSE",
        year: u.year ?? "1",
        role: u.role === "admin" ? "admin" : "student",
        profileImageUrl: u.profileImageUrl ?? null,
      });
      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const storedToken = await secureGet(AUTH_TOKEN_KEY);
      if (storedToken) {
        const apiBase = getApiBase();
        await fetch(`${apiBase}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${storedToken}` },
        });
      }
    } catch {
    } finally {
      await secureDelete(AUTH_TOKEN_KEY);
      setUser(null);
      setToken(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthLoading,
        isAdmin: user?.role === "admin",
        emailLogin,
        emailSignup,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
