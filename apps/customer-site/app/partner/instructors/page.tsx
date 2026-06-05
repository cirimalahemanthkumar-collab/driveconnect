"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input, StatusBadge } from "../../../../web/components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

type InstructorForm = {
  full_name: string;
  phone: string;
  email: string;
  license_number: string;
  experience_years: string;
};

const requiredFields = ["full_name", "phone"] as const;
type RequiredField = (typeof requiredFields)[number];
const requiredLabels: Record<RequiredField, string> = {
  full_name: "Instructor name",
  phone: "Phone"
};

export default function PartnerInstructorsPage() {
  const endpoint = API_ENDPOINTS.partner.instructors;
  const resource = useApiResource<unknown>(endpoint, []);
  const instructors = asList(resource.data, ["instructors", "items"]);
  const [form, setForm] = useState<InstructorForm>(() => emptyInstructorForm());
  const [editingInstructor, setEditingInstructor] = useState<ApiRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const isEditing = Boolean(editingInstructor);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missingFields = getMissingFields(form);
    if (missingFields.length) {
      setFormError(`Missing required fields: ${missingFields.map((field) => requiredLabels[field]).join(", ")}`);
      return;
    }

    const instructorId = editingInstructor ? getInstructorId(editingInstructor) : "";
    if (isEditing && !instructorId) {
      setFormError("Unable to save changes because this instructor does not have an ID.");
      return;
    }

    setSaving(true);
    setFormError("");
    setActionError("");
    try {
      await apiRequest({
        url: isEditing ? `${endpoint}/${instructorId}` : endpoint,
        method: isEditing ? "PUT" : "POST",
        data: toPayload(form)
      });
      resetForm();
      await resource.reload();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(instructor: ApiRecord) {
    setEditingInstructor(instructor);
    setForm(formFromInstructor(instructor));
    setFormError("");
    setActionError("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingInstructor(null);
    setForm(emptyInstructorForm());
    setFormError("");
  }

  async function toggleInstructorStatus(instructor: ApiRecord) {
    const instructorId = getInstructorId(instructor);
    if (!instructorId) {
      setActionError("Unable to update instructor status because this instructor does not have an ID.");
      return;
    }

    setTogglingId(instructorId);
    setActionError("");
    try {
      await apiRequest({
        url: `${endpoint}/${instructorId}/status`,
        method: "PATCH",
        data: { is_active: !isInstructorActive(instructor) }
      });
      if (editingInstructor && getInstructorId(editingInstructor) === instructorId) resetForm();
      await resource.reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setTogglingId("");
    }
  }

  if (resource.loading) return <LoadingState label="Loading instructors..." />;

  return (
    <div>
      <PageIntro eyebrow="School assets" title="Instructors" description="Keep your instructor roster current for customer assignments." action={<Button variant="ghost" onClick={() => void resource.reload()}>Refresh</Button>} />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      <Card className="mt-6">
        <form className="grid gap-4" onSubmit={save}>
          <div>
            <p className="text-sm font-bold uppercase text-green-700">{isEditing ? "Editing" : "Add new"}</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{isEditing ? "Edit instructor" : "Add instructor"}</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Instructor name">
              <Input value={form.full_name} onChange={(event) => updateForm(setForm, "full_name", event.target.value)} required />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(event) => updateForm(setForm, "phone", event.target.value)} required />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={(event) => updateForm(setForm, "email", event.target.value)} type="email" />
            </Field>
            <Field label="Licence number">
              <Input value={form.license_number} onChange={(event) => updateForm(setForm, "license_number", event.target.value)} />
            </Field>
            <Field label="Experience years">
              <Input value={form.experience_years} onChange={(event) => updateForm(setForm, "experience_years", event.target.value)} type="number" />
            </Field>
          </div>
          <FormError message={formError} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="w-fit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : "Add instructor"}</Button>
            {isEditing ? <Button type="button" variant="ghost" className="w-fit" onClick={resetForm}>Cancel</Button> : null}
          </div>
        </form>
      </Card>

      <FormError message={actionError} />
      <TableCard columns={["Instructor", "Phone", "Email", "Licence", "Experience", "Status", "Actions"]} empty={!instructors.length}>
        {instructors.map((instructor, index) => {
          const instructorId = getInstructorId(instructor);
          const active = isInstructorActive(instructor);
          const toggling = Boolean(instructorId) && togglingId === instructorId;
          return (
            <tr key={instructorId || `${text(instructor, "full_name", "name", "instructor_name")}-${index}`}>
              <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">{text(instructor, "full_name", "name", "instructor_name")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(instructor, "phone", "mobile")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(instructor, "email")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(instructor, "license_number", "licenseNumber", "licenceNumber")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(instructor, "experience_years", "experienceYears", "experience")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700"><StatusBadge status={active ? "ACTIVE" : "INACTIVE"} /></td>
              <td className="whitespace-nowrap px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" className="min-h-9 px-3 py-2" onClick={() => startEdit(instructor)}>Edit</Button>
                  <Button variant="ghost" className="min-h-9 px-3 py-2" onClick={() => void toggleInstructorStatus(instructor)} disabled={toggling}>
                    {toggling ? "Saving..." : active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </TableCard>
    </div>
  );
}

function updateForm(setForm: (value: (current: InstructorForm) => InstructorForm) => void, key: keyof InstructorForm, value: string) {
  setForm((current) => ({ ...current, [key]: value }));
}

function emptyInstructorForm(): InstructorForm {
  return {
    full_name: "",
    phone: "",
    email: "",
    license_number: "",
    experience_years: ""
  };
}

function formFromInstructor(instructor: ApiRecord): InstructorForm {
  return {
    full_name: cleanValue(text(instructor, "full_name", "name", "instructor_name")),
    phone: cleanValue(text(instructor, "phone", "mobile")),
    email: cleanValue(text(instructor, "email")),
    license_number: cleanValue(text(instructor, "license_number", "licenseNumber", "licenceNumber")),
    experience_years: cleanValue(text(instructor, "experience_years", "experienceYears", "experience"))
  };
}

function toPayload(form: InstructorForm) {
  return {
    full_name: form.full_name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    license_number: form.license_number.trim(),
    experience_years: form.experience_years.trim() ? Number(form.experience_years) : 0
  };
}

function getMissingFields(form: InstructorForm) {
  return requiredFields.filter((field) => !form[field].trim());
}

function getInstructorId(instructor: ApiRecord) {
  return cleanValue(text(instructor, "id", "_id", "instructor_id", "instructorId"));
}

function isInstructorActive(instructor: ApiRecord) {
  const value = instructor.is_active ?? instructor.active ?? instructor.status;
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "ACTIVE").toUpperCase();
  return !["FALSE", "INACTIVE", "DISABLED", "SUSPENDED"].includes(normalized);
}

function cleanValue(value: string) {
  return value === "-" ? "" : value;
}
