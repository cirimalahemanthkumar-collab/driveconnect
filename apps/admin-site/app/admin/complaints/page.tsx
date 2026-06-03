"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Button, Card, EmptyState, LoadingPanel, Select, StatusBadge, formatDate } from "../../../components/ui";
import { api, getApiError, isRecord, readText, unwrapList } from "../../../lib/api";

type ComplaintMessage = string | { id?: string; message?: string; body?: string; sender?: string; createdAt?: string };

type Complaint = {
  id?: string;
  _id?: string;
  complaintId?: string;
  subject?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  messages?: ComplaintMessage[];
  customer?: { name?: string };
  customerName?: string;
  school?: { name?: string };
  schoolName?: string;
};

export default function AdminComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadComplaints = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/complaints/admin/all");
      setComplaints(unwrapList<Complaint>(response.data, ["complaints"]));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load complaints."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

  async function changeStatus(complaint: Complaint, status: string) {
    const id = getComplaintId(complaint);
    if (!id) return;
    setUpdatingId(id);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/api/complaints/admin/${id}`, { status });
      setSuccess(`Complaint updated to ${status.toLowerCase().replace(/_/g, " ")}.`);
      await loadComplaints();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to update complaint."));
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <AdminShell title="Complaint management" eyebrow="Customer support" actions={<Button onClick={() => void loadComplaints()} variant="ghost">Refresh</Button>}>
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {success ? <div className="mb-4"><Alert tone="success">{success}</Alert></div> : null}
      {loading ? <LoadingPanel label="Loading complaints..." /> : (
        <div className="grid gap-4">
          {complaints.map((complaint) => {
            const id = getComplaintId(complaint);
            const messages = getMessages(complaint);
            return (
              <Card key={id}>
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <StatusBadge status={complaint.status} />
                    <h2 className="mt-3 text-xl font-black text-slate-950">{readText(complaint.subject, "Customer complaint")}</h2>
                    <p className="mt-1 text-sm text-slate-500">{readText(complaint.customer?.name ?? complaint.customerName, "Customer")} · {readText(complaint.school?.name ?? complaint.schoolName, "Marketplace issue")} · {formatDate(complaint.createdAt)}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{readText(complaint.description, "No complaint description provided.")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button onClick={() => setOpenId(openId === id ? "" : id)} variant="ghost">{openId === id ? "Hide messages" : "View messages"}</Button>
                    <Select disabled={updatingId === id} value={complaint.status ?? "OPEN"} onChange={(event) => void changeStatus(complaint, event.target.value)} className="w-auto">
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </Select>
                  </div>
                </div>
                {openId === id ? (
                  <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Complaint messages</p>
                    {messages.map((message, index) => (
                      <div key={getMessageKey(message, index)} className="rounded-lg bg-slate-50 p-3">
                        <p className="text-sm leading-6 text-slate-700">{getMessageBody(message)}</p>
                        {isRecord(message) ? <p className="mt-1 text-xs text-slate-400">{readText(message.sender, "Message")} · {formatDate(message.createdAt)}</p> : null}
                      </div>
                    ))}
                    {!messages.length ? <EmptyState>No messages attached to this complaint.</EmptyState> : null}
                  </div>
                ) : null}
              </Card>
            );
          })}
          {!complaints.length ? <Card><EmptyState>No complaints found.</EmptyState></Card> : null}
        </div>
      )}
    </AdminShell>
  );
}

function getComplaintId(complaint: Complaint) {
  return String(complaint.id ?? complaint._id ?? complaint.complaintId ?? "");
}

function getMessages(complaint: Complaint) {
  if (Array.isArray(complaint.messages) && complaint.messages.length) return complaint.messages;
  return complaint.description ? [complaint.description] : [];
}

function getMessageKey(message: ComplaintMessage, index: number) {
  return typeof message === "string" ? `${index}-${message}` : String(message.id ?? index);
}

function getMessageBody(message: ComplaintMessage) {
  return typeof message === "string" ? message : readText(message.message ?? message.body, "Empty message");
}
