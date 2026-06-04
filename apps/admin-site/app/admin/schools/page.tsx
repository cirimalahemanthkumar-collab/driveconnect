"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LoadingPanel,
  StatusBadge,
  formatDate,
} from "../../../components/ui";
import { api, getApiError, unwrapList } from "../../../lib/api";

type School = {
  id?: string;
  _id?: string;
  schoolId?: string;
  school_id?: string;

  name?: string;
  school_name?: string;
  schoolName?: string;
  title?: string;

  city?: string;
  state?: string;
  phone?: string;
  email?: string;

  status?: string;
  verificationStatus?: string;
  verification_status?: string;

  createdAt?: string;
  created_at?: string;
  joined_at?: string;

  owner?: {
    name?: string;
    full_name?: string;
    email?: string;
    mobile?: string;
    phone?: string;
  };

  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  partner_name?: string;
  partner_email?: string;

  [key: string]: unknown;
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
      const response = await api.get("/api/admin/schools", {
        params: filter === "PENDING" ? { status: "PENDING" } : undefined,
      });

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

  async function changeStatus(
    school: School,
    status: "APPROVED" | "REJECTED" | "SUSPENDED"
  ) {
    const id = getSchoolId(school);

    if (!id) return;

    setUpdatingId(id);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/api/admin/schools/${id}/status`, { status });

      setSuccess(`${getSchoolName(school)} updated to ${status.toLowerCase()}.`);

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
      actions={
        <Button onClick={() => void loadSchools()} variant="ghost">
          Refresh
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          onClick={() => setFilter("ALL")}
          variant={filter === "ALL" ? "dark" : "ghost"}
        >
          All schools
        </Button>

        <Button
          onClick={() => setFilter("PENDING")}
          variant={filter === "PENDING" ? "dark" : "ghost"}
        >
          Pending review
        </Button>
      </div>

      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {success ? (
        <div className="mb-4">
          <Alert tone="success">{success}</Alert>
        </div>
      ) : null}

      {loading ? (
        <LoadingPanel label="Loading schools..." />
      ) : (
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
                    <tr key={id || getSchoolName(school)} className="hover:bg-blue-50/50">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">
                          {getSchoolName(school)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {getSchoolLocation(school)} · {getSchoolPhone(school)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {getOwnerName(school)}
                        </p>

                        <p className="text-xs text-slate-500">
                          {getOwnerContact(school)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={getSchoolStatus(school)} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(getCreatedAt(school))}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={busy}
                            onClick={() => void changeStatus(school, "APPROVED")}
                            variant="primary"
                            className="min-h-8 px-3 py-1 text-xs"
                          >
                            Approve
                          </Button>

                          <Button
                            disabled={busy}
                            onClick={() => void changeStatus(school, "REJECTED")}
                            variant="ghost"
                            className="min-h-8 px-3 py-1 text-xs"
                          >
                            Reject
                          </Button>

                          <Button
                            disabled={busy}
                            onClick={() => void changeStatus(school, "SUSPENDED")}
                            variant="danger"
                            className="min-h-8 px-3 py-1 text-xs"
                          >
                            Suspend
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!schools.length ? (
            <EmptyState>No schools found for this filter.</EmptyState>
          ) : null}
        </Card>
      )}
    </AdminShell>
  );
}

function getSchoolId(school: School) {
  return cleanValue(
    school.id ??
      school._id ??
      school.schoolId ??
      school.school_id
  );
}

function getSchoolName(school: School) {
  const name = cleanValue(
    school.school_name ??
      school.schoolName ??
      school.name ??
      school.title
  );

  return name || "Unnamed school";
}

function getSchoolLocation(school: School) {
  const city = cleanValue(school.city);
  const state = cleanValue(school.state);

  const location = [city, state].filter(Boolean).join(", ");

  return location || "-";
}

function getSchoolPhone(school: School) {
  return cleanValue(school.phone) || "-";
}

function getSchoolStatus(school: School) {
  return (
    cleanValue(
      school.status ??
        school.verification_status ??
        school.verificationStatus
    ) || "PENDING"
  );
}

function getCreatedAt(school: School) {
  return cleanValue(
    school.createdAt ??
      school.created_at ??
      school.joined_at
  );
}

function getOwnerName(school: School) {
  return (
    cleanValue(
      school.owner?.full_name ??
        school.owner?.name ??
        school.owner_name ??
        school.partner_name
    ) || "-"
  );
}

function getOwnerContact(school: School) {
  return (
    cleanValue(
      school.owner?.email ??
        school.owner_email ??
        school.partner_email ??
        school.email ??
        school.owner?.mobile ??
        school.owner?.phone ??
        school.owner_phone
    ) || "-"
  );
}

function cleanValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const result = String(value).trim();

  if (!result || result === "-") return "";

  return result;
}