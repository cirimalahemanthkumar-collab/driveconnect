"use client";

import { useState } from "react";
import { Button, StatusBadge } from "../../../../web/components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, text } from "../../../lib/records";
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
      <TableCard columns={["Customer", "Course", "Requested", "Status", "Actions"]} empty={!bookings.length}>
        {bookings.map((booking, index) => {
          const id = text(booking, "id", "_id");
          const busy = busyId === id;
          return (
            <tr key={id + index}>
              <td className="px-4 py-4 font-semibold text-slate-950">{text(booking, "customerName", "customer")}</td>
              <td className="px-4 py-4 text-slate-700">{text(booking, "courseTitle", "courseName")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{dateText(booking.preferredStartDate ?? booking.createdAt)}</td>
              <td className="px-4 py-4"><StatusBadge status={text(booking, "status")} /></td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button className="min-h-9 px-3 py-2" disabled={busy} onClick={() => void updateStatus(id, "SCHOOL_ACCEPTED")}>Accept</Button>
                  <Button className="min-h-9 px-3 py-2" variant="ghost" disabled={busy} onClick={() => void updateStatus(id, "SCHOOL_REJECTED")}>Reject</Button>
                  <Button className="min-h-9 px-3 py-2" variant="secondary" disabled={busy} onClick={() => void complete(id)}>Complete</Button>
                </div>
              </td>
            </tr>
          );
        })}
      </TableCard>
    </div>
  );
}
