"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Badge, Button, Card, EmptyState, Input, LoadingPanel, Select, Textarea, formatDate } from "../../../components/ui";
import { api, getApiError, readText, unwrapList } from "../../../lib/api";

type Notification = {
  id?: string;
  _id?: string;
  title?: string;
  body?: string;
  message?: string;
  type?: string;
  is_read?: boolean;
  isRead?: boolean;
  read?: boolean;
  created_at?: string;
  createdAt?: string;
  data?: Record<string, unknown>;
};

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/notifications");
      setNotifications(unwrapList<Notification>(response.data, ["notifications"]));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load notifications."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/notifications/admin/send", { title, body, role });
      setTitle("");
      setBody("");
      setRole("ALL");
      setSuccess("Notification sent successfully.");
      await loadNotifications();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to send notification."));
    } finally {
      setSending(false);
    }
  }

  async function markRead(notificationId: string) {
    setUpdating(true);
    setError("");
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      await loadNotifications();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to update notification."));
    } finally {
      setUpdating(false);
    }
  }

  async function markAllRead() {
    setUpdating(true);
    setError("");
    try {
      await api.patch("/api/notifications/read-all");
      await loadNotifications();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to update notifications."));
    } finally {
      setUpdating(false);
    }
  }

  return (
    <AdminShell
      title="Notifications"
      eyebrow="Platform communication"
      actions={
        <>
          <Button onClick={() => void loadNotifications()} variant="ghost">Refresh inbox</Button>
          <Button onClick={() => void markAllRead()} variant="ghost" disabled={updating || notifications.every(isRead)}>Mark all read</Button>
        </>
      }
    >
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {success ? <div className="mb-4"><Alert tone="success">{success}</Alert></div> : null}
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-700">Admin broadcast</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Send notification</h2>
          <form className="mt-5 grid gap-4" onSubmit={sendNotification}>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Audience
              <Select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="ALL">All users</option>
                <option value="CUSTOMER">Customers</option>
                <option value="SCHOOL_OWNER">School owners</option>
                <option value="ADMIN">Admin team</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Title
              <Input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Notification title" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Message
              <Textarea required rows={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a clear platform update..." />
            </label>
            <Button type="submit" disabled={sending}>{sending ? "Sending..." : "Send notification"}</Button>
          </form>
        </Card>
        <Card>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">My notifications</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Admin inbox</h2>
          <div className="mt-5 grid gap-3">
            {loading ? <LoadingPanel label="Loading notifications..." /> : null}
            {!loading ? notifications.map((notification, index) => {
              const notificationId = String(notification.id ?? notification._id ?? "");
              return (
              <div key={String(notification.id ?? notification._id ?? index)} className={`rounded-lg p-4 ring-1 ${isRead(notification) ? "bg-slate-50 ring-slate-100" : "bg-blue-50 ring-blue-100"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-slate-950">{readText(notification.title, "Platform notification")}</p>
                  <Badge tone={isRead(notification) ? "slate" : "blue"}>{isRead(notification) ? "Read" : "New"}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{readText(notification.body ?? notification.message, "No message text.")}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">{formatDate(notification.created_at ?? notification.createdAt)}</p>
                  {!isRead(notification) && notificationId ? (
                    <Button variant="ghost" disabled={updating} onClick={() => void markRead(notificationId)}>Mark read</Button>
                  ) : null}
                </div>
              </div>
              );
            }) : null}
            {!loading && !notifications.length ? <EmptyState>No notifications yet.</EmptyState> : null}
          </div>
        </Card>
      </section>
    </AdminShell>
  );
}

function isRead(notification: Notification) {
  return Boolean(notification.is_read ?? notification.isRead ?? notification.read);
}
