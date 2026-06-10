"use client";

import { useState } from "react";
import Link from "next/link";
import { useApiResource } from "../hooks/use-api-resource";
import { asList, asRecord, dateText, text, type ApiRecord } from "../lib/records";

type NotificationBellProps = {
  endpoint: string;
  href: string;
};

export function NotificationBell({ endpoint, href }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const resource = useApiResource<unknown>(endpoint, []);
  const notifications = asList(resource.data, ["notifications", "items"]);
  const unreadCount = notifications.filter((notification) => !isRead(notification)).length;
  const recent = notifications.slice(0, 5);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        className="focus-ring relative inline-flex size-11 items-center justify-center rounded-lg bg-white/90 text-slate-800 shadow-sm ring-1 ring-white/70 transition hover:bg-white"
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
            <Link className="text-xs font-bold text-blue-700 hover:text-blue-900" href={href} onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {resource.loading ? <p className="px-4 py-5 text-sm font-semibold text-slate-500">Loading...</p> : null}
            {!resource.loading && recent.map((notification, index) => (
              <Link
                key={`${text(notification, "id", "_id")}-${index}`}
                className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${isRead(notification) ? "bg-white" : "bg-blue-50/60"}`}
                href={readActionLink(notification) || href}
                onClick={() => setOpen(false)}
              >
                <p className="text-sm font-black text-slate-950">{text(notification, "title", "type")}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{text(notification, "message", "body")}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{dateText(text(notification, "created_at", "createdAt"))}</p>
              </Link>
            ))}
            {!resource.loading && !recent.length ? (
              <p className="px-4 py-5 text-sm font-semibold text-slate-500">No notifications yet.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isRead(notification: ApiRecord) {
  return Boolean(notification.is_read ?? notification.isRead ?? notification.read);
}

function readActionLink(notification: ApiRecord) {
  const data = asRecord(notification.data);
  const value = text(data, "actionLink", "action_link", "href");
  return value === "-" ? "" : value;
}
