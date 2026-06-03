"use client";

import axios, { type AxiosRequestConfig } from "axios";

export const storageKeys = {
  token: "driveconnect_token",
  user: "driveconnect_user"
} as const;

export const apiBaseUrl =
  process.env.VITE_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:5000";

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = window.localStorage.getItem(storageKeys.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<T | { data: T }>(config);
  const payload = response.data;

  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload as T;
}

export function getApiErrorMessage(error: unknown, fallback = "Unable to complete the request.") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? error.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}
