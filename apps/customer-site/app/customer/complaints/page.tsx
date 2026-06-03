import { CollectionPage } from "../../../components/collection-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function CustomerComplaintsPage() {
  return <CollectionPage endpoint={API_ENDPOINTS.customer.complaints} eyebrow="Support tracking" title="My complaints" description="Follow support requests and their current resolution status." listKeys={["complaints", "items"]} columns={[
    { label: "Complaint", keys: ["id", "_id"] },
    { label: "Subject", keys: ["subject", "title"] },
    { label: "Booking", keys: ["bookingId"] },
    { label: "Status", keys: ["status"], format: "status" },
    { label: "Created", keys: ["createdAt"], format: "date" }
  ]} />;
}
