"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input, Select, StatusBadge, Textarea } from "../../../components/ui";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { useApiResource } from "../../../hooks/use-api-resource";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro } from "../../../components/portal-ui";

export default function CustomerComplaintsPage() {
  const complaintsResource = useApiResource<unknown>(API_ENDPOINTS.customer.complaints, []);
  const bookingsResource = useApiResource<unknown>(API_ENDPOINTS.customer.bookings, []);
  const complaints = asList(complaintsResource.data, ["complaints", "items"]);
  const bookings = asList(bookingsResource.data, ["bookings", "items"]);
  const [bookingId, setBookingId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  if (complaintsResource.loading || bookingsResource.loading) return <LoadingState label="Loading complaints..." />;

  async function submitComplaint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    setSuccess("");
    try {
      await apiRequest({
        url: API_ENDPOINTS.customer.complaints,
        method: "POST",
        data: {
          booking_id: bookingId || undefined,
          subject,
          description,
          category: category || undefined,
        },
      });
      setBookingId("");
      setSubject("");
      setDescription("");
      setCategory("");
      setSuccess("Complaint submitted successfully.");
      await complaintsResource.reload();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, "Unable to submit complaint."));
    } finally {
      setSubmitting(false);
    }
  }

  const error = complaintsResource.error || bookingsResource.error;

  return (
    <div>
      <PageIntro
        eyebrow="Support tracking"
        title="My complaints"
        description="Raise support requests and follow admin status updates."
        action={<Button variant="ghost" onClick={() => void complaintsResource.reload()}>Refresh</Button>}
      />
      {error ? <ErrorBanner message={error} retry={() => { void complaintsResource.reload(); void bookingsResource.reload(); }} /> : null}
      <section className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <p className="text-sm font-bold uppercase text-blue-600">Raise complaint</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Contact support</h3>
          <form className="mt-5 grid gap-4" onSubmit={submitComplaint}>
            <Field label="Related booking">
              <Select value={bookingId} onChange={(event) => setBookingId(event.target.value)}>
                <option value="">No booking selected</option>
                {bookings.map((booking, index) => {
                  const id = readBookingId(booking);
                  return <option key={`${id}-${index}`} value={id}>{bookingLabel(booking)}</option>;
                })}
              </Select>
            </Field>
            <Field label="Category">
              <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Payment, session, certificate..." />
            </Field>
            <Field label="Subject">
              <Input required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Short complaint subject" />
            </Field>
            <Field label="Description">
              <Textarea required rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explain what happened and what help you need." />
            </Field>
            <FormError message={formError} />
            {success ? <p className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">{success}</p> : null}
            <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit complaint"}</Button>
          </form>
        </Card>
        <div className="grid gap-4">
          {complaints.map((complaint, index) => (
            <Card key={`${readValue(complaint, "id", "_id", "complaint_id", "complaintId")}-${index}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <StatusBadge status={readValue(complaint, "status")} />
                  <h3 className="mt-3 text-xl font-black text-slate-950">{readValue(complaint, "subject", "title")}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{shortId(readValue(complaint, "complaint_id", "complaintId", "id", "_id"))}</p>
                </div>
                <p className="text-xs font-semibold text-slate-400">{dateText(readValue(complaint, "updated_at", "updatedAt", "created_at", "createdAt"))}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{readValue(complaint, "description")}</p>
              <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-2">
                <Detail label="Booking" value={shortId(readValue(complaint, "booking_id", "bookingId"))} />
                <Detail label="Category" value={readValue(complaint, "category") || "-"} />
                <Detail label="Admin response" value={readValue(complaint, "admin_response", "adminResponse") || "-"} />
                <Detail label="Created" value={dateText(readValue(complaint, "created_at", "createdAt"))} />
              </div>
            </Card>
          ))}
          {!complaints.length ? (
            <Card>
              <p className="text-sm leading-6 text-slate-600">No complaints yet. New support requests will appear here with admin status updates.</p>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function readBookingId(booking: ApiRecord) {
  return readValue(booking, "booking_id", "bookingId", "id", "_id");
}

function bookingLabel(booking: ApiRecord) {
  return `${readValue(booking, "course_name", "courseName")} - ${readValue(booking, "school_name", "schoolName")}`;
}

function readValue(record: ApiRecord, ...keys: string[]) {
  const value = text(record, ...keys);
  return value === "-" ? "" : value;
}

function shortId(value: string) {
  if (!value) return "-";
  return value.length > 12 ? `${value.slice(0, 10)}...` : value;
}
