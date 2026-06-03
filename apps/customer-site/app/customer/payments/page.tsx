import { CollectionPage } from "../../../components/collection-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function CustomerPaymentsPage() {
  return <CollectionPage endpoint={API_ENDPOINTS.customer.payments} eyebrow="Customer payments" title="My payments" description="Review payment status, transaction references, and booking amounts." listKeys={["payments", "items"]} columns={[
    { label: "Payment", keys: ["id", "_id"] },
    { label: "Booking", keys: ["bookingId"] },
    { label: "Amount", keys: ["amount", "total"], format: "money" },
    { label: "Status", keys: ["status"], format: "status" },
    { label: "Paid on", keys: ["paidAt", "createdAt"], format: "date" }
  ]} />;
}
