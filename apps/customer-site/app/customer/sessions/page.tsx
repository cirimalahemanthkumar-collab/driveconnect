"use client";

import { Button, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

export default function CustomerSessionsPage() {
  const resource = useApiResource<unknown>(API_ENDPOINTS.customer.sessions, []);
  const sessions = asList(resource.data, ["sessions", "items"]);

  if (resource.loading) return <LoadingState label="Loading your class sessions..." />;

  return (
    <div>
      <PageIntro
        eyebrow="Class tracking"
        title="My sessions"
        description="See scheduled classes and derived class progress from accepted or completed bookings."
        action={<Button variant="ghost" onClick={() => void resource.reload()}>Refresh</Button>}
      />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      <TableCard columns={["Class", "School", "Vehicle", "Schedule", "Instructor", "Vehicle assigned", "Status"]} empty={!sessions.length}>
        {sessions.map((session, index) => (
          <tr key={`${readValue(session, "id", "_id", "booking_id", "bookingId")}-${index}`} className="text-slate-700">
            <td className="px-4 py-4">
              <p className="font-semibold text-slate-950">{readValue(session, "course_name", "courseName")}</p>
              <p className="mt-1 text-xs text-slate-500">{shortId(readValue(session, "booking_id", "bookingId"))}</p>
            </td>
            <td className="px-4 py-4">{readValue(session, "school_name", "schoolName")}</td>
            <td className="px-4 py-4">
              <p>{readValue(session, "vehicle_type", "vehicleType").replace(/_/g, " ")}</p>
              <p className="mt-1 text-xs text-slate-500">{readValue(session, "transmission").replace(/_/g, " ")}</p>
            </td>
            <td className="whitespace-nowrap px-4 py-4">{formatSchedule(session)}</td>
            <td className="px-4 py-4">{readValue(session, "instructor_name", "instructorName") || "-"}</td>
            <td className="px-4 py-4">{readValue(session, "vehicle_number", "vehicleNumber") || "-"}</td>
            <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={readValue(session, "status")} /></td>
          </tr>
        ))}
      </TableCard>
    </div>
  );
}

function formatSchedule(session: ApiRecord) {
  const date = dateText(readValue(session, "session_date", "sessionDate", "requested_date", "requestedDate"));
  const time = readValue(session, "session_time", "sessionTime", "start_time", "startTime");
  return time ? `${date} ${time}` : date;
}

function readValue(record: ApiRecord, ...keys: string[]) {
  const value = text(record, ...keys);
  return value === "-" ? "" : value;
}

function shortId(value: string) {
  if (!value) return "-";
  return value.length > 12 ? `${value.slice(0, 10)}...` : value;
}
