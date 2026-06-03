import { PartnerCrudPage } from "../../../components/partner-crud-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function PartnerCoursesPage() {
  return <PartnerCrudPage endpoint={API_ENDPOINTS.partner.courses} eyebrow="Course catalogue" title="Courses" description="Publish packages that customers can discover and compare." listKeys={["courses", "items"]} createLabel="Add course" fields={[
    { key: "title", label: "Course title", required: true },
    { key: "vehicleType", label: "Vehicle type", type: "select", options: ["TWO_WHEELER", "FOUR_WHEELER", "BOTH"], required: true },
    { key: "courseType", label: "Course type", type: "select", options: ["BEGINNER", "ADVANCED", "REFRESHER", "TEST_PREP"], required: true },
    { key: "totalSessions", label: "Total sessions", type: "number", required: true },
    { key: "durationDays", label: "Duration days", type: "number", required: true },
    { key: "price", label: "Price", type: "number", required: true },
    { key: "advanceAmount", label: "Advance amount", type: "number", required: true },
    { key: "description", label: "Description", type: "textarea" }
  ]} columns={[
    { label: "Course", keys: ["title", "name"] },
    { label: "Vehicle", keys: ["vehicleType"] },
    { label: "Sessions", keys: ["totalSessions", "sessions"] },
    { label: "Price", keys: ["price"], format: "money" },
    { label: "Status", keys: ["status", "active"], format: "status" }
  ]} />;
}
