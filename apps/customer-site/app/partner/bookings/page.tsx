"use client";

import { useState } from "react";
import { Button, Card, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, nestedText, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

export default function PartnerBookingsPage() {
  const resource = useApiResource<unknown>(API_ENDPOINTS.partner.bookings, []);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");
  const bookings = asList(resource.data, ["bookings", "items"]);

  async function updateStatus(bookingId: string, status: string) {
    setBusyId(bookingId);
    setActionError("");
    try {
      await apiRequest({ url: `${API_ENDPOINTS.partner.bookings}/${bookingId}/status`, method: "PATCH", data: { status } });
      await resource.reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setBusyId("");
    }
  }

  async function complete(bookingId: string) {
    setBusyId(bookingId);
    setActionError("");
    try {
      await apiRequest({ url: `${API_ENDPOINTS.partner.bookings}/${bookingId}/complete`, method: "PATCH" });
      await resource.reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setBusyId("");
    }
  }

  if (resource.loading) return <LoadingState label="Loading booking requests..." />;

  return (
    <div>
      <PageIntro eyebrow="Partner bookings" title="Booking requests" description="Accept new slot requests, reject unavailable timings, and mark finished courses complete." action={<Button variant="ghost" onClick={() => void resource.reload()}>Refresh</Button>} />
      {resource.error || actionError ? <ErrorBanner message={resource.error || actionError} retry={() => void resource.reload()} /> : null}
      {!bookings.length && !resource.error ? (
        <Card className="mt-5">
          <p className="text-sm leading-6 text-slate-600">New customer booking requests will appear here.</p>
        </Card>
      ) : (
        <TableCard columns={["Customer", "Course", "Requested", "Status", "Actions"]}>
          {bookings.map((booking, index) => {
            const id = readValue(booking, "booking_id", "bookingId", "id", "_id");
            const status = readStatus(booking);
            const busy = busyId === id;
            const pending = status === "PENDING";
            const completable = status === "ACCEPTED" || status === "ONGOING";
            return (
              <tr key={`${id}-${index}`}>
                <td className="px-4 py-4 font-semibold text-slate-950">{readCustomerName(booking)}</td>
                <td className="px-4 py-4 text-slate-700">{readCourseName(booking)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-700">{readRequestedAt(booking)}</td>
                <td className="px-4 py-4"><StatusBadge status={status} /></td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button className="min-h-9 px-3 py-2" disabled={busy || !pending} onClick={() => void updateStatus(id, "ACCEPTED")}>Accept</Button>
                    <Button className="min-h-9 px-3 py-2" variant="ghost" disabled={busy || !pending} onClick={() => void updateStatus(id, "REJECTED")}>Reject</Button>
                    <Button className="min-h-9 px-3 py-2" variant="secondary" disabled={busy || !completable} onClick={() => void complete(id)}>Complete</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </TableCard>
      )}
    </div>
  );
}

function readCustomerName(booking: ApiRecord) {
  return firstText(
    readValue(booking, "customer_name", "customerName"),
    nestedText(booking, "customer", "name", "full_name", "fullName"),
    nestedText(booking, "user", "full_name", "fullName", "name")
  );
}

function readCourseName(booking: ApiRecord) {
  return firstText(
    readValue(booking, "course_name", "courseName"),
    nestedText(booking, "course", "course_name", "courseName", "title", "name")
  );
}

function readRequestedAt(booking: ApiRecord) {
  const requestedDate = firstText(
    readValue(booking, "requested_date", "preferred_date", "session_date", "preferred_start_date", "preferredStartDate"),
    readValue(booking, "created_at", "createdAt")
  );
  const requestedTime = readValue(booking, "requested_time", "preferred_time", "session_time");
  const formattedDate = requestedDate ? dateText(requestedDate) : "-";
  return requestedTime ? `${formattedDate} ${requestedTime}` : formattedDate;
}

function readStatus(booking: ApiRecord) {
  return firstText(readValue(booking, "status", "booking_status", "bookingStatus"), "PENDING").toUpperCase();
}

function readValue(record: ApiRecord, ...keys: string[]) {
  const value = text(record, ...keys);
  return value === "-" ? "" : value.trim();
}

function firstText(...values: string[]) {
  return values.map((value) => (value === "-" ? "" : value.trim())).find(Boolean) || "-";
}
