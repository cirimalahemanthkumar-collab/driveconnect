"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Card, Input, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asRecord, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro } from "../../../components/portal-ui";

type FieldType = "text" | "email" | "tel" | "url" | "number" | "textarea" | "checkbox";
type ProfileForm = Record<string, string | boolean>;
type ProfileFiles = {
  license_document_file: File | null;
  owner_id_proof_file: File | null;
};

type ProfileField = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  className?: string;
  min?: number;
};

const profileFields: ProfileField[] = [
  { key: "school_name", label: "School name", required: true },
  { key: "owner_name", label: "Owner name", required: true },
  { key: "owner_phone", label: "Owner phone", type: "tel", required: true },
  { key: "owner_email", label: "Owner email", type: "email", required: true },
  { key: "phone", label: "School phone", type: "tel", required: true },
  { key: "email", label: "School email", type: "email", required: true },
  { key: "address", label: "School address", required: true, className: "md:col-span-2" },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State", required: true },
  { key: "pincode", label: "Pincode", required: true },
  { key: "google_maps_link", label: "Google Maps link", type: "url", required: true, className: "md:col-span-2" },
  { key: "license_number", label: "Driving school license number", required: true },
  { key: "pan_number", label: "PAN number", required: true },
  { key: "gst_number", label: "GST number" },
  { key: "bank_account_name", label: "Bank account name", required: true },
  { key: "bank_account_number", label: "Bank account number", required: true },
  { key: "ifsc", label: "IFSC", required: true },
  { key: "upi_id", label: "UPI ID", required: true },
  { key: "working_hours", label: "Working hours", required: true },
  { key: "service_radius_km", label: "Service radius km", type: "number", required: true, min: 1 },
  { key: "pickup_drop_available", label: "Pickup/drop available", type: "checkbox", required: true },
  { key: "description", label: "Description", type: "textarea", required: true, className: "md:col-span-2" }
];

const requiredFields = profileFields.filter((field) => field.required);
const fieldLabels = new Map(profileFields.map((field) => [field.key, field.label]));
const documentLabels = {
  license_document_file: "License document",
  owner_id_proof_file: "Owner ID proof"
} as const;
const allowedDocumentTypes = new Set(["image/png", "image/jpeg", "application/pdf"]);
const maxDocumentSizeBytes = 5 * 1024 * 1024;

