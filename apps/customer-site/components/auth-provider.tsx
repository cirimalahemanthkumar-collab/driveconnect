"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiRequest, getApiErrorMessage, storageKeys } from "../lib/api";
import { API_ENDPOINTS } from "../lib/endpoints";

export type AppRole =
  | "CUSTOMER"
  | "SCHOOL_OWNER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "SUPPORT_STAFF"
  | "ACCOUNTANT"
  | string;

export type AuthUser = {
  id?: string;
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  role: AppRole;
  [key: string]: unknown;
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  name?: string;
  full_name?: string;
  email: string;
  phone: string;
  password: string;
  role: "CUSTOMER" | "SCHOOL_OWNER";
  schoolName?: string;
  school_name?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  message: string;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: (message?: string) => void;
  destinationFor: (role?: AppRole) => string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const adminSiteMessage = "Please use the Admin Site";

const forbiddenRoles = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_STAFF",
  "ACCOUNTANT",
]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem(storageKeys.token);

    if (!token) {
      setLoading(false);
      return;
    }

    void apiRequest<unknown>({ url: API_ENDPOINTS.auth.me })
      .then((payload) => {
        const currentUser = extractUser(payload);
        rejectAdminRole(currentUser);
        persistUser(currentUser);
        setUser(currentUser);
      })
      .catch((error) => {
        clearSession();
        setMessage(
          getApiErrorMessage(error, "Your session expired. Please login again.")
        );
      })
      .finally(() => setLoading(false));
  }, []);

  function logout(nextMessage = "") {
    clearSession();
    setUser(null);
    setMessage(nextMessage);

    router.replace(
      `/login${nextMessage ? `?message=${encodeURIComponent(nextMessage)}` : ""}`
    );
  }

  async function authenticate(path: string, input: LoginInput | RegisterInput) {
    setMessage("");

    let data: unknown = input;

    if (path === API_ENDPOINTS.auth.register) {
      const registerInput = input as RegisterInput;

      data = {
        full_name: (registerInput.full_name || registerInput.name || "").trim(),
        email: registerInput.email.trim().toLowerCase(),
        phone: registerInput.phone.trim(),
        password: registerInput.password,
        role: registerInput.role,
        school_name:
          registerInput.role === "SCHOOL_OWNER"
            ? (registerInput.school_name || registerInput.schoolName || "").trim()
            : undefined,
      };
    }

    const payload = await apiRequest<unknown>({
      url: path,
      method: "POST",
      data,
    });

    const nextUser = extractUser(payload);

    try {
      rejectAdminRole(nextUser);
    } catch (error) {
      logout(adminSiteMessage);
      throw error;
    }

    const token = extractToken(payload);

    window.localStorage.setItem(storageKeys.token, token);
    persistUser(nextUser);
    setUser(nextUser);

    router.replace(destinationFor(nextUser.role));

    return nextUser;
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      message,
      login: (input) => authenticate(API_ENDPOINTS.auth.login, input),
      register: (input) => authenticate(API_ENDPOINTS.auth.register, input),
      logout,
      destinationFor,
    }),
    [loading, message, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function destinationFor(role?: AppRole) {
  return role === "SCHOOL_OWNER"
    ? "/partner/dashboard"
    : "/customer/dashboard";
}

function extractToken(payload: unknown) {
  const record = payload as Record<string, unknown>;
  const token = record?.token ?? record?.accessToken ?? record?.jwt;

  if (typeof token !== "string" || !token) {
    throw new Error("The API did not return a login token.");
  }

  return token;
}

function extractUser(payload: unknown): AuthUser {
  const record = payload as Record<string, unknown>;
  const candidate = (record?.user ?? record?.account ?? payload) as Record<
    string,
    unknown
  >;

  if (!candidate || typeof candidate !== "object") {
    throw new Error("The API did not return a user account.");
  }

  const role = String(candidate.role ?? "").toUpperCase();

  if (!role) {
    throw new Error("The API did not return an account role.");
  }

  return {
    ...candidate,
    role,
  } as AuthUser;
}

function rejectAdminRole(user: AuthUser) {
  if (forbiddenRoles.has(user.role)) {
    throw new Error(adminSiteMessage);
  }

  if (!["CUSTOMER", "SCHOOL_OWNER"].includes(user.role)) {
    throw new Error(
      "This account cannot use the Customer and Partner Site."
    );
  }
}

function persistUser(user: AuthUser) {
  window.localStorage.setItem(storageKeys.user, JSON.stringify(user));
}

function clearSession() {
  window.localStorage.removeItem(storageKeys.token);
  window.localStorage.removeItem(storageKeys.user);
}