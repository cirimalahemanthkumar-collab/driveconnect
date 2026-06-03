"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, API_NOTICE_KEY, API_TOKEN_KEY, getApiError, isRecord, unwrapPayload } from "../lib/api";

export type AdminRole = "ADMIN" | "SUPER_ADMIN" | "SUPPORT_STAFF" | "ACCOUNTANT";

export type AdminUser = {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<AdminUser>;
  logout: (notice?: string) => void;
  refreshUser: () => Promise<AdminUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const allowedRoles = new Set<AdminRole>(["ADMIN", "SUPER_ADMIN", "SUPPORT_STAFF", "ACCOUNTANT"]);
const blockedRoles = new Set(["CUSTOMER", "SCHOOL_OWNER"]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback((notice?: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(API_TOKEN_KEY);
      if (notice) window.sessionStorage.setItem(API_NOTICE_KEY, notice);
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (typeof window === "undefined" || !window.localStorage.getItem(API_TOKEN_KEY)) {
      setUser(null);
      return null;
    }

    try {
      const response = await api.get("/api/auth/me");
      const nextUser = normalizeUser(response.data);
      assertAdminRole(nextUser.role);
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      logout(getRoleMessage(error));
      throw error;
    }
  }, [logout]);

  const login = useCallback(async (input: LoginInput) => {
    try {
      const response = await api.post("/api/auth/login", input);
      const token = findToken(response.data);
      if (!token) throw new Error("Login succeeded without an access token.");

      window.localStorage.setItem(API_TOKEN_KEY, token);
      const nextUser = await refreshUser();
      if (!nextUser) throw new Error("Unable to load the signed-in admin account.");
      return nextUser;
    } catch (error) {
      window.localStorage.removeItem(API_TOKEN_KEY);
      throw new Error(getRoleMessage(error));
    }
  }, [refreshUser]);

  useEffect(() => {
    void refreshUser()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const value = useMemo(() => ({ user, loading, login, logout, refreshUser }), [loading, login, logout, refreshUser, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}

export function getStoredNotice() {
  if (typeof window === "undefined") return "";
  const notice = window.sessionStorage.getItem(API_NOTICE_KEY) ?? "";
  window.sessionStorage.removeItem(API_NOTICE_KEY);
  return notice;
}

function normalizeUser(payload: unknown): AdminUser {
  const value = unwrapPayload<unknown>(payload);
  const raw = isRecord(value) && isRecord(value.user) ? value.user : value;
  if (!isRecord(raw)) throw new Error("The current user response is invalid.");

  const role = typeof raw.role === "string" ? raw.role.toUpperCase() : "";
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? raw.fullName ?? raw.email ?? "Admin user"),
    email: typeof raw.email === "string" ? raw.email : undefined,
    mobile: typeof raw.mobile === "string" ? raw.mobile : undefined,
    role
  };
}

function findToken(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const token = payload.token ?? payload.accessToken ?? payload.jwt;
  if (typeof token === "string" && token) return token;
  return isRecord(payload.data) ? findToken(payload.data) : null;
}

function assertAdminRole(role: string) {
  if (blockedRoles.has(role)) throw new Error("Please use the Customer/Partner Site");
  if (!allowedRoles.has(role as AdminRole)) throw new Error("This account does not have access to the admin site.");
}

function getRoleMessage(error: unknown) {
  const message = getApiError(error, "Unable to sign in.");
  return message.includes("Please use the Customer/Partner Site")
    ? "Please use the Customer/Partner Site"
    : message;
}

