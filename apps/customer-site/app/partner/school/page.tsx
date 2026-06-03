"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Input, StatusBadge } from "@/components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asRecord, text } from "../../../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro } from "../../../components/portal-ui";

const fields = ["name", "description", "phone", "email", "address", "city"] as const;

export default function PartnerSchoolPage() {
  const resource = useApiResource<unknown>(API_ENDPOINTS.partner.school, {});
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const school = asRecord(resource.data);

  useEffect(() => {
    setForm(Object.fromEntries(fields.map((field) => [field, text(school, field) === "-" ? "" : text(school, field)])));
  }, [resource.data]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await apiRequest({ url: API_ENDPOINTS.partner.school, method: "PUT", data: form });
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
      <PageIntro eyebrow="Partner profile" title="School profile" description="Keep marketplace information accurate so customers know what to expect." action={<StatusBadge status={text(school, "verificationStatus", "status")} />} />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      <Card className="mt-6">
        <form className="grid gap-4" onSubmit={save}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="School name"><Input value={form.name ?? ""} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
            <Field label="Phone"><Input value={form.phone ?? ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></Field>
            <Field label="Email"><Input value={form.email ?? ""} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" /></Field>
            <Field label="City"><Input value={form.city ?? ""} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
            <Field label="Address" className="md:col-span-2"><Input value={form.address ?? ""} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
            <Field label="Description" className="md:col-span-2">
              <textarea className="focus-ring min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm" value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
          </div>
          <FormError message={formError} />
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
        </form>
      </Card>
    </div>
  );
}

