"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Button, Card, EmptyState, LoadingPanel, StatusBadge, Textarea, formatDate } from "../../../components/ui";
import { api, getApiError, readText, unwrapList } from "../../../lib/api";

type School = {
  id?: string;
  _id?: string;
  schoolId?: string;
  school_id?: string;
  school_name?: string;
  schoolName?: string;
  name?: string;
  title?: string;
  owner_name?: string;
  ownerName?: string;
  owner_phone?: string;
  ownerPhone?: string;
  owner_email?: string;
  ownerEmail?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  google_maps_link?: string;
  googleMapsLink?: string;
  license_number?: string;
  licenseNumber?: string;
  license_document_url?: string;
  licenseDocumentUrl?: string;
  owner_id_proof_url?: string;
  ownerIdProofUrl?: string;
  pan_number?: string;
  panNumber?: string;
  gst_number?: string | null;
  gstNumber?: string | null;
  bank_account_name?: string;
  bankAccountName?: string;
  bank_account_number?: string;
  bankAccountNumber?: string;
  ifsc?: string;
  upi_id?: string;
  upiId?: string;
  working_hours?: string;
  workingHours?: string;
  pickup_drop_available?: boolean;
  pickupDropAvailable?: boolean;
  pickupAvailable?: boolean;
  description?: string;
  status?: string;
  verification_status?: string;
  verificationStatus?: string;
  rejection_reason?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  owner?: { name?: string; email?: string; mobile?: string };
};

type Filter = "ALL" | "PENDING";
type ReviewStatus = "APPROVED" | "REJECTED" | "SUSPENDED";

export default function AdminSchoolsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [schools, setSchools] = useState<School[]>([]);
  const [expandedId, setExpandedId] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
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

  async function changeStatus(school: School, status: ReviewStatus) {
    const id = getSchoolId(school);
    if (!id) return;
    setUpdatingId(id);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/api/admin/schools/${id}/status`, {
        status,
        ...(status === "REJECTED" && rejectionReasons[id]?.trim() ? { rejection_reason: rejectionReasons[id].trim() } : {})
      });
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
                  const expanded = expandedId === id;
                  return (
                    <Fragment key={id}>
                      <tr className="hover:bg-blue-50/50">
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-950">{getSchoolName(school)}</p>
                          <p className="mt-1 text-xs text-slate-500">{readText(school.city)} - {readText(school.phone)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold">{readField(school, "owner_name", "ownerName")}</p>
                          <p className="text-xs text-slate-500">{readField(school, "owner_email", "ownerEmail")}</p>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={readField(school, "status", "verification_status", "verificationStatus")} /></td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(school.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button disabled={busy} onClick={() => setExpandedId(expanded ? "" : id)} variant="ghost" className="min-h-8 px-3 py-1 text-xs">
                              {expanded ? "Hide details" : "View details"}
                            </Button>
                            <Button disabled={busy} onClick={() => void changeStatus(school, "APPROVED")} variant="primary" className="min-h-8 px-3 py-1 text-xs">Approve</Button>
                            <Button disabled={busy} onClick={() => void changeStatus(school, "REJECTED")} variant="ghost" className="min-h-8 px-3 py-1 text-xs">Reject</Button>
                            <Button disabled={busy} onClick={() => void changeStatus(school, "SUSPENDED")} variant="danger" className="min-h-8 px-3 py-1 text-xs">Suspend</Button>
                          </div>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr key={`${id}-details`}>
                          <td colSpan={5} className="bg-slate-50 px-5 py-5">
                            <SchoolDetails
                              school={school}
                              rejectionReason={rejectionReasons[id] ?? ""}
                              onRejectionReasonChange={(value) => setRejectionReasons({ ...rejectionReasons, [id]: value })}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
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

function SchoolDetails({
  school,
  rejectionReason,
  onRejectionReasonChange
}: {
  school: School;
  rejectionReason: string;
  onRejectionReasonChange: (value: string) => void;
}) {
  const details = buildDetails(school);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {details.map((item) => (
          <div key={item.label} className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <dt className="text-xs font-bold uppercase text-slate-500">{item.label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
              {item.href ? <a href={item.href} target="_blank" rel="noreferrer" className="text-blue-700 underline">{item.value}</a> : item.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase text-slate-500">Rejection reason</p>
        <Textarea
          className="mt-3 min-h-28"
          value={rejectionReason}
          onChange={(event) => onRejectionReasonChange(event.target.value)}
        />
        {readField(school, "rejection_reason", "rejectionReason") !== "-" ? (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 ring-1 ring-red-100">
            {readField(school, "rejection_reason", "rejectionReason")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function buildDetails(school: School) {
  const rows = [
    { label: "School name", value: getSchoolName(school) },
    { label: "Owner name", value: readField(school, "owner_name", "ownerName") },
    { label: "Owner phone", value: readField(school, "owner_phone", "ownerPhone") },
    { label: "Owner email", value: readField(school, "owner_email", "ownerEmail") },
    { label: "School address", value: readField(school, "address") },
    { label: "City", value: readField(school, "city") },
    { label: "State", value: readField(school, "state") },
    { label: "Pincode", value: readField(school, "pincode") },
    { label: "Google Maps location", value: readField(school, "google_maps_link", "googleMapsLink"), href: linkValue(school, "google_maps_link", "googleMapsLink") },
    { label: "Driving school license number", value: readField(school, "license_number", "licenseNumber") },
    { label: "License document URL", value: readField(school, "license_document_url", "licenseDocumentUrl"), href: linkValue(school, "license_document_url", "licenseDocumentUrl") },
    { label: "Owner ID proof URL", value: readField(school, "owner_id_proof_url", "ownerIdProofUrl"), href: linkValue(school, "owner_id_proof_url", "ownerIdProofUrl") },
    { label: "PAN number", value: readField(school, "pan_number", "panNumber") },
    { label: "GST number", value: readField(school, "gst_number", "gstNumber") },
    { label: "Bank account name", value: readField(school, "bank_account_name", "bankAccountName") },
    { label: "Bank account number", value: readField(school, "bank_account_number", "bankAccountNumber") },
    { label: "IFSC", value: readField(school, "ifsc") },
    { label: "UPI ID", value: readField(school, "upi_id", "upiId") },
    { label: "Working hours", value: readField(school, "working_hours", "workingHours") },
    { label: "Pickup/drop available", value: Boolean(school.pickup_drop_available ?? school.pickupDropAvailable ?? school.pickupAvailable) ? "Yes" : "No" },
    { label: "Description", value: readField(school, "description") },
    { label: "Status", value: readField(school, "status", "verification_status", "verificationStatus") }
  ];

  return rows.filter((row) => row.label !== "GST number" || row.value !== "-");
}

function getSchoolId(school: School) {
  return String(school.id ?? school._id ?? school.schoolId ?? school.school_id ?? "");
}

function getSchoolName(school: School) {
  const name = readField(school, "school_name", "schoolName", "name", "title");
  return name === "-" ? "Unnamed school" : name;
}

function readField(school: School, ...keys: string[]) {
  for (const key of keys) {
    const value = school[key as keyof School];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }

  if (keys.includes("owner_name") || keys.includes("ownerName")) return readText(school.owner?.name);
  if (keys.includes("owner_email") || keys.includes("ownerEmail")) return readText(school.owner?.email ?? school.owner?.mobile);
  if (keys.includes("owner_phone") || keys.includes("ownerPhone")) return readText(school.owner?.mobile);
  return "-";
}

function linkValue(school: School, ...keys: string[]) {
  const value = readField(school, ...keys);
  return value === "-" ? undefined : value;
}
