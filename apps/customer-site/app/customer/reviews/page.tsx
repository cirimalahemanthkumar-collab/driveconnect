import { CollectionPage } from "../../../components/collection-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function CustomerReviewsPage() {
  return <CollectionPage endpoint={API_ENDPOINTS.customer.reviews} eyebrow="Shared feedback" title="My reviews" description="Keep a record of the ratings and feedback you have shared." listKeys={["reviews", "items"]} columns={[
    { label: "Review", keys: ["id", "_id"] },
    { label: "School", keys: ["schoolName"] },
    { label: "Rating", keys: ["rating"] },
    { label: "Comment", keys: ["comment", "review"] },
    { label: "Created", keys: ["createdAt"], format: "date" }
  ]} />;
}
