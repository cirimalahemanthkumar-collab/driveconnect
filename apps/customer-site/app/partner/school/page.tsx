"use client";

import { useEffect, useState, type FormEvent } from "react";
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
  latitude: string;
  longitude: string;
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
  latitude: "",
  longitude: "",
  service_radius_km: "10",
};

export default function PartnerSchoolPage() {
  const resource = useApiResource<unknown>(API_ENDPOINTS.partner.school, {});
  const [form, setForm] = useState<SchoolForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const school = asRecord(resource.data);
  const schoolName = getValue(school, "school_name") || getValue(school, "name") || form.school_name;
  const schoolStatus = getSchoolStatus(school, schoolName);
  const rejectionReason = getValue(school, "rejection_reason");

  useEffect(() => {
    setForm({
      school_name: getValue(school, "school_name") || getValue(school, "name") || "",
      description: getValue(school, "description"),
      phone: getValue(school, "phone"),
      email: getValue(school, "email"),
      address: getValue(school, "address"),
      city: getValue(school, "city"),
      state: getValue(school, "state"),
      pincode: getValue(school, "pincode"),
      latitude: getValue(school, "latitude"),
      longitude: getValue(school, "longitude"),
      service_radius_km: getValue(school, "service_radius_km") || "10",
    });
  }, [resource.data]);

  function update(key: keyof SchoolForm, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
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
        latitude: form.latitude.trim() || null,
        longitude: form.longitude.trim() || null,
        service_radius_km: Number(form.service_radius_km || 10),
      };

      if (!payload.school_name || !payload.address || !payload.city || !payload.state) {
        setFormError("School name, address, city, and state are required.");
        return;
      }

      const schoolId = getValue(school, "id");

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

      await resource.reload();
      setSuccessMessage("School profile saved successfully. Waiting for admin review.");
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
        description="Keep marketplace information accurate so customers know what to expect."
        action={<StatusBadge status={schoolStatus} />}
      />

      {resource.error ? (
        <ErrorBanner message={resource.error} retry={() => void resource.reload()} />
      ) : null}

      {schoolName ? (
        <Card className="mt-6 border border-blue-100 bg-gradient-to-r from-blue-50 to-emerald-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                Saved school profile
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                {schoolName}
              </h2>
              <p className="mt-2 text-slate-600">
                {[form.city, form.state].filter(Boolean).join(", ") || "Location not added"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">Admin status</p>
              <div className="mt-2">
                <StatusBadge status={schoolStatus} />
              </div>
            </div>
          </div>

          {schoolStatus === "APPROVED" ? (
            <p className="mt-4 rounded-lg bg-green-100 px-4 py-3 text-sm font-semibold text-green-800">
              Your school is approved and can appear in the marketplace.
            </p>
          ) : null}

          {schoolStatus === "PENDING" || schoolStatus === "PENDING_REVIEW" ? (
            <p className="mt-4 rounded-lg bg-yellow-100 px-4 py-3 text-sm font-semibold text-yellow-800">
              Your profile is submitted. Admin approval is pending.
            </p>
          ) : null}

          {schoolStatus === "REJECTED" ? (
            <p className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-800">
              Your school was rejected by admin.
              {rejectionReason ? ` Reason: ${rejectionReason}` : ""}
            </p>
          ) : null}

          {schoolStatus === "SUSPENDED" ? (
            <p className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-800">
              Your school is currently suspended. Contact admin/support.
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card className="mt-6">
        <form className="grid gap-4" onSubmit={save}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="School name">
              <Input
                value={form.school_name}
                onChange={(event) => update("school_name", event.target.value)}
                placeholder="Yug Drives"
                required
              />
            </Field>

            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="8328246457"
                required
              />
            </Field>

            <Field label="Email">
              <Input
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                type="email"
                placeholder="school@gmail.com"
              />
            </Field>

            <Field label="City">
              <Input
                value={form.city}
                onChange={(event) => update("city", event.target.value)}
                placeholder="Kurnool"
                required
              />
            </Field>

            <Field label="State">
              <Input
                value={form.state}
                onChange={(event) => update("state", event.target.value)}
                placeholder="Andhra Pradesh"
                required
              />
            </Field>

            <Field label="Pincode">
              <Input
                value={form.pincode}
                onChange={(event) => update("pincode", event.target.value)}
                placeholder="518001"
              />
            </Field>

            <Field label="Latitude">
              <Input
                value={form.latitude}
                onChange={(event) => update("latitude", event.target.value)}
                placeholder="15.8281"
              />
            </Field>

            <Field label="Longitude">
              <Input
                value={form.longitude}
                onChange={(event) => update("longitude", event.target.value)}
                placeholder="78.0373"
              />
            </Field>

            <Field label="Service radius km">
              <Input
                value={form.service_radius_km}
                onChange={(event) => update("service_radius_km", event.target.value)}
                type="number"
                min="1"
                placeholder="10"
              />
            </Field>

            <Field label="Address" className="md:col-span-2">
              <Input
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                placeholder="Beside taluka police station, Dinnedevarapadu"
                required
              />
            </Field>

            <Field label="Description" className="md:col-span-2">
              <textarea
                className="focus-ring min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Brief description about your driving school"
              />
            </Field>
          </div>

          {successMessage ? (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              {successMessage}
            </div>
          ) : null}

          <FormError message={formError} />

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function getValue(record: Record<string, unknown>, key: string) {
  const value = text(record, key);

  if (!value || value === "-") {
    return "";
  }

  return value;
}

function getSchoolStatus(record: Record<string, unknown>, schoolName: string) {
  const status =
    getValue(record, "verification_status") ||
    getValue(record, "verificationStatus") ||
    getValue(record, "status");

  if (status) {
    return status.toUpperCase();
  }

  if (schoolName) {
    return "PENDING";
  }

  return "NOT_SUBMITTED";
}