import { PartnerCrudPage } from "../../../components/partner-crud-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function PartnerCoursesPage() {
  return <PartnerCrudPage endpoint={API_ENDPOINTS.partner.courses} eyebrow="Course catalogue" title="Courses" description="Publish packages that customers can discover and compare." listKeys={["courses", "items"]} createLabel="Add course" fields={[
    { key: "course_name", label: "Course title", required: true },
    { key: "vehicle_type", label: "Vehicle type", type: "select", options: ["TWO_WHEELER", "FOUR_WHEELER", "BOTH"], required: true },
    { key: "course_type", label: "Course type", type: "select", options: ["BEGINNER", "ADVANCED", "REFRESHER", "TEST_PREP"], required: true },
    { key: "transmission", label: "Transmission", type: "select", options: ["MANUAL", "AUTOMATIC", "BOTH"], required: true },
    { key: "total_sessions", label: "Total sessions", type: "number", required: true },
    { key: "duration_days", label: "Duration days", type: "number", required: true },
    { key: "price", label: "Price", type: "number", required: true },
    { key: "advance_amount", label: "Advance amount", type: "number" },
    { key: "description", label: "Description", type: "textarea" }
  ]} columns={[
    { label: "Course", keys: ["course_name", "title", "name"] },
    { label: "Vehicle", keys: ["vehicle_type", "vehicleType"] },
    { label: "Sessions", keys: ["total_sessions", "totalSessions", "sessions"] },
    { label: "Price", keys: ["price"], format: "money" },
    { label: "Status", keys: ["status", "active"], format: "status" }
  ]} />;
}
