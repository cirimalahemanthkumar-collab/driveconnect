import { NotificationsPage } from "../../../components/notifications-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function PartnerNotificationsPage() {
  return (
    <NotificationsPage
      endpoint={API_ENDPOINTS.partner.notifications}
      eyebrow="Inbox"
      title="Partner notifications"
      description="Track school verification, document, booking, course, session, and payout updates."
    />
  );
}
