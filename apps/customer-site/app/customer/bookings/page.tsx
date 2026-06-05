"use client";

import { Button, Card, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, nestedText, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

export default function CustomerBookingsPage() {
  const resource = useApiResource<unknown>(API_ENDPOINTS.customer.bookings, []);
  const bookings = asList(resource.data, ["bookings", "items"]);

  if (resource.loading) return <LoadingState label="Loading your bookings..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Customer bookings"
        title="My bookings"
        description="Track every request from booking through school confirmation and completion."
        action={<Button variant="ghost" onClick={() => void resource.reload()}>Refresh</Button>}
      />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}

      {!bookings.length && !resource.error ? (
        <Card className="mt-5">
          <p className="text-sm leading-6 text-slate-600">No bookings yet. Choose a course from the marketplace when you are ready.</p>
        </Card>
      ) : (
        <TableCard columns={["Booking", "School", "Course", "Status", "Created"]}>
          {bookings.map((booking, index) => {
            const id = readValue(booking, "booking_id", "bookingId", "id", "_id");
            return (
              <tr key={`${id}-${index}`} className="text-slate-700">
                <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-950">{shortBookingId(id)}</td>
                <td className="px-4 py-4">{readSchoolName(booking)}</td>
                <td className="px-4 py-4">{readCourseName(booking)}</td>
                <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={readStatus(booking)} /></td>
                <td className="whitespace-nowrap px-4 py-4">{dateText(readValue(booking, "created_at", "createdAt"))}</td>
              </tr>
            );
          })}
        </TableCard>
      )}
    </div>
  );
}

function readSchoolName(booking: ApiRecord) {
  return firstText(
    readValue(booking, "school_name", "schoolName"),
    nestedText(booking, "school", "name", "school_name", "schoolName")
  );
}

function readCourseName(booking: ApiRecord) {
  return firstText(
    readValue(booking, "course_name", "courseName"),
    nestedText(booking, "course", "course_name", "courseName", "title", "name")
  );
}

function readStatus(booking: ApiRecord) {
  return firstText(readValue(booking, "status", "booking_status", "bookingStatus"), "PENDING");
}

function readValue(record: ApiRecord, ...keys: string[]) {
  const value = text(record, ...keys);
  return value === "-" ? "" : value.trim();
}

function firstText(...values: string[]) {
  return values.map((value) => (value === "-" ? "" : value.trim())).find(Boolean) || "-";
}

function shortBookingId(id: string) {
  if (!id) return "-";
  return id.length > 10 ? `${id.slice(0, 8)}...` : id;
}