export default function PartnerSchoolPage() {
  const resource = useApiResource<unknown>(API_ENDPOINTS.partner.school, {});
  const school = asRecord(resource.data);
  const hasSavedProfile = hasProfile(school);
  const [form, setForm] = useState<ProfileForm>(() => emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [files, setFiles] = useState<ProfileFiles>(() => emptyFiles());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const status = normalizeStatus(text(school, "status", "verification_status", "verificationStatus"));

  useEffect(() => {
    const nextForm = formFromSchool(school);
    setForm(nextForm);
    setShowForm(!hasProfile(school));
  }, [resource.data]);

  const summaryItems = useMemo(() => buildSummary(school), [school]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missingFields = getMissingFields(form);
    const missingDocuments = getMissingDocuments(school, files);
    if (missingFields.length || missingDocuments.length) {
      const labels = [
        ...missingFields.map((key) => fieldLabels.get(key) ?? key),
        ...missingDocuments.map((key) => documentLabels[key])
      ];
      setFormError(`Missing required fields: ${labels.join(", ")}`);
      return;
    }

    const fileError = validateProfileFiles(files);
    if (fileError) {
      setFormError(fileError);
      return;
    }

    setSaving(true);
    setFormError("");
    setSuccess("");
    try {
      const formData = toFormData(toPayload(form));
      appendFile(formData, "license_document_file", files.license_document_file);
      appendFile(formData, "owner_id_proof_file", files.owner_id_proof_file);

      await apiRequest({
        url: API_ENDPOINTS.partner.school,
        method: "PUT",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccess("School profile submitted for admin review.");
      setFiles(emptyFiles());
      setShowForm(false);
      await resource.reload();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (resource.loading) return <LoadingState label="Loading your school profile..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Partner verification"
        title="School profile"
        description="Submit complete ownership, licence, document, and payout details for admin review."
        action={<StatusBadge status={status} />}
      />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      {success ? <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 ring-1 ring-green-100">{success}</p> : null}

      {hasSavedProfile && !showForm ? (
        <Card className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <StatusBadge status={status} />
              <h3 className="mt-3 text-2xl font-black text-slate-950">{text(school, "school_name", "schoolName", "name")}</h3>
              <p className="mt-1 text-sm text-slate-500">{text(school, "city")} {text(school, "state") !== "-" ? `, ${text(school, "state")}` : ""}</p>
              {status === "REJECTED" && text(school, "rejection_reason", "rejectionReason") !== "-" ? (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                  {text(school, "rejection_reason", "rejectionReason")}
                </p>
              ) : null}
            </div>
            <Button onClick={() => setShowForm(true)} variant="ghost">Edit profile</Button>
          </div>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            {summaryItems.map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase text-slate-500">{item.label}</dt>
                <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      {showForm ? (
        <Card className="mt-6">
          <form className="grid gap-4" onSubmit={save}>
            <div className="grid gap-4 md:grid-cols-2">
              {profileFields.map((field) => (
                <ProfileInput key={field.key} field={field} form={form} setForm={setForm} />
              ))}
              <DocumentInput
                label="License document"
                existingUrl={getDocumentUrl(school, ["license_document_url", "licenseDocumentUrl"])}
                selectedFile={files.license_document_file}
                onChange={(event) => setDocumentFile(event, "license_document_file", setFiles, setFormError)}
              />
              <DocumentInput
                label="Owner ID proof"
                existingUrl={getDocumentUrl(school, ["owner_id_proof_url", "ownerIdProofUrl"])}
                selectedFile={files.owner_id_proof_file}
                onChange={(event) => setDocumentFile(event, "owner_id_proof_file", setFiles, setFormError)}
              />
            </div>
            <input type="hidden" name="status" value="PENDING" />
            <input type="hidden" name="verification_status" value="PENDING" />
            <FormError message={formError} />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
              {hasSavedProfile ? <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button> : null}
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

function ProfileInput({
  field,
  form,
  setForm
}: {
  field: ProfileField;
  form: ProfileForm;
  setForm: (form: ProfileForm) => void;
}) {
  const value = form[field.key];

  if (field.type === "textarea") {
    return (
      <Field label={field.label} className={field.className}>
        <textarea
          className="focus-ring min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
          value={stringValue(value)}
          onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
          required={field.required}
        />
      </Field>
    );
  }

  if (field.type === "checkbox") {
    return (
      <Field label={field.label} className={field.className}>
        <span className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm">
          <input
            checked={Boolean(value)}
            onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })}
            type="checkbox"
            className="size-4 rounded border-slate-300 text-blue-600"
          />
          <span className="font-medium text-slate-700">{Boolean(value) ? "Yes" : "No"}</span>
        </span>
      </Field>
    );
  }

  return (
    <Field label={field.label} className={field.className}>
      <Input
        value={stringValue(value)}
        onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
        required={field.required}
        type={field.type ?? "text"}
        min={field.min}
      />
    </Field>
  );
}

function DocumentInput({
  label,
  existingUrl,
  selectedFile,
  onChange
}: {
  label: string;
  existingUrl: string;
  selectedFile: File | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Field label={label}>
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <input
          accept="image/png,image/jpeg,application/pdf"
          className="block w-full text-sm font-semibold text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-blue-700 hover:file:bg-blue-100"
          onChange={onChange}
          type="file"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span>PNG, JPEG, or PDF up to 5 MB</span>
          {selectedFile ? <span className="text-slate-900">{selectedFile.name}</span> : null}
          {existingUrl ? (
            <a className="text-blue-700 hover:text-blue-900" href={existingUrl} target="_blank" rel="noreferrer">
              View uploaded document
            </a>
          ) : null}
        </div>
      </div>
    </Field>
  );
}

function emptyForm(): ProfileForm {
  return Object.fromEntries(profileFields.map((field) => [field.key, field.type === "checkbox" ? false : ""]));
}

function emptyFiles(): ProfileFiles {
  return {
    license_document_file: null,
    owner_id_proof_file: null
  };
}

function formFromSchool(school: ApiRecord): ProfileForm {
  const nextForm = emptyForm();
  for (const field of profileFields) {
    if (field.key === "school_name") nextForm[field.key] = cleanSummaryValue(text(school, "school_name", "schoolName", "name"));
    else if (field.key === "pickup_drop_available") nextForm[field.key] = Boolean(school.pickup_drop_available ?? school.pickupDropAvailable ?? school.pickupAvailable);
    else if (field.key === "service_radius_km") nextForm[field.key] = cleanSummaryValue(text(school, "service_radius_km", "serviceRadiusKm"));
    else nextForm[field.key] = cleanSummaryValue(text(school, field.key, toCamelCase(field.key)));
  }

  return nextForm;
}

function toPayload(form: ProfileForm) {
  return {
    school_name: stringValue(form.school_name).trim(),
    owner_name: stringValue(form.owner_name).trim(),
    owner_phone: stringValue(form.owner_phone).trim(),
    owner_email: stringValue(form.owner_email).trim(),
    address: stringValue(form.address).trim(),
    city: stringValue(form.city).trim(),
    state: stringValue(form.state).trim(),
    pincode: stringValue(form.pincode).trim(),
    google_maps_link: stringValue(form.google_maps_link).trim(),
    license_number: stringValue(form.license_number).trim(),
    pan_number: stringValue(form.pan_number).trim(),
    gst_number: stringValue(form.gst_number).trim(),
    bank_account_name: stringValue(form.bank_account_name).trim(),
    bank_account_number: stringValue(form.bank_account_number).trim(),
    ifsc: stringValue(form.ifsc).trim(),
    upi_id: stringValue(form.upi_id).trim(),
    working_hours: stringValue(form.working_hours).trim(),
    pickup_drop_available: Boolean(form.pickup_drop_available),
    description: stringValue(form.description).trim(),
    phone: stringValue(form.phone).trim(),
    email: stringValue(form.email).trim(),
    service_radius_km: Number(form.service_radius_km),
    status: "PENDING",
    verification_status: "PENDING"
  };
}

function toFormData(payload: Record<string, unknown>) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, String(value));
  });
  return formData;
}

function appendFile(formData: FormData, key: keyof ProfileFiles, file: File | null) {
  if (file) formData.append(key, file);
}

function setDocumentFile(
  event: ChangeEvent<HTMLInputElement>,
  key: keyof ProfileFiles,
  setFiles: (files: ProfileFiles | ((files: ProfileFiles) => ProfileFiles)) => void,
  setFormError: (message: string) => void
) {
  const file = event.target.files?.[0] ?? null;
  const fileError = validateDocumentFile(file);

  if (fileError) {
    event.target.value = "";
    setFormError(fileError);
    setFiles((current) => ({ ...current, [key]: null }));
    return;
  }

  setFormError("");
  setFiles((current) => ({ ...current, [key]: file }));
}

function validateProfileFiles(files: ProfileFiles) {
  return validateDocumentFile(files.license_document_file) || validateDocumentFile(files.owner_id_proof_file);
}

function validateDocumentFile(file: File | null) {
  if (!file) return "";
  if (!allowedDocumentTypes.has(file.type)) return "Only PNG, JPEG, and PDF files are allowed.";
  if (file.size > maxDocumentSizeBytes) return "File must be less than 5 MB.";
  return "";
}

function getMissingFields(form: ProfileForm) {
  return requiredFields
    .filter((field) => {
      if (field.key === "pickup_drop_available") return typeof form[field.key] !== "boolean";
      if (field.key === "service_radius_km") return !Number.isFinite(Number(form[field.key])) || Number(form[field.key]) <= 0;
      return !stringValue(form[field.key]).trim();
    })
    .map((field) => field.key);
}

function getMissingDocuments(school: ApiRecord, files: ProfileFiles) {
  const missing: Array<keyof ProfileFiles> = [];
  if (!files.license_document_file && !getDocumentUrl(school, ["license_document_url", "licenseDocumentUrl", "license_document_path", "licenseDocumentPath"])) {
    missing.push("license_document_file");
  }
  if (!files.owner_id_proof_file && !getDocumentUrl(school, ["owner_id_proof_url", "ownerIdProofUrl", "owner_id_proof_path", "ownerIdProofPath"])) {
    missing.push("owner_id_proof_file");
  }
  return missing;
}

function getDocumentUrl(school: ApiRecord, keys: string[]) {
  for (const key of keys) {
    const value = cleanSummaryValue(text(school, key));
    if (value) return value;
  }
  return "";
}

function buildSummary(school: ApiRecord) {
  return [
    { label: "Owner name", value: text(school, "owner_name", "ownerName") },
    { label: "Owner phone", value: text(school, "owner_phone", "ownerPhone") },
    { label: "Owner email", value: text(school, "owner_email", "ownerEmail") },
    { label: "School address", value: text(school, "address") },
    { label: "City", value: text(school, "city") },
    { label: "State", value: text(school, "state") },
    { label: "Pincode", value: text(school, "pincode") },
    { label: "Google Maps link", value: text(school, "google_maps_link", "googleMapsLink") },
    { label: "License number", value: text(school, "license_number", "licenseNumber") },
    { label: "License document", value: text(school, "license_document_url", "licenseDocumentUrl", "license_document_path", "licenseDocumentPath") },
    { label: "Owner ID proof", value: text(school, "owner_id_proof_url", "ownerIdProofUrl", "owner_id_proof_path", "ownerIdProofPath") },
    { label: "PAN number", value: text(school, "pan_number", "panNumber") },
    { label: "GST number", value: text(school, "gst_number", "gstNumber") },
    { label: "Bank account name", value: text(school, "bank_account_name", "bankAccountName") },
    { label: "Bank account number", value: text(school, "bank_account_number", "bankAccountNumber") },
    { label: "IFSC", value: text(school, "ifsc") },
    { label: "UPI ID", value: text(school, "upi_id", "upiId") },
    { label: "Working hours", value: text(school, "working_hours", "workingHours") },
    { label: "Pickup/drop available", value: Boolean(school.pickup_drop_available ?? school.pickupDropAvailable ?? school.pickupAvailable) ? "Yes" : "No" },
    { label: "Service radius", value: `${text(school, "service_radius_km", "serviceRadiusKm")} km` },
    { label: "Phone", value: text(school, "phone") },
    { label: "Email", value: text(school, "email") },
    { label: "Description", value: text(school, "description") },
    { label: "Status", value: normalizeStatus(text(school, "status", "verification_status", "verificationStatus")) }
  ];
}

function hasProfile(school: ApiRecord) {
  return text(school, "id", "school_id", "school_name", "schoolName", "name") !== "-";
}

function normalizeStatus(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "VERIFIED") return "APPROVED";
  if (normalized === "UNDER_REVIEW") return "PENDING";
  if (["APPROVED", "PENDING", "REJECTED", "SUSPENDED"].includes(normalized)) return normalized;
  return "PENDING";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : value === undefined || value === null || typeof value === "boolean" ? "" : String(value);
}

function cleanSummaryValue(value: string) {
  return value === "-" ? "" : value;
}

function toCamelCase(value: string) {
  return value.replace(/_([a-z])/g, (_, character: string) => character.toUpperCase());
}
