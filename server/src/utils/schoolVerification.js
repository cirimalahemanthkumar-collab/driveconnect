const partnerSchoolRequiredFields = [
  "school_name",
  "owner_name",
  "owner_phone",
  "owner_email",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "pincode",
  "google_maps_link",
  "license_number",
  "license_document_url",
  "owner_id_proof_url",
  "pan_number",
  "bank_account_name",
  "bank_account_number",
  "ifsc",
  "upi_id",
  "working_hours",
  "service_radius_km",
  "pickup_drop_available",
  "description",
];

function cleanText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function cleanOptionalText(value) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPositiveInteger(value, fallback = 10) {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "yes", "on"].includes(normalized);
  }
  return false;
}

function getMissingPartnerSchoolFields(body) {
  if (!body || typeof body !== "object") {
    return [...partnerSchoolRequiredFields];
  }

  return partnerSchoolRequiredFields.filter((field) => {
    const value = body[field];

    if (field === "pickup_drop_available") {
      return !(
        typeof value === "boolean" ||
        value === "true" ||
        value === "false" ||
        value === "1" ||
        value === "0"
      );
    }

    if (field === "service_radius_km") {
      const parsed = Number(value);
      return !Number.isFinite(parsed) || parsed <= 0;
    }

    return !cleanText(value);
  });
}

function normalizeSubmittedStatus(status) {
  const normalized = cleanText(status).toUpperCase();

  if (normalized === "VERIFIED") return "APPROVED";
  if (normalized === "UNDER_REVIEW") return "PENDING";
  if (["APPROVED", "PENDING", "REJECTED", "SUSPENDED"].includes(normalized)) {
    return normalized;
  }

  return null;
}

function displayStatus(status) {
  return normalizeSubmittedStatus(status) || "PENDING";
}

function firstValue(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function serializeSchool(school) {
  if (!school) return null;

  const schoolName = cleanText(firstValue(school, ["school_name", "schoolName", "name", "title"]));
  const ownerName = cleanText(firstValue(school, ["owner_name", "ownerName", "owner_full_name", "owner_account_name"]));
  const ownerPhone = cleanText(firstValue(school, ["owner_phone", "ownerPhone", "owner_account_phone"]));
  const ownerEmail = cleanText(firstValue(school, ["owner_email", "ownerEmail", "owner_account_email"]));
  const status = displayStatus(firstValue(school, ["status", "verification_status", "verificationStatus"]));
  const verificationStatus = displayStatus(firstValue(school, ["verification_status", "verificationStatus", "status"]));
  const pickupDropAvailable = toBoolean(firstValue(school, ["pickup_drop_available", "pickupDropAvailable", "pickup_available", "pickupAvailable"]));
  const serviceRadiusKm = toPositiveInteger(firstValue(school, ["service_radius_km", "serviceRadiusKm"]), 10);
  const averageRating = toNumber(firstValue(school, ["average_rating", "rating"]), 0);
  const totalReviews = toNumber(firstValue(school, ["total_reviews", "totalReviews"]), 0);

  return {
    ...school,
    id: school.id,
    school_id: school.id,
    school_name: schoolName,
    schoolName,
    name: schoolName,
    title: schoolName,
    owner_name: ownerName,
    ownerName,
    owner_phone: ownerPhone,
    ownerPhone,
    owner_email: ownerEmail,
    ownerEmail,
    google_maps_link: cleanText(firstValue(school, ["google_maps_link", "googleMapsLink"])),
    googleMapsLink: cleanText(firstValue(school, ["google_maps_link", "googleMapsLink"])),
    license_number: cleanText(firstValue(school, ["license_number", "licenseNumber"])),
    licenseNumber: cleanText(firstValue(school, ["license_number", "licenseNumber"])),
    license_document_url: cleanText(firstValue(school, ["license_document_url", "licenseDocumentUrl"])),
    licenseDocumentUrl: cleanText(firstValue(school, ["license_document_url", "licenseDocumentUrl"])),
    owner_id_proof_url: cleanText(firstValue(school, ["owner_id_proof_url", "ownerIdProofUrl"])),
    ownerIdProofUrl: cleanText(firstValue(school, ["owner_id_proof_url", "ownerIdProofUrl"])),
    pan_number: cleanText(firstValue(school, ["pan_number", "panNumber"])),
    panNumber: cleanText(firstValue(school, ["pan_number", "panNumber"])),
    gst_number: firstValue(school, ["gst_number", "gstNumber"]) || null,
    gstNumber: firstValue(school, ["gst_number", "gstNumber"]) || null,
    bank_account_name: cleanText(firstValue(school, ["bank_account_name", "bankAccountName"])),
    bankAccountName: cleanText(firstValue(school, ["bank_account_name", "bankAccountName"])),
    bank_account_number: cleanText(firstValue(school, ["bank_account_number", "bankAccountNumber"])),
    bankAccountNumber: cleanText(firstValue(school, ["bank_account_number", "bankAccountNumber"])),
    ifsc: cleanText(firstValue(school, ["ifsc"])),
    upi_id: cleanText(firstValue(school, ["upi_id", "upiId"])),
    upiId: cleanText(firstValue(school, ["upi_id", "upiId"])),
    working_hours: cleanText(firstValue(school, ["working_hours", "workingHours"])),
    workingHours: cleanText(firstValue(school, ["working_hours", "workingHours"])),
    pickup_drop_available: pickupDropAvailable,
    pickupDropAvailable,
    pickupAvailable: pickupDropAvailable,
    service_radius_km: serviceRadiusKm,
    serviceRadiusKm,
    status,
    verification_status: verificationStatus,
    verificationStatus,
    rejection_reason: firstValue(school, ["rejection_reason", "rejectionReason"]) || null,
    rejectionReason: firstValue(school, ["rejection_reason", "rejectionReason"]) || null,
    verification_submitted_at: firstValue(school, ["verification_submitted_at", "verificationSubmittedAt"]) || null,
    verificationSubmittedAt: firstValue(school, ["verification_submitted_at", "verificationSubmittedAt"]) || null,
    verification_reviewed_at: firstValue(school, ["verification_reviewed_at", "verificationReviewedAt"]) || null,
    verificationReviewedAt: firstValue(school, ["verification_reviewed_at", "verificationReviewedAt"]) || null,
    verification_reviewed_by: firstValue(school, ["verification_reviewed_by", "verificationReviewedBy"]) || null,
    verificationReviewedBy: firstValue(school, ["verification_reviewed_by", "verificationReviewedBy"]) || null,
    rating: averageRating,
    average_rating: averageRating,
    totalReviews,
    total_reviews: totalReviews,
    createdAt: firstValue(school, ["created_at", "createdAt"]) || null,
    updatedAt: firstValue(school, ["updated_at", "updatedAt"]) || null,
  };
}

module.exports = {
  cleanOptionalText,
  cleanText,
  displayStatus,
  getMissingPartnerSchoolFields,
  normalizeSubmittedStatus,
  serializeSchool,
  toBoolean,
  toNumber,
  toPositiveInteger,
};
