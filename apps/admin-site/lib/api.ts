"use client";

import axios from "axios";

export const API_TOKEN_KEY = "driveconnect_admin_jwt";
export const API_NOTICE_KEY = "driveconnect_admin_notice";

export const apiBaseUrl = process.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = window.localStorage.getItem(API_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiError(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (typeof payload === "string" && payload.trim()) return payload;
    if (isRecord(payload)) {
      if (typeof payload.message === "string") return payload.message;
      if (typeof payload.error === "string") return payload.error;
    }
    if (error.message) return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

export function unwrapPayload<T>(payload: unknown): T {
  if (isRecord(payload) && "data" in payload) {
    return unwrapPayload<T>(payload.data);
  }

  return payload as T;
}

export function unwrapList<T>(payload: unknown, preferredKeys: string[] = []): T[] {
  const value = unwrapPayload<unknown>(payload);
  if (Array.isArray(value)) return value as T[];
  if (!isRecord(value)) return [];

  const keys = [...preferredKeys, "items", "results", "rows", "list"];
  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key] as T[];
  }

  return [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function readText(value: unknown, fallback = "-") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

