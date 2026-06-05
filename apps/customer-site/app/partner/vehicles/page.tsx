"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button, Card, Input, StatusBadge } from "../../../components/ui";
import { useApiResource } from "../../../hooks/use-api-resource";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

type VehicleForm = {
  vehicle_number: string;
  vehicle_type: string;
  model: string;
  transmission: string;
  fuel_type: string;
  is_active: string;
};

const vehicleTypeOptions = [
  { label: "Two Wheeler", value: "TWO_WHEELER" },
  { label: "Car / Four Wheeler", value: "CAR" },
  { label: "Heavy Vehicle", value: "HEAVY_VEHICLE" }
];
const transmissionOptions = ["MANUAL", "AUTOMATIC", "BOTH"];
const fuelTypeOptions = ["PETROL", "DIESEL", "CNG", "ELECTRIC"];
const statusOptions = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" }
];
const requiredFields = ["vehicle_number", "vehicle_type", "model", "transmission", "fuel_type"] as const;
type RequiredField = (typeof requiredFields)[number];
const requiredLabels: Record<RequiredField, string> = {
  vehicle_number: "Vehicle number",
  vehicle_type: "Vehicle type",
  model: "Model",
  transmission: "Transmission",
  fuel_type: "Fuel type"
};

export default function PartnerVehiclesPage() {
  const endpoint = API_ENDPOINTS.partner.vehicles;
  const resource = useApiResource<unknown>(endpoint, []);
  const vehicles = asList(resource.data, ["vehicles", "items"]);
  const [form, setForm] = useState<VehicleForm>(() => emptyVehicleForm());
  const [editingVehicle, setEditingVehicle] = useState<ApiRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const isEditing = Boolean(editingVehicle);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missingFields = getMissingFields(form);
    if (missingFields.length) {
      setFormError(`Missing required fields: ${missingFields.map((field) => requiredLabels[field]).join(", ")}`);
      return;
    }

    const vehicleId = editingVehicle ? getVehicleId(editingVehicle) : "";
    if (isEditing && !vehicleId) {
      setFormError("Unable to save changes because this vehicle does not have an ID.");
      return;
    }

    setSaving(true);
    setFormError("");
    setActionError("");
    try {
      await apiRequest({
        url: isEditing ? `${endpoint}/${vehicleId}` : endpoint,
        method: isEditing ? "PUT" : "POST",
        data: toPayload(form)
      });
      resetForm();
      await resource.reload();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(vehicle: ApiRecord) {
    setEditingVehicle(vehicle);
    setForm(formFromVehicle(vehicle));
    setFormError("");
    setActionError("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingVehicle(null);
    setForm(emptyVehicleForm());
    setFormError("");
  }

  async function toggleVehicleStatus(vehicle: ApiRecord) {
    const vehicleId = getVehicleId(vehicle);
    if (!vehicleId) {
      setActionError("Unable to update vehicle status because this vehicle does not have an ID.");
      return;
    }

    setTogglingId(vehicleId);
    setActionError("");
    try {
      await apiRequest({
        url: `${endpoint}/${vehicleId}/status`,
        method: "PATCH",
        data: { is_active: !isVehicleActive(vehicle) }
      });
      if (editingVehicle && getVehicleId(editingVehicle) === vehicleId) resetForm();
      await resource.reload();
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError));
    } finally {
      setTogglingId("");
    }
  }

  if (resource.loading) return <LoadingState label="Loading vehicles..." />;

  return (
    <div>
      <PageIntro eyebrow="School assets" title="Vehicles" description="Maintain the vehicles available for class scheduling." action={<Button variant="ghost" onClick={() => void resource.reload()}>Refresh</Button>} />
      {resource.error ? <ErrorBanner message={resource.error} retry={() => void resource.reload()} /> : null}
      <Card className="mt-6">
        <form className="grid gap-4" onSubmit={save}>
          <div>
            <p className="text-sm font-bold uppercase text-green-700">{isEditing ? "Editing" : "Add new"}</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{isEditing ? "Edit vehicle" : "Add vehicle"}</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Vehicle number">
              <Input value={form.vehicle_number} onChange={(event) => updateForm(setForm, "vehicle_number", event.target.value)} required />
            </Field>
            <Field label="Vehicle type">
              <SelectControl value={form.vehicle_type} onChange={(value) => updateForm(setForm, "vehicle_type", value)} required>
                <option value="">Select</option>
                {vehicleTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </SelectControl>
            </Field>
            <Field label="Model">
              <Input value={form.model} onChange={(event) => updateForm(setForm, "model", event.target.value)} required />
            </Field>
            <Field label="Transmission">
              <SelectControl value={form.transmission} onChange={(value) => updateForm(setForm, "transmission", value)} required>
                <option value="">Select</option>
                {transmissionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </SelectControl>
            </Field>
            <Field label="Fuel type">
              <SelectControl value={form.fuel_type} onChange={(value) => updateForm(setForm, "fuel_type", value)} required>
                <option value="">Select</option>
                {fuelTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </SelectControl>
            </Field>
            <Field label="Status">
              <SelectControl value={form.is_active} onChange={(value) => updateForm(setForm, "is_active", value)}>
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </SelectControl>
            </Field>
          </div>
          <FormError message={formError} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="w-fit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : "Add vehicle"}</Button>
            {isEditing ? <Button type="button" variant="ghost" className="w-fit" onClick={resetForm}>Cancel</Button> : null}
          </div>
        </form>
      </Card>

      <FormError message={actionError} />
      <TableCard columns={["Vehicle", "Type", "Model", "Transmission", "Fuel", "Status", "Actions"]} empty={!vehicles.length}>
        {vehicles.map((vehicle, index) => {
          const vehicleId = getVehicleId(vehicle);
          const active = isVehicleActive(vehicle);
          const toggling = Boolean(vehicleId) && togglingId === vehicleId;
          return (
            <tr key={vehicleId || `${text(vehicle, "vehicle_number", "registration_number", "registrationNumber")}-${index}`}>
              <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">{text(vehicle, "vehicle_number", "registration_number", "registrationNumber")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{vehicleTypeLabel(text(vehicle, "vehicle_type", "vehicleType"))}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(vehicle, "model", "vehicle_model", "vehicleModel")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(vehicle, "transmission")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700">{text(vehicle, "fuel_type", "fuelType")}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-700"><StatusBadge status={active ? "ACTIVE" : "INACTIVE"} /></td>
              <td className="whitespace-nowrap px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" className="min-h-9 px-3 py-2" onClick={() => startEdit(vehicle)}>Edit</Button>
                  <Button variant="ghost" className="min-h-9 px-3 py-2" onClick={() => void toggleVehicleStatus(vehicle)} disabled={toggling}>
                    {toggling ? "Saving..." : active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </TableCard>
    </div>
  );
}

function SelectControl({
  children,
  value,
  onChange,
  required = false
}: {
  children: ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <select className="focus-ring min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm" value={value} onChange={(event) => onChange(event.target.value)} required={required}>
      {children}
    </select>
  );
}

function updateForm(setForm: (value: (current: VehicleForm) => VehicleForm) => void, key: keyof VehicleForm, value: string) {
  setForm((current) => ({ ...current, [key]: value }));
}

function emptyVehicleForm(): VehicleForm {
  return {
    vehicle_number: "",
    vehicle_type: "",
    model: "",
    transmission: "",
    fuel_type: "",
    is_active: "true"
  };
}

function formFromVehicle(vehicle: ApiRecord): VehicleForm {
  return {
    vehicle_number: cleanValue(text(vehicle, "vehicle_number", "registration_number", "registrationNumber")),
    vehicle_type: normalizeVehicleTypeValue(cleanValue(text(vehicle, "vehicle_type", "vehicleType"))),
    model: cleanValue(text(vehicle, "model", "vehicle_model", "vehicleModel")),
    transmission: cleanValue(text(vehicle, "transmission")),
    fuel_type: cleanValue(text(vehicle, "fuel_type", "fuelType")),
    is_active: isVehicleActive(vehicle) ? "true" : "false"
  };
}

function toPayload(form: VehicleForm) {
  const vehicleNumber = form.vehicle_number.trim();
  return {
    vehicle_number: vehicleNumber,
    registration_number: vehicleNumber,
    vehicle_type: normalizeVehicleTypeValue(form.vehicle_type),
    model: form.model.trim(),
    transmission: form.transmission,
    fuel_type: form.fuel_type,
    is_active: form.is_active === "true"
  };
}

function getMissingFields(form: VehicleForm) {
  return requiredFields.filter((field) => !form[field].trim());
}

function getVehicleId(vehicle: ApiRecord) {
  return cleanValue(text(vehicle, "id", "_id", "vehicle_id", "vehicleId"));
}

function isVehicleActive(vehicle: ApiRecord) {
  const value = vehicle.is_active ?? vehicle.active ?? vehicle.status;
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "ACTIVE").toUpperCase();
  return !["FALSE", "INACTIVE", "DISABLED", "SUSPENDED"].includes(normalized);
}

function normalizeVehicleTypeValue(value: string) {
  if (value === "FOUR_WHEELER") return "CAR";
  return value;
}

function vehicleTypeLabel(value: string) {
  const normalized = normalizeVehicleTypeValue(cleanValue(value));
  const fallback = cleanValue(value);
  return vehicleTypeOptions.find((option) => option.value === normalized)?.label ?? (fallback || "-");
}

function cleanValue(value: string) {
  return value === "-" ? "" : value;
}
