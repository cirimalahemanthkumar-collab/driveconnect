"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, StatusBadge } from "./ui";
import { ErrorBanner, FormError, LoadingState, PageIntro } from "./portal-ui";
import { useApiResource } from "../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import { asList, asRecord, dateText, text, type ApiRecord } from "../lib/records";

type NotificationsPageProps = {
  endpoint: string;
  title: string;
  description: string;
  eyebrow?: string;
};

export function NotificationsPage({
  endpoint,
  title,
  description,
  eyebrow = "Inbox"
}: NotificationsPageProps) {
  const resource = useApiResource<unknown>(endpoint, []);
  const notifications = asList(resource.data, ["notifications", "items"]);
  const unreadCount = notifications.filter((notification) => !isRead(notification)).length;
  const [actionError, setActionError] = useState("");
  const [updating, setUpdating] = useState(false);

  async function markRead(id: string) {
    setUpdating(true);
    setActionError("");
    try {
      await apiRequest({ url: `${endpoint}/${id}/read`, method: "PATCH" });
      await resource.reload();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to update notification."));
    } finally {
      setUpdating(false);
    }
  }

  async function markAllRead() {
    setUpdating(true);
    setActionError("");
    try {
      await apiRequest({ url: `${endpoint}/read-all`, method: "PATCH" });
      await resource.reload();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to update notifications."));
    } finally {
      setUpdating(false);
    }
  }

  if (resource.loading) return <LoadingState label="Loading notifications..." />;

  return (
    <div>
      <PageIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => void resource.reload()}>Refresh</Button>
            <Button variant="ghost" disabled={updating || unreadCount === 0} onClick={() => void markAllRead()}>
              Mark all read
            </Button>
          </div>
        }
      />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      <FormError message={actionError} />

      <div className="mt-6 grid gap-4">
        {notifications.map((notification, index) => {
          const id = text(notification, "id", "_id");
          const actionLink = readActionLink(notification);

          return (
            <Card key={`${id}-${index}`} className={isRead(notification) ? "bg-white/90" : "bg-blue-50/70 ring-blue-100"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-slate-950">{text(notification, "title", "type")}</h3>
                    <StatusBadge status={isRead(notification) ? "READ" : "NEW"} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text(notification, "message", "body")}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-400">{dateText(text(notification, "created_at", "createdAt"))}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {actionLink ? (
                    <Link className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50" href={actionLink}>
                      Open
                    </Link>
                  ) : null}
                  {!isRead(notification) && id !== "-" ? (
                    <Button variant="ghost" disabled={updating} onClick={() => void markRead(id)}>Mark read</Button>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!notifications.length ? (
        <Card className="mt-6">
          <p className="text-sm font-semibold text-slate-500">No notifications yet.</p>
        </Card>
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
