"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input, Select, StatusBadge } from "../../web/components/ui";
import { useApiResource } from "../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import { asList, dateText, money, text } from "../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro, TableCard } from "./portal-ui";

type FormField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "date" | "datetime-local" | "textarea" | "select";
  options?: string[];
  required?: boolean;
};

type Column = {
  label: string;
  keys: string[];
  format?: "date" | "money" | "status";
};

export function PartnerCrudPage({
  endpoint,
  eyebrow,
  title,
  description,
  listKeys,
  fields,
  columns,
  createLabel
}: {
  endpoint: string;
  eyebrow: string;
  title: string;
  description: string;
  listKeys: string[];
  fields: FormField[];
  columns: Column[];
  createLabel: string;
}) {
  const resource = useApiResource<unknown>(endpoint, []);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const records = asList(resource.data, listKeys);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const body = Object.fromEntries(fields.map((field) => [
        field.key,
        field.type === "number" ? Number(form[field.key] ?? 0) : form[field.key] ?? ""
      ]));
      await apiRequest({ url: endpoint, method: "POST", data: body });
      setForm({});
      await resource.reload();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (resource.loading) return <LoadingState label={`Loading ${title.toLowerCase()}...`} />;

  return (
    <div>
      <PageIntro eyebrow={eyebrow} title={title} description={description} action={<Button variant="ghost" onClick={() => void resource.reload()}>Refresh</Button>} />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      <Card className="mt-6">
        <form className="grid gap-4" onSubmit={create}>
          <div>
            <p className="text-sm font-bold uppercase text-green-700">Add new</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{createLabel}</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <Field key={field.key} label={field.label} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <FormControl field={field} value={form[field.key] ?? ""} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} />
              </Field>
            ))}
          </div>
          <FormError message={formError} />
          <Button type="submit" className="w-fit" disabled={saving}>{saving ? "Saving..." : createLabel}</Button>
        </form>
      </Card>

      <TableCard columns={columns.map((column) => column.label)} empty={!records.length}>
        {records.map((record, index) => (
          <tr key={text(record, "id", "_id") + index}>
            {columns.map((column) => {
              const value = text(record, ...column.keys);
              return (
                <td key={column.label} className="whitespace-nowrap px-4 py-4 text-slate-700">
                  {column.format === "status" ? <StatusBadge status={value} /> : column.format === "date" ? dateText(value) : column.format === "money" ? <span className="font-bold">{money(value)}</span> : value}
                </td>
              );
            })}
          </tr>
        ))}
      </TableCard>
    </div>
  );
}

function FormControl({
  field,
  value,
  onChange
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "textarea") {
    return <textarea className="focus-ring min-h-24 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm" value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} required={field.required} />;
  }

  if (field.type === "select") {
    return (
      <Select value={value} onChange={(event) => onChange(event.target.value)} required={field.required}>
        <option value="">Select</option>
        {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
      </Select>
    );
  }

  return <Input value={value} onChange={(event) => onChange(event.target.value)} type={field.type ?? "text"} placeholder={field.placeholder} required={field.required} />;
}
