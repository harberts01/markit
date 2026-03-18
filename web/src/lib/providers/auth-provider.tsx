"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api, setAccessToken } from "../api";

export type UserRole = "customer" | "vendor" | "market_manager";

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  managedMarkets: Array<{ id: string; name: string; slug: string }>;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to restore session on mount
  useEffect(() => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    api<{ data: { accessToken: string; refreshToken: string } }>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      }
    )
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        return api<{ data: User }>("/users/me");
      })
      .then(({ data }) => {
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("refreshToken");
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api<{
      data: { accessToken: string; refreshToken: string; user: User };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });

    setAccessToken(data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
        skipAuth: true,
      });
      // Auto-login after registration
      await login(username, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await api("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
