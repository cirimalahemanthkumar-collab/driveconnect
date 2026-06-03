"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Button, Card, EmptyState, LoadingPanel, StatusBadge, formatDate } from "../../../components/ui";
import { api, getApiError, readText, unwrapList } from "../../../lib/api";

type School = {
  id?: string;
  _id?: string;
  schoolId?: string;
  name?: string;
  city?: string;
  email?: string;
  phone?: string;
  status?: string;
  verificationStatus?: string;
  createdAt?: string;
  owner?: { name?: string; email?: string; mobile?: string };
};

type Filter = "ALL" | "PENDING";

export default function AdminSchoolsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSchools = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/admin/schools", { params: filter === "PENDING" ? { status: "PENDING" } : undefined });
      setSchools(unwrapList<School>(response.data, ["schools"]));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load schools."));
    } finally {
      setLoading(false);
    }
  }, [filter, user]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  async function changeStatus(school: School, status: "APPROVED" | "REJECTED" | "SUSPENDED") {
    const id = getSchoolId(school);
    if (!id) return;
    setUpdatingId(id);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/api/admin/schools/${id}/status`, { status });
      setSuccess(`${readText(school.name, "School")} updated to ${status.toLowerCase()}.`);
      await loadSchools();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to update school status."));
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <AdminShell
      title="School management"
      eyebrow="Partner operations"
      actions={<Button onClick={() => void loadSchools()} variant="ghost">Refresh</Button>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={() => setFilter("ALL")} variant={filter === "ALL" ? "dark" : "ghost"}>All schools</Button>
        <Button onClick={() => setFilter("PENDING")} variant={filter === "PENDING" ? "dark" : "ghost"}>Pending review</Button>
      </div>
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {success ? <div className="mb-4"><Alert tone="success">{success}</Alert></div> : null}
      {loading ? <LoadingPanel label="Loading schools..." /> : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-slate-950 to-indigo-800 text-white">
                <tr>
                  <th className="px-5 py-4">School</th>
                  <th className="px-5 py-4">Owner</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((school) => {
                  const id = getSchoolId(school);
                  const busy = updatingId === id;
                  return (
                    <tr key={id} className="hover:bg-blue-50/50">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">{readText(school.name, "Unnamed school")}</p>
                        <p className="mt-1 text-xs text-slate-500">{readText(school.city)} · {readText(school.phone)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{readText(school.owner?.name)}</p>
                        <p className="text-xs text-slate-500">{readText(school.owner?.email ?? school.owner?.mobile ?? school.email)}</p>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={school.status ?? school.verificationStatus} /></td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(school.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button disabled={busy} onClick={() => void changeStatus(school, "APPROVED")} variant="primary" className="min-h-8 px-3 py-1 text-xs">Approve</Button>
                          <Button disabled={busy} onClick={() => void changeStatus(school, "REJECTED")} variant="ghost" className="min-h-8 px-3 py-1 text-xs">Reject</Button>
                          <Button disabled={busy} onClick={() => void changeStatus(school, "SUSPENDED")} variant="danger" className="min-h-8 px-3 py-1 text-xs">Suspend</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!schools.length ? <EmptyState>No schools found for this filter.</EmptyState> : null}
        </Card>
      )}
    </AdminShell>
  );
}

function getSchoolId(school: School) {
  return String(school.id ?? school._id ?? school.schoolId ?? "");
}

