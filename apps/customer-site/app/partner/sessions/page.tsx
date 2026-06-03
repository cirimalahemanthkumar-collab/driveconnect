"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input, StatusBadge } from "../../../../web/components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, text } from "../../../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

export default function PartnerSessionsPage() {
  const resource = useApiResource<unknown>(API_ENDPOINTS.partner.sessions, []);
  const [form, setForm] = useState({ bookingId: "", instructorId: "", scheduledAt: "", notes: "" });
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const sessions = asList(resource.data, ["sessions", "items"]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest({ url: API_ENDPOINTS.partner.sessions, method: "POST", data: form });
      setForm({ bookingId: "", instructorId: "", scheduledAt: "", notes: "" });
      await resource.reload();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  async function update(sessionId: string, status: string) {
    setBusyId(sessionId);
    setError("");
    try {
      await apiRequest({ url: `${API_ENDPOINTS.partner.sessions}/${sessionId}/status`, method: "PATCH", data: { status } });
      await resource.reload();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setBusyId("");
    }
  }

  if (resource.loading) return <LoadingState label="Loading partner sessions..." />;

  return (
    <div>
      <PageIntro eyebrow="Class operations" title="Sessions" description="Schedule classes and keep progress status current for your learners." />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      <Card className="mt-6">
        <form className="grid gap-4" onSubmit={create}>
          <h3 className="text-xl font-black text-slate-950">Schedule class session</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Booking ID"><Input value={form.bookingId} onChange={(event) => setForm({ ...form, bookingId: event.target.value })} required /></Field>
            <Field label="Instructor ID"><Input value={form.instructorId} onChange={(event) => setForm({ ...form, instructorId: event.target.value })} required /></Field>
            <Field label="Scheduled at"><Input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} required /></Field>
            <Field label="Notes"><Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
          </div>
          <FormError message={error} />
          <Button type="submit" className="w-fit">Schedule session</Button>
        </form>
      </Card>
      <TableCard columns={["Session", "Scheduled", "Status", "Actions"]} empty={!sessions.length}>
        {sessions.map((session, index) => {
          const id = text(session, "id", "_id");
          return (
            <tr key={id + index}>
              <td className="px-4 py-4 font-semibold text-slate-950">{id}</td>
              <td className="px-4 py-4 text-slate-700">{dateText(session.scheduledAt ?? session.date)}</td>
              <td className="px-4 py-4"><StatusBadge status={text(session, "status")} /></td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <Button className="min-h-9 px-3 py-2" disabled={busyId === id} onClick={() => void update(id, "STARTED")}>Start</Button>
                  <Button className="min-h-9 px-3 py-2" variant="secondary" disabled={busyId === id} onClick={() => void update(id, "COMPLETED")}>Complete</Button>
                </div>
              </td>
            </tr>
          );
        })}
      </TableCard>
    </div>
  );
}
