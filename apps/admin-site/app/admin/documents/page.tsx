"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Button, Card, EmptyState, LoadingPanel, StatusBadge, formatDate } from "../../../components/ui";
import { api, getApiError, readText, unwrapList } from "../../../lib/api";

type SchoolDocument = {
  id?: string;
  _id?: string;
  documentId?: string;
  type?: string;
  documentType?: string;
  fileName?: string;
  url?: string;
  documentUrl?: string;
  status?: string;
  createdAt?: string;
  uploadedAt?: string;
  school?: { name?: string };
  schoolName?: string;
};

type Filter = "ALL" | "PENDING";

export default function AdminDocumentsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/documents/admin/school", { params: filter === "PENDING" ? { status: "PENDING" } : undefined });
      setDocuments(unwrapList<SchoolDocument>(response.data, ["documents"]));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load school documents."));
    } finally {
      setLoading(false);
    }
  }, [filter, user]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function changeStatus(document: SchoolDocument, status: "APPROVED" | "REJECTED") {
    const id = getDocumentId(document);
    if (!id) return;
    setUpdatingId(id);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/api/documents/admin/school/${id}/status`, { status });
      setSuccess(`Document ${status.toLowerCase()} successfully.`);
      await loadDocuments();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to update document status."));
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <AdminShell
      title="Document verification"
      eyebrow="Partner compliance"
      actions={<Button onClick={() => void loadDocuments()} variant="ghost">Refresh</Button>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={() => setFilter("ALL")} variant={filter === "ALL" ? "dark" : "ghost"}>All documents</Button>
        <Button onClick={() => setFilter("PENDING")} variant={filter === "PENDING" ? "dark" : "ghost"}>Pending review</Button>
      </div>
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {success ? <div className="mb-4"><Alert tone="success">{success}</Alert></div> : null}
      {loading ? <LoadingPanel label="Loading partner documents..." /> : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-indigo-800 to-blue-600 text-white">
                <tr>
                  <th className="px-5 py-4">Document</th>
                  <th className="px-5 py-4">School</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Uploaded</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((document) => {
                  const id = getDocumentId(document);
                  const documentUrl = document.url ?? document.documentUrl;
                  return (
                    <tr key={id} className="hover:bg-indigo-50/50">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">{readText(document.type ?? document.documentType, "School document")}</p>
                        <p className="mt-1 text-xs text-slate-500">{readText(document.fileName, id)}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold">{readText(document.school?.name ?? document.schoolName)}</td>
                      <td className="px-5 py-4"><StatusBadge status={document.status} /></td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(document.uploadedAt ?? document.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {documentUrl ? <a href={documentUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center rounded-lg bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100">View</a> : null}
                          <Button disabled={updatingId === id} onClick={() => void changeStatus(document, "APPROVED")} className="min-h-8 px-3 py-1 text-xs">Approve</Button>
                          <Button disabled={updatingId === id} onClick={() => void changeStatus(document, "REJECTED")} variant="danger" className="min-h-8 px-3 py-1 text-xs">Reject</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!documents.length ? <EmptyState>No documents found for this filter.</EmptyState> : null}
        </Card>
      )}
    </AdminShell>
  );
}

function getDocumentId(document: SchoolDocument) {
  return String(document.id ?? document._id ?? document.documentId ?? "");
}

