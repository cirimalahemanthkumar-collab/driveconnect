import { PartnerCrudPage } from "../../../components/partner-crud-page";
import { API_ENDPOINTS } from "../../../lib/endpoints";

export default function PartnerVehiclesPage() {
  return <PartnerCrudPage endpoint={API_ENDPOINTS.partner.vehicles} eyebrow="School assets" title="Vehicles" description="Maintain the vehicles available for class scheduling." listKeys={["vehicles", "items"]} createLabel="Add vehicle" fields={[
    { key: "registrationNumber", label: "Registration number", required: true },
    { key: "vehicleType", label: "Vehicle type", type: "select", options: ["TWO_WHEELER", "FOUR_WHEELER", "LMV", "HMV"], required: true },
    { key: "make", label: "Make" },
    { key: "model", label: "Model", required: true },
    { key: "year", label: "Year", type: "number" }
  ]} columns={[
    { label: "Registration", keys: ["registrationNumber", "registrationNo"] },
    { label: "Type", keys: ["vehicleType", "type"] },
    { label: "Model", keys: ["model"] },
    { label: "Year", keys: ["year"] },
    { label: "Status", keys: ["status", "active"], format: "status" }
  ]} />;
}
