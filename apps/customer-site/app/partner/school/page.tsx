"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Card, Input, StatusBadge } from "@/components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asRecord, text } from "../../../lib/records";
import {
  ErrorBanner,
  Field,
  FormError,
  LoadingState,
  PageIntro,
} from "../../../components/portal-ui";

type SchoolForm = {
  school_name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  service_radius_km: string;
};

const emptyForm: SchoolForm = {
  school_name: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  service_radius_km: "10",
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "https://driveconnect-backend-zodo.onrender.com";

export default function PartnerSchoolPage() {
  const resource = useApiResource<unknown>(API_ENDPOINTS.partner.school, {});
  const rawRecord = asRecord(resource.data);
  const school = getSchoolRecord(rawRecord);

  const [form, setForm] = useState<SchoolForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [marketplaceApproved, setMarketplaceApproved] = useState(false);
  const [localPendingReview, setLocalPendingReview] = useState(false);

  const schoolName =
    getValue(school, "school_name") ||
    getValue(school, "name") ||
    form.school_name;

  const hasSavedSchool = Boolean(
    getValue(school, "id") ||
      getValue(school, "school_id") ||
      schoolName ||
      getValue(school, "phone") ||
      getValue(school, "email")
  );

  const schoolStatus = useMemo(() => {
    if (localPendingReview) return "PENDING";

    const directStatus =
      getValue(school, "verification_status") ||
      getValue(school, "verificationStatus") ||
      getValue(school, "status") ||
      getValue(rawRecord, "verification_status") ||
      getValue(rawRecord, "verificationStatus") ||
      getValue(rawRecord, "status");

    if (directStatus) return normalizeStatus(directStatus);

    if (marketplaceApproved) return "APPROVED";

    if (hasSavedSchool) return "PENDING";

    return "NOT_SUBMITTED";
  }, [hasSavedSchool, localPendingReview, marketplaceApproved, rawRecord, school]);

  const rejectionReason =
    getValue(school, "rejection_reason") ||
    getValue(school, "rejectionReason") ||
    getValue(rawRecord, "rejection_reason") ||
    getValue(rawRecord, "rejectionReason");

  useEffect(() => {
    setForm({
      school_name: getValue(school, "school_name") || getValue(school, "name"),
      description: getValue(school, "description"),
      phone: getValue(school, "phone"),
      email: getValue(school, "email"),
      address: getValue(school, "address"),
      city: getValue(school, "city"),
      state: getValue(school, "state"),
      pincode: getValue(school, "pincode"),
      service_radius_km: getValue(school, "service_radius_km") || "10",
    });
  }, [resource.data]);

  useEffect(() => {
    if (!hasSavedSchool) {
      setEditing(true);
    }
  }, [hasSavedSchool]);

  useEffect(() => {
    void checkMarketplaceApproval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.data]);

  function update(key: keyof SchoolForm, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function checkMarketplaceApproval() {
    const currentName =
      getValue(school, "school_name") ||
      getValue(school, "name") ||
      form.school_name;

    const currentPhone = getValue(school, "phone") || form.phone;
    const currentEmail = getValue(school, "email") || form.email;
    const currentId = getValue(school, "id") || getValue(school, "school_id");

    if (!currentName && !currentPhone && !currentEmail && !currentId) {
      setMarketplaceApproved(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/marketplace/schools`, {
        cache: "no-store",
      });

      const payload = await response.json();
      const schools = Array.isArray(payload?.schools)
        ? payload.schools
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const found = schools.some((item: unknown) => {
        const record = asRecord(item);

        const itemId = getValue(record, "id") || getValue(record, "school_id");
        const itemName =
          getValue(record, "school_name") || getValue(record, "name");
        const itemPhone = getValue(record, "phone");
        const itemEmail = getValue(record, "email");

        return (
          (currentId && itemId && currentId === itemId) ||
          (currentPhone && itemPhone && currentPhone === itemPhone) ||
          (currentEmail && itemEmail && currentEmail.toLowerCase() === currentEmail.toLowerCase()) ||
          (currentName && itemName && currentName.toLowerCase() === itemName.toLowerCase())
        );
      });

      setMarketplaceApproved(found);
    } catch {
      setMarketplaceApproved(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const payload = {
        school_name: form.school_name.trim(),
        name: form.school_name.trim(),
        description: form.description.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        service_radius_km: Number(form.service_radius_km || 10),

        // This requests re-review after edit.
        // Backend should enforce this also.
        status: "PENDING",
        verification_status: "PENDING",
      };

      if (!payload.school_name || !payload.address || !payload.city || !payload.state) {
        setFormError("School name, address, city, and state are required.");
        return;
      }

      const schoolId = getValue(school, "id") || getValue(school, "school_id");

      try {
        await apiRequest({
          url: API_ENDPOINTS.partner.school,
          method: schoolId ? "PUT" : "POST",
          data: payload,
        });
      } catch {
        await apiRequest({
          url: API_ENDPOINTS.partner.school,
          method: schoolId ? "POST" : "PUT",
          data: payload,
        });
      }

      setLocalPendingReview(true);
      setMarketplaceApproved(false);
      setEditing(false);
      setSuccessMessage("School profile submitted for admin review.");
      await resource.reload();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, "Unable to save school profile."));
    } finally {
      setSaving(false);
    }
  }

  if (resource.loading) {
    return <LoadingState label="Loading your school profile..." />;
  }

  return (
    <div>
      <PageIntro
        eyebrow="Partner profile"
        title="School profile"
        description="Manage your school profile and track admin verification status."
        action={<StatusBadge status={schoolStatus} />}
      />

      {resource.error ? (
        <ErrorBanner message={resource.error} retry={() => void resource.reload()} />
      ) : null}

      {hasSavedSchool && !editing ? (
        <Card className="mt-6 border border-blue-100 bg-gradient-to-r from-blue-50 to-emerald-50">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                Saved school profile
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                {schoolName || "School profile"}
              </h2>

              <p className="mt-2 text-slate-600">
                {[form.city, form.state].filter(Boolean).join(", ") || "Location not added"}
              </p>

              <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                <p>
                  <span className="font-bold text-slate-950">Phone:</span>{" "}
                  {form.phone || "-"}
                </p>
                <p>
                  <span className="font-bold text-slate-950">Email:</span>{" "}
                  {form.email || "-"}
                </p>
                <p className="md:col-span-2">
                  <span className="font-bold text-slate-950">Address:</span>{" "}
                  {form.address || "-"}
                </p>
                <p className="md:col-span-2">
                  <span className="font-bold text-slate-950">Description:</span>{" "}
                  {form.description || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Admin status</p>
              <div className="mt-2">
                <StatusBadge status={schoolStatus} />
              </div>
            </div>
          </div>

          {schoolStatus === "APPROVED" ? (
            <p className="mt-5 rounded-lg bg-green-100 px-4 py-3 text-sm font-semibold text-green-800">
              Your school is approved by admin and can appear in the marketplace.
            </p>
          ) : null}

          {schoolStatus === "PENDING" || schoolStatus === "PENDING_REVIEW" ? (
            <p className="mt-5 rounded-lg bg-yellow-100 px-4 py-3 text-sm font-semibold text-yellow-800">
              Your school profile is submitted. Admin approval is pending.
            </p>
          ) : null}

          {schoolStatus === "REJECTED" ? (
            <p className="mt-5 rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-800">
              Your school profile was rejected by admin.
              {rejectionReason ? ` Reason: ${rejectionReason}` : ""}
            </p>
          ) : null}

          {schoolStatus === "SUSPENDED" ? (
            <p className="mt-5 rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-800">
              Your school is currently suspended. Contact admin/support.
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => setEditing(true)}>
              Edit profile
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void resource.reload();
                void checkMarketplaceApproval();
              }}
            >
              Refresh status
            </Button>
          </div>
        </Card>
      ) : null}

      {editing ? (
        <Card className="mt-6">
          <form className="grid gap-4" onSubmit={save}>
            <div className="mb-2">
              <h3 className="text-2xl font-black text-slate-950">
                {hasSavedSchool ? "Edit school profile" : "Create school profile"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                After saving changes, admin may need to review and approve the profile again.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="School name">
                <Input
                  value={form.school_name}
                  onChange={(event) => update("school_name", event.target.value)}
                  required
                />
              </Field>

              <Field label="Phone">
                <Input
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  required
                />
              </Field>

              <Field label="Email">
                <Input
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  type="email"
                />
              </Field>

              <Field label="City">
                <Input
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                  required
                />
              </Field>

              <Field label="State">
                <Input
                  value={form.state}
                  onChange={(event) => update("state", event.target.value)}
                  required
                />
              </Field>

              <Field label="Pincode">
                <Input
                  value={form.pincode}
                  onChange={(event) => update("pincode", event.target.value)}
                />
              </Field>

              <Field label="Service radius km">
                <Input
                  value={form.service_radius_km}
                  onChange={(event) => update("service_radius_km", event.target.value)}
                  type="number"
                  min="1"
                />
              </Field>

              <Field label="Address" className="md:col-span-2">
                <Input
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  required
                />
              </Field>

              <Field label="Description" className="md:col-span-2">
                <textarea
                  className="focus-ring min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                />
              </Field>
            </div>

            {successMessage ? (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {successMessage}
              </div>
            ) : null}

            <FormError message={formError} />

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : hasSavedSchool ? "Submit changes for review" : "Save profile"}
              </Button>

              {hasSavedSchool ? (
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

function getSchoolRecord(record: Record<string, unknown>) {
  const nested =
    asRecord(record.school) ||
    asRecord(record.data) ||
    asRecord(record.profile) ||
    record;

  return nested;
}

function getValue(record: Record<string, unknown>, key: string) {
  const value = text(record, key);

  if (!value || value === "-") {
    return "";
  }

  return value;
}

function normalizeStatus(status: string) {
  const cleaned = status.trim().toUpperCase();

  if (cleaned === "APPROVED") return "APPROVED";
  if (cleaned === "REJECTED") return "REJECTED";
  if (cleaned === "SUSPENDED") return "SUSPENDED";
  if (cleaned === "PENDING_REVIEW") return "PENDING_REVIEW";
  if (cleaned === "PENDING") return "PENDING";
  if (cleaned === "NOT_SUBMITTED") return "NOT_SUBMITTED";

  return cleaned;
}