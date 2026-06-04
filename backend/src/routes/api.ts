import { Router } from "express";
import type { DrivingSchool, Prisma, SchoolDocument, User } from "@prisma/client";
import { partnerSchoolRequiredFields, partnerSchoolVerificationSchema } from "@driveconnect/shared";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { requireAuthenticatedUserId } from "../lib/access.js";
import { requireRole } from "../lib/auth.js";
import { HttpError } from "../middleware/error.js";
import { z } from "zod";

type SchoolWithReviewRelations = DrivingSchool & {
  owner?: User | null;
  documents?: SchoolDocument[];
};

const adminSchoolStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
  rejection_reason: z.string().trim().optional()
});

export const apiRouter = Router();

apiRouter.get(
  "/partner/school",
  requireRole("SCHOOL_OWNER"),
  asyncHandler(async (req, res) => {
    const ownerId = requireAuthenticatedUserId(req);
    const school = await prisma.drivingSchool.findFirst({
      where: { ownerId },
      include: { owner: true, documents: true },
      orderBy: { updatedAt: "desc" }
    });

    res.json(school ? serializeSchool(school) : {});
  })
);

apiRouter.put(
  "/partner/school",
  requireRole("SCHOOL_OWNER"),
  asyncHandler(async (req, res) => {
    const missingFields = getMissingPartnerSchoolFields(req.body);

    if (missingFields.length) {
      throw new HttpError(400, `Missing required fields: ${missingFields.join(", ")}`);
    }

    const input = partnerSchoolVerificationSchema.parse(req.body);
    const ownerId = requireAuthenticatedUserId(req);
    const now = new Date();
    const schoolData = {
      name: input.school_name,
      description: input.description,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      ownerName: input.owner_name,
      ownerPhone: input.owner_phone,
      ownerEmail: input.owner_email,
      googleMapsLink: input.google_maps_link,
      licenseNumber: input.license_number,
      licenseDocumentUrl: input.license_document_url,
      ownerIdProofUrl: input.owner_id_proof_url,
      panNumber: input.pan_number,
      gstNumber: cleanOptionalText(input.gst_number),
      bankAccountName: input.bank_account_name,
      bankAccountNumber: input.bank_account_number,
      ifsc: input.ifsc,
      upiId: input.upi_id,
      workingHours: input.working_hours,
      pickupDropAvailable: input.pickup_drop_available,
      pickupAvailable: input.pickup_drop_available,
      serviceRadiusKm: input.service_radius_km,
      status: "PENDING" as const,
      verificationStatus: "PENDING" as const,
      verificationSubmittedAt: now,
      verificationReviewedAt: null,
      verificationReviewedBy: null,
      rejectionReason: null
    };

    const existing = await prisma.drivingSchool.findFirst({ where: { ownerId } });
    const school = existing
      ? await prisma.drivingSchool.update({
          where: { id: existing.id },
          data: schoolData,
          include: { owner: true, documents: true }
        })
      : await prisma.drivingSchool.create({
          data: {
            ...schoolData,
            ownerId,
            slug: createSchoolSlug(input.school_name),
            latitude: 0,
            longitude: 0
          },
          include: { owner: true, documents: true }
        });

    res.json(serializeSchool(school));
  })
);

apiRouter.get(
  "/marketplace/schools",
  asyncHandler(async (_req, res) => {
    const schools = await prisma.drivingSchool.findMany({
      where: { status: "APPROVED", verificationStatus: "APPROVED" },
      include: { courses: { where: { active: true }, take: 3 } },
      orderBy: [{ rating: "desc" }, { updatedAt: "desc" }]
    });

    res.json({ schools: schools.map(serializeSchool) });
  })
);

apiRouter.get(
  "/marketplace/courses",
  asyncHandler(async (req, res) => {
    const schoolId = req.query.schoolId?.toString();
    const courses = await prisma.course.findMany({
      where: {
        active: true,
        schoolId: schoolId || undefined,
        school: { status: "APPROVED", verificationStatus: "APPROVED" }
      },
      include: { school: true },
      orderBy: { updatedAt: "desc" }
    });

    res.json({ courses });
  })
);

apiRouter.get(
  "/admin/schools",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const where = getAdminStatusFilter(req.query.status?.toString());
    const schools = await prisma.drivingSchool.findMany({
      where,
      include: { owner: true, documents: true },
      orderBy: [{ verificationSubmittedAt: "desc" }, { updatedAt: "desc" }]
    });

    res.json({ schools: schools.map(serializeSchool) });
  })
);

apiRouter.patch(
  "/admin/schools/:id/status",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const input = adminSchoolStatusSchema.parse(req.body);
    const reviewStatus = input.status;
    const school = await prisma.drivingSchool.update({
      where: { id: req.params.id },
      data: {
        status: reviewStatus,
        verificationStatus: reviewStatus,
        rejectionReason: reviewStatus === "REJECTED" ? cleanOptionalText(input.rejection_reason) : null,
        verificationReviewedAt: new Date(),
        verificationReviewedBy: req.auth?.sub ?? null
      },
      include: { owner: true, documents: true }
    });

    await prisma.schoolDocument.updateMany({
      where: { schoolId: school.id },
      data: { status: reviewStatus }
    });

    res.json(serializeSchool(school));
  })
);

