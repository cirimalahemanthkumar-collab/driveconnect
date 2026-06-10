"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Card, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, asRecord, dateText, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

type DocumentForm = {
  document_type: string;
  notes: string;
};

const additionalDocumentTypes = [
  "VEHICLE_RC",
  "INSURANCE",
  "POLLUTION_CERTIFICATE",
  "INSTRUCTOR_LICENSE",
  "RENEWED_LICENSE",
  "OTHER"
];

const emptyForm: DocumentForm = {
  document_type: "",
  notes: ""
};
const allowedDocumentTypes = new Set(["image/png", "image/jpeg", "application/pdf"]);
const maxDocumentSizeBytes = 5 * 1024 * 1024;

export default function PartnerDocumentsPage() {
  const documentsResource = useApiResource<unknown>(API_ENDPOINTS.partner.documents, []);
  const schoolResource = useApiResource<unknown>(API_ENDPOINTS.partner.school, {});
  const school = asRecord(schoolResource.data);
  const documents = asList(documentsResource.data, ["documents", "items"]).filter(isAdditionalDocument);
  const [form, setForm] = useState<DocumentForm>(emptyForm);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const verificationDocuments = getVerificationDocuments(school);

  async function reloadAll() {
    await Promise.all([documentsResource.reload(), schoolResource.reload()]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = toPayload(form);

    if (!payload.document_type || !documentFile) {
      setFormError("Document type and document file are required.");
      return;
    }

    const fileError = validateDocumentFile(documentFile);
    if (fileError) {
      setFormError(fileError);
      return;
    }

    setSaving(true);
    setFormError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("document_type", payload.document_type);
      formData.append("notes", payload.notes);
      formData.append("document_file", documentFile);

      await apiRequest({
        url: API_ENDPOINTS.partner.documents,
        method: "POST",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" }
      });
      setForm(emptyForm);
      setDocumentFile(null);
      setSuccess("Additional document submitted for admin review.");
      await documentsResource.reload();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (documentsResource.loading || schoolResource.loading) return <LoadingState label="Loading additional documents..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Additional documents"
        title="Additional documents"
        description="Upload extra partner records that support your active school, vehicle, and instructor compliance."
        action={<Button variant="ghost" onClick={() => void reloadAll()}>Refresh</Button>}
      />
      {documentsResource.error ? <ErrorBanner message={documentsResource.error} retry={() => void documentsResource.reload()} /> : null}
      {schoolResource.error ? <ErrorBanner message={schoolResource.error} retry={() => void schoolResource.reload()} /> : null}
      {success ? <p className="mt-5 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700 ring-1 ring-green-100">{success}</p> : null}

      <Card className="mt-6 bg-blue-50/80 text-sm font-semibold leading-6 text-blue-900 ring-blue-100">
        Your license and owner ID proof are already submitted in School profile. Use this page only for extra documents like Vehicle RC, Insurance, Pollution Certificate, or renewed documents.
      </Card>

      {verificationDocuments.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {verificationDocuments.map((document) => (
            <Card key={document.label}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">{document.label}</p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-950">
                    <a href={document.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">{document.url}</a>
                  </p>
                </div>
                <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">Managed from School profile</p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      <Card className="mt-6">
        <form className="grid gap-4" onSubmit={submit}>
          <div>
            <p className="text-sm font-bold uppercase text-green-700">Add new</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">Submit additional document</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Document type">
              <select
                className="focus-ring min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm"
                value={form.document_type}
                onChange={(event) => setForm((current) => ({ ...current, document_type: event.target.value }))}
                required
              >
                <option value="">Select</option>
                {additionalDocumentTypes.map((documentType) => (
                  <option key={documentType} value={documentType}>{documentType}</option>
                ))}
              </select>
            </Field>
            <Field label="Document file">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <input
                  accept="image/png,image/jpeg,application/pdf"
                  className="block w-full text-sm font-semibold text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(event) => handleDocumentFile(event, setDocumentFile, setFormError)}
                  required
                  type="file"
                />
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {documentFile ? documentFile.name : "PNG, JPEG, or PDF up to 5 MB"}
                </p>
              </div>
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <textarea
                className="focus-ring min-h-24 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </Field>
          </div>
          <FormError message={formError} />
          <Button type="submit" className="w-fit" disabled={saving}>{saving ? "Saving..." : "Submit document"}</Button>
        </form>
      </Card>

      <TableCard columns={["Document", "URL", "Status", "Submitted", "Notes"]} empty={!documents.length}>
        {documents.map((document, index) => {
          const documentUrl = readDocumentUrl(document);
          return (
            <tr key={`${text(document, "id", "_id", "documentId")}-${index}`}>
              <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">{text(document, "document_type", "documentType", "type")}</td>
              <td className="max-w-xs px-4 py-4 text-slate-700">
                {documentUrl ? <a href={documentUrl} target="_blank" rel="noreferrer" className="break-words text-blue-700 underline">{documentUrl}</a> : "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={text(document, "status", "verificationStatus")} /></td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{dateText(text(document, "uploaded_at", "uploadedAt", "created_at", "createdAt"))}</td>
              <td className="px-4 py-4 text-slate-700">{text(document, "notes", "reviewNotes")}</td>
            </tr>
          );
        })}
      </TableCard>
    </div>
  );
}

function toPayload(form: DocumentForm) {
  return {
    document_type: form.document_type.trim(),
    notes: form.notes.trim()
  };
}

function handleDocumentFile(
  event: ChangeEvent<HTMLInputElement>,
  setDocumentFile: (file: File | null) => void,
  setFormError: (message: string) => void
) {
  const file = event.target.files?.[0] ?? null;
  const fileError = validateDocumentFile(file);

  if (fileError) {
    event.target.value = "";
    setDocumentFile(null);
    setFormError(fileError);
    return;
  }

  setFormError("");
  setDocumentFile(file);
}

function validateDocumentFile(file: File | null) {
  if (!file) return "";
  if (!allowedDocumentTypes.has(file.type)) return "Only PNG, JPEG, and PDF files are allowed.";
  if (file.size > maxDocumentSizeBytes) return "File must be less than 5 MB.";
  return "";
}

function isAdditionalDocument(document: ApiRecord) {
  return additionalDocumentTypes.includes(text(document, "document_type", "documentType", "type"));
}

function readDocumentUrl(document: ApiRecord) {
  const value = text(document, "document_url", "documentUrl", "url", "document_path", "documentPath");
  return value === "-" ? "" : value;
}

function getVerificationDocuments(school: ApiRecord) {
  return [
    { label: "License document", url: readProfileUrl(school, "license_document_url", "licenseDocumentUrl", "license_document_path", "licenseDocumentPath") },
    { label: "Owner ID proof", url: readProfileUrl(school, "owner_id_proof_url", "ownerIdProofUrl", "owner_id_proof_path", "ownerIdProofPath") }
  ].filter((document) => document.url);
}

function readProfileUrl(school: ApiRecord, ...keys: string[]) {
  const value = text(school, ...keys);
  return value === "-" ? "" : value;
}
