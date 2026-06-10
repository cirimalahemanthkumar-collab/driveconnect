"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, readText, unwrapList } from "../lib/api";
import { formatDate } from "./ui";

type Notification = {
  id?: string;
  _id?: string;
  title?: string;
  message?: string;
  body?: string;
  is_read?: boolean;
  isRead?: boolean;
  read?: boolean;
  created_at?: string;
  createdAt?: string;
  data?: Record<string, unknown>;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/notifications");
      setNotifications(unwrapList<Notification>(response.data, ["notifications"]));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((notification) => !isRead(notification)).length;
  const recent = notifications.slice(0, 5);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        className="focus-ring relative inline-flex size-10 items-center justify-center rounded-lg bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50"
        onClick={() => setOpen((value) => !value)}
      >
        <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[11px] font-black leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-black text-slate-950">Notifications</p>
            <Link className="text-xs font-bold text-blue-700 hover:text-blue-900" href="/admin/notifications" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? <p className="px-4 py-5 text-sm font-semibold text-slate-500">Loading...</p> : null}
            {!loading && recent.map((notification, index) => (
              <Link
                key={`${notification.id ?? notification._id ?? index}`}
                className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${isRead(notification) ? "bg-white" : "bg-blue-50/60"}`}
                href={readActionLink(notification) || "/admin/notifications"}
                onClick={() => setOpen(false)}
              >
                <p className="text-sm font-black text-slate-950">{readText(notification.title, "Platform notification")}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{readText(notification.message ?? notification.body, "No message text.")}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{formatDate(notification.created_at ?? notification.createdAt)}</p>
              </Link>
            ))}
            {!loading && !recent.length ? <p className="px-4 py-5 text-sm font-semibold text-slate-500">No notifications yet.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isRead(notification: Notification) {
  return Boolean(notification.is_read ?? notification.isRead ?? notification.read);
}

function readActionLink(notification: Notification) {
  const value = notification.data?.actionLink ?? notification.data?.action_link ?? notification.data?.href;
  return typeof value === "string" && value ? value : "";
}
