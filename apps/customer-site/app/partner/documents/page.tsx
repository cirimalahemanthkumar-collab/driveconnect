import { PartnerCrudPage } from "../../../components/partner-crud-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function PartnerDocumentsPage() {
  return <PartnerCrudPage endpoint={API_ENDPOINTS.partner.documents} eyebrow="Verification records" title="School documents" description="Submit school records for the platform verification workflow." listKeys={["documents", "items"]} createLabel="Submit document" fields={[
    { key: "documentType", label: "Document type", type: "select", options: ["REGISTRATION", "OWNER_ID", "ADDRESS_PROOF", "INSURANCE", "OTHER"], required: true },
    { key: "documentUrl", label: "Document URL", placeholder: "https://...", required: true },
    { key: "notes", label: "Notes", type: "textarea" }
  ]} columns={[
    { label: "Document", keys: ["documentType", "type"] },
    { label: "Status", keys: ["status", "verificationStatus"], format: "status" },
    { label: "Submitted", keys: ["createdAt", "uploadedAt"], format: "date" },
    { label: "Notes", keys: ["notes", "reviewNotes"] }
  ]} />;
}
