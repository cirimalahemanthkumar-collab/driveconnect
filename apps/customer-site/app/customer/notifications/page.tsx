import { NotificationsPage } from "../../../components/notifications-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function CustomerNotificationsPage() {
  return (
    <NotificationsPage
      endpoint={API_ENDPOINTS.customer.notifications}
      eyebrow="Inbox"
      title="My notifications"
      description="See booking, payment, class, complaint, and review updates in one place."
    />
  );
}
