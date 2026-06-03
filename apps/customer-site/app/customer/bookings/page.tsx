import { CollectionPage } from "../../../components/collection-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function CustomerBookingsPage() {
  return <CollectionPage endpoint={API_ENDPOINTS.customer.bookings} eyebrow="Customer bookings" title="My bookings" description="Track every request from booking through school confirmation and completion." listKeys={["bookings", "items"]} columns={[
    { label: "Booking", keys: ["id", "_id"] },
    { label: "School", keys: ["schoolName"] },
    { label: "Course", keys: ["courseTitle", "courseName"] },
    { label: "Status", keys: ["status"], format: "status" },
    { label: "Created", keys: ["createdAt"], format: "date" }
  ]} />;
}

