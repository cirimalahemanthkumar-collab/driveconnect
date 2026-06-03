import { PartnerCrudPage } from "../../../components/partner-crud-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function PartnerInstructorsPage() {
  return <PartnerCrudPage endpoint={API_ENDPOINTS.partner.instructors} eyebrow="School assets" title="Instructors" description="Keep your instructor roster current for customer assignments." listKeys={["instructors", "items"]} createLabel="Add instructor" fields={[
    { key: "name", label: "Instructor name", required: true },
    { key: "phone", label: "Phone", required: true },
    { key: "email", label: "Email" },
    { key: "licenseNumber", label: "Licence number", required: true },
    { key: "experienceYears", label: "Experience years", type: "number" }
  ]} columns={[
    { label: "Instructor", keys: ["name"] },
    { label: "Phone", keys: ["phone", "mobile"] },
    { label: "Licence", keys: ["licenseNumber", "licenceNumber"] },
    { label: "Experience", keys: ["experienceYears", "experience"] },
    { label: "Status", keys: ["status", "active"], format: "status" }
  ]} />;
}
