import { CollectionPage } from "../../../components/collection-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function CustomerNotificationsPage() {
  return <CollectionPage endpoint={API_ENDPOINTS.customer.notifications} eyebrow="Inbox" title="My notifications" description="See booking, payment, and class updates in one place." listKeys={["notifications", "items"]} columns={[
    { label: "Notification", keys: ["id", "_id"] },
    { label: "Title", keys: ["title", "type"] },
    { label: "Message", keys: ["message", "body"] },
    { label: "Status", keys: ["status", "read"], format: "status" },
    { label: "Created", keys: ["createdAt"], format: "date" }
  ]} />;
}