function getMissingPartnerSchoolFields(body: unknown) {
  if (!body || typeof body !== "object") return [...partnerSchoolRequiredFields];
  const payload = body as Record<string, unknown>;

  return partnerSchoolRequiredFields.filter((field) => {
    const value = payload[field];

    if (field === "pickup_drop_available") return typeof value !== "boolean";
    if (field === "service_radius_km") return value === undefined || value === null || String(value).trim() === "";
    if (typeof value === "string") return !value.trim();
    return value === undefined || value === null;
  });
}

function getAdminStatusFilter(status: string | undefined): Prisma.DrivingSchoolWhereInput | undefined {
  const normalizedStatus = normalizeSubmittedStatus(status);
  if (!status || status.toUpperCase() === "ALL") return undefined;

  if (!normalizedStatus) {
    throw new HttpError(400, "Status must be one of APPROVED, PENDING, REJECTED, or SUSPENDED.");
  }

  if (normalizedStatus === "PENDING") {
    return {
      OR: [
        { status: "PENDING" },
        { verificationStatus: "PENDING" },
        { verificationStatus: "UNDER_REVIEW" }
      ]
    };
  }

  return {
    OR: [
      { status: normalizedStatus },
      { verificationStatus: normalizedStatus },
      ...(normalizedStatus === "APPROVED" ? [{ verificationStatus: "VERIFIED" as const }] : [])
    ]
  };
}

function normalizeSubmittedStatus(status: string | undefined) {
  const normalized = status?.toUpperCase();
  if (normalized === "APPROVED" || normalized === "PENDING" || normalized === "REJECTED" || normalized === "SUSPENDED") {
    return normalized;
  }
  if (normalized === "VERIFIED") return "APPROVED";
  if (normalized === "UNDER_REVIEW") return "PENDING";
  return undefined;
}

function displayStatus(status: unknown) {
  if (status === "VERIFIED") return "APPROVED";
  if (status === "UNDER_REVIEW") return "PENDING";
  return String(status ?? "PENDING").toUpperCase();
}

function serializeSchool(school: SchoolWithReviewRelations) {
  const status = displayStatus(school.status ?? school.verificationStatus);
  const verificationStatus = displayStatus(school.verificationStatus ?? school.status);
  const ownerName = school.ownerName || school.owner?.name || "";
  const ownerPhone = school.ownerPhone || school.owner?.mobile || "";
  const ownerEmail = school.ownerEmail || school.owner?.email || "";

  return {
    id: school.id,
    school_id: school.id,
    school_name: school.name,
    schoolName: school.name,
    name: school.name,
    title: school.name,
    owner_name: ownerName,
    ownerName,
    owner_phone: ownerPhone,
    ownerPhone,
    owner_email: ownerEmail,
    ownerEmail,
    address: school.address,
    city: school.city,
    state: school.state,
    pincode: school.pincode,
    google_maps_link: school.googleMapsLink,
    googleMapsLink: school.googleMapsLink,
    license_number: school.licenseNumber,
    licenseNumber: school.licenseNumber,
    license_document_url: school.licenseDocumentUrl,
    licenseDocumentUrl: school.licenseDocumentUrl,
    owner_id_proof_url: school.ownerIdProofUrl,
    ownerIdProofUrl: school.ownerIdProofUrl,
    pan_number: school.panNumber,
    panNumber: school.panNumber,
    gst_number: school.gstNumber,
    gstNumber: school.gstNumber,
    bank_account_name: school.bankAccountName,
    bankAccountName: school.bankAccountName,
    bank_account_number: school.bankAccountNumber,
    bankAccountNumber: school.bankAccountNumber,
    ifsc: school.ifsc,
    upi_id: school.upiId,
    upiId: school.upiId,
    working_hours: school.workingHours,
    workingHours: school.workingHours,
    pickup_drop_available: school.pickupDropAvailable,
    pickupDropAvailable: school.pickupDropAvailable,
    pickupAvailable: school.pickupAvailable || school.pickupDropAvailable,
    description: school.description,
    phone: school.phone,
    email: school.email,
    service_radius_km: school.serviceRadiusKm,
    serviceRadiusKm: school.serviceRadiusKm,
    status,
    verification_status: verificationStatus,
    verificationStatus,
    rejection_reason: school.rejectionReason,
    rejectionReason: school.rejectionReason,
    verification_submitted_at: school.verificationSubmittedAt,
    verificationSubmittedAt: school.verificationSubmittedAt,
    verification_reviewed_at: school.verificationReviewedAt,
    verificationReviewedAt: school.verificationReviewedAt,
    verification_reviewed_by: school.verificationReviewedBy,
    verificationReviewedBy: school.verificationReviewedBy,
    rating: school.rating,
    totalReviews: school.totalReviews,
    createdAt: school.createdAt,
    updatedAt: school.updatedAt,
    documents: school.documents
  };
}

function createSchoolSlug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "school";
  return `${base}-${Date.now()}`;
}

function cleanOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
