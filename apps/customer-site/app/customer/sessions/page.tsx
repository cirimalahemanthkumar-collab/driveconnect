import { CollectionPage } from "../../../components/collection-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function CustomerSessionsPage() {
  return <CollectionPage endpoint={API_ENDPOINTS.customer.sessions} eyebrow="Class tracking" title="My sessions" description="See scheduled classes and your latest learning progress." listKeys={["sessions", "items"]} columns={[
    { label: "Session", keys: ["id", "_id"] },
    { label: "Date", keys: ["scheduledAt", "date", "startTime"], format: "date" },
    { label: "Instructor", keys: ["instructorName"] },
    { label: "Status", keys: ["status"], format: "status" },
    { label: "Notes", keys: ["notes", "progressNotes"] }
  ]} />;
}
