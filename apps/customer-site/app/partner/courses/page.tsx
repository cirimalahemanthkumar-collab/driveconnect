"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input, Select, StatusBadge } from "../../../../web/components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, money, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

type CourseForm = {
  course_name: string;
  vehicle_type: string;
  course_type: string;
  transmission: string;
  total_sessions: string;
  duration_days: string;
  price: string;
  advance_amount: string;
  description: string;
};

const vehicleTypes = ["TWO_WHEELER", "FOUR_WHEELER", "BOTH"];
const courseTypes = ["BEGINNER", "ADVANCED", "REFRESHER", "TEST_PREP"];
const transmissions = ["MANUAL", "AUTOMATIC", "BOTH"];
const requiredFields = ["course_name", "vehicle_type", "transmission", "duration_days", "total_sessions", "price"] as const;
type RequiredField = (typeof requiredFields)[number];
const requiredLabels: Record<RequiredField, string> = {
  course_name: "Course title",
  vehicle_type: "Vehicle type",
  transmission: "Transmission",
  duration_days: "Duration days",
  total_sessions: "Total sessions",
  price: "Price"
};

export default function PartnerCoursesPage() {
  const endpoint = API_ENDPOINTS.partner.courses;
  const resource = useApiResource<unknown>(endpoint, []);
  const courses = asList(resource.data, ["courses", "items"]);
  const [form, setForm] = useState<CourseForm>(() => emptyCourseForm());
  const [editingCourse, setEditingCourse] = useState<ApiRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const isEditing = Boolean(editingCourse);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missingFields = getMissingFields(form);
    if (missingFields.length) {
      setFormError(`Missing required fields: ${missingFields.map((field) => requiredLabels[field]).join(", ")}`);
      return;
    }

    const courseId = editingCourse ? getCourseId(editingCourse) : "";
    if (isEditing && !courseId) {
      setFormError("Unable to save changes because this course does not have an ID.");
      return;
    }

    setSaving(true);
    setFormError("");
    setActionError("");
    try {
      await apiRequest({
        url: isEditing ? `${endpoint}/${courseId}` : endpoint,
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

  function startEdit(course: ApiRecord) {
    setEditingCourse(course);
    setForm(formFromCourse(course));
    setFormError("");
    setActionError("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingCourse(null);
    setForm(emptyCourseForm());
    setFormError("");
  }

  async function toggleCourseStatus(course: ApiRecord) {
    const courseId = getCourseId(course);
    if (!courseId) {
      setActionError("Unable to update course status because this course does not have an ID.");
      return;
    }

    setTogglingId(courseId);
    setActionError("");
    try {
      await apiRequest({
        url: `${endpoint}/${courseId}/status`,
        method: "PATCH",
        data: { is_active: !isCourseActive(course) }
      });
      if (editingCourse && getCourseId(editingCourse) === courseId) resetForm();
      await resource.reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setTogglingId("");
    }
  }

  if (resource.loading) return <LoadingState label="Loading courses..." />;

  return (
    <div>
      <PageIntro eyebrow="Course catalogue" title="Courses" description="Publish packages that customers can discover and compare." action={<Button variant="ghost" onClick={() => void resource.reload()}>Refresh</Button>} />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      <Card className="mt-6">
        <form className="grid gap-4" onSubmit={save}>
          <div>
            <p className="text-sm font-bold uppercase text-green-700">{isEditing ? "Editing" : "Add new"}</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{isEditing ? "Edit course" : "Add course"}</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Course title">
              <Input value={form.course_name} onChange={(event) => updateForm(setForm, "course_name", event.target.value)} required />
            </Field>
            <Field label="Vehicle type">
              <Select value={form.vehicle_type} onChange={(event) => updateForm(setForm, "vehicle_type", event.target.value)} required>
                <option value="">Select</option>
                {vehicleTypes.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
            </Field>
            <Field label="Course type">
              <Select value={form.course_type} onChange={(event) => updateForm(setForm, "course_type", event.target.value)}>
                <option value="">Select</option>
                {courseTypes.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
            </Field>
            <Field label="Transmission">
              <Select value={form.transmission} onChange={(event) => updateForm(setForm, "transmission", event.target.value)} required>
                <option value="">Select</option>
                {transmissions.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
            </Field>
            <Field label="Total sessions">
              <Input value={form.total_sessions} onChange={(event) => updateForm(setForm, "total_sessions", event.target.value)} type="number" required />
            </Field>
            <Field label="Duration days">
              <Input value={form.duration_days} onChange={(event) => updateForm(setForm, "duration_days", event.target.value)} type="number" required />
            </Field>
            <Field label="Price">
              <Input value={form.price} onChange={(event) => updateForm(setForm, "price", event.target.value)} type="number" required />
            </Field>
            <Field label="Advance amount">
              <Input value={form.advance_amount} onChange={(event) => updateForm(setForm, "advance_amount", event.target.value)} type="number" />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea className="focus-ring min-h-24 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm" value={form.description} onChange={(event) => updateForm(setForm, "description", event.target.value)} />
            </Field>
          </div>
          <FormError message={formError} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="w-fit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : "Add course"}</Button>
            {isEditing ? <Button type="button" variant="ghost" className="w-fit" onClick={resetForm}>Cancel</Button> : null}
          </div>
        </form>
      </Card>

      <FormError message={actionError} />
      <TableCard columns={["Course", "Vehicle", "Transmission", "Sessions", "Price", "Status", "Actions"]} empty={!courses.length}>
        {courses.map((course, index) => {
          const courseId = getCourseId(course);
          const active = isCourseActive(course);
          return (
            <tr key={courseId || `${text(course, "course_name", "title", "name")}-${index}`}>
              <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">{text(course, "course_name", "title", "name")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(course, "vehicle_type", "vehicleType")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(course, "transmission")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(course, "total_sessions", "totalSessions", "sessions")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700"><span className="font-bold">{money(text(course, "price"))}</span></td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700"><StatusBadge status={active ? "ACTIVE" : "INACTIVE"} /></td>
              <td className="whitespace-nowrap px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" className="min-h-9 px-3 py-2" onClick={() => startEdit(course)}>Edit</Button>
                  <Button variant="ghost" className="min-h-9 px-3 py-2" onClick={() => void toggleCourseStatus(course)} disabled={togglingId === courseId}>
                    {togglingId === courseId ? "Saving..." : active ? "Disable" : "Enable"}
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

function updateForm(setForm: (value: (current: CourseForm) => CourseForm) => void, key: keyof CourseForm, value: string) {
  setForm((current) => ({ ...current, [key]: value }));
}

function emptyCourseForm(): CourseForm {
  return {
    course_name: "",
    vehicle_type: "",
    course_type: "",
    transmission: "",
    total_sessions: "",
    duration_days: "",
    price: "",
    advance_amount: "",
    description: ""
  };
}

function formFromCourse(course: ApiRecord): CourseForm {
  return {
    course_name: cleanValue(text(course, "course_name", "title", "name")),
    vehicle_type: cleanValue(text(course, "vehicle_type", "vehicleType")),
    course_type: cleanValue(text(course, "course_type", "courseType", "type")),
    transmission: cleanValue(text(course, "transmission")),
    total_sessions: cleanValue(text(course, "total_sessions", "totalSessions", "sessions")),
    duration_days: cleanValue(text(course, "duration_days", "durationDays", "days")),
    price: cleanValue(text(course, "price")),
    advance_amount: cleanValue(text(course, "advance_amount", "advanceAmount")),
    description: cleanValue(text(course, "description"))
  };
}

function toPayload(form: CourseForm) {
  return {
    course_name: form.course_name.trim(),
    vehicle_type: form.vehicle_type,
    course_type: form.course_type,
    transmission: form.transmission,
    duration_days: Number(form.duration_days),
    total_sessions: Number(form.total_sessions),
    price: Number(form.price),
    advance_amount: form.advance_amount.trim() ? Number(form.advance_amount) : 0,
    description: form.description.trim()
  };
}

function getMissingFields(form: CourseForm) {
  return requiredFields.filter((field) => {
    if (field === "duration_days" || field === "total_sessions" || field === "price") {
      return !Number.isFinite(Number(form[field])) || Number(form[field]) <= 0;
    }
    return !form[field].trim();
  });
}

function getCourseId(course: ApiRecord) {
  return cleanValue(text(course, "id", "_id", "course_id", "courseId"));
}

function isCourseActive(course: ApiRecord) {
  const value = course.is_active ?? course.active ?? course.status;
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "ACTIVE").toUpperCase();
  return !["FALSE", "INACTIVE", "DISABLED", "SUSPENDED"].includes(normalized);
}

function cleanValue(value: string) {
  return value === "-" ? "" : value;
}
