import { Router } from "express";
import type { CourseType, VehicleType } from "@prisma/client";
import { distanceKm, documentUploadSchema, schoolRegistrationSchema, schoolUpdateSchema } from "@driveconnect/shared";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, validateBody } from "../lib/http.js";
import { HttpError } from "../middleware/error.js";
import { scoreSchool } from "../services/ranking.js";
import { assertSchoolAccess, requireAuthenticatedUserId } from "../lib/access.js";
import { issueAuthToken, requireAuth, requireRole } from "../lib/auth.js";
import { createCloudinaryUploadSignature } from "../services/cloudinaryService.js";
import { z } from "zod";

export const schoolsRouter = Router();

schoolsRouter.post(
  "/register",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = validateBody(schoolRegistrationSchema, req.body);
    const ownerId = requireAuthenticatedUserId(req);
    const currentUser = await prisma.user.findUnique({ where: { id: ownerId } });

    if (!currentUser) {
      throw new HttpError(404, "Partner account not found.");
    }

    if (!["CUSTOMER", "SCHOOL_OWNER"].includes(currentUser.role)) {
      throw new HttpError(403, "Only customer accounts can register as partners.");
    }

    if (currentUser.mobile !== data.ownerMobile) {
      throw new HttpError(403, "Register the school with the mobile number used for OTP login.");
    }

    const owner = await prisma.user.update({
      where: { id: ownerId },
      data: { name: data.ownerName, role: "SCHOOL_OWNER" }
    });

    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
    const school = await prisma.drivingSchool.create({
      data: {
        ownerId: owner.id,
        name: data.name,
        slug,
        description: data.description,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        pickupAvailable: data.pickupAvailable,
        femaleInstructorAvailable: data.femaleInstructorAvailable,
        commissionPercentage: data.commissionPercentage,
        status: "PENDING",
        verificationStatus: "PENDING",
        verificationSubmittedAt: new Date()
      }
    });

    res.status(201).json({ school, token: issueAuthToken(owner) });
  })
);

schoolsRouter.get(
  "/nearby",
  asyncHandler(async (req, res) => {
    const lat = req.query.lat ? Number(req.query.lat) : 12.9716;
    const lng = req.query.lng ? Number(req.query.lng) : 77.5946;
    const vehicleType = req.query.vehicleType?.toString();
    const courseType = req.query.courseType?.toString();
    const minRating = req.query.rating ? Number(req.query.rating) : 0;
    const maxPrice = req.query.price ? Number(req.query.price) : undefined;
    const genderInstructor = req.query.genderInstructor?.toString();
    const pickupAvailable = req.query.pickupAvailable === "true";

    const schools = await prisma.drivingSchool.findMany({
      where: {
        status: "APPROVED",
        verificationStatus: "APPROVED",
        rating: { gte: minRating },
        pickupAvailable: pickupAvailable ? true : undefined,
        femaleInstructorAvailable: genderInstructor === "FEMALE" ? true : undefined,
        courses: {
          some: {
            active: true,
            vehicleType: vehicleType ? (vehicleType as VehicleType) : undefined,
            type: courseType ? (courseType as CourseType) : undefined,
            price: maxPrice ? { lte: maxPrice } : undefined
          }
        }
      },
      include: {
        courses: { where: { active: true }, take: 3 },
        featuredListings: true,
        reviews: { take: 3, orderBy: { createdAt: "desc" } }
      }
    });

    const now = new Date();
    const ranked = schools
      .map((school) => {
        const distance = distanceKm(lat, lng, school.latitude, school.longitude);
        const activeFeatured = school.featuredListings.find(
          (listing) => listing.active && listing.startsAt <= now && listing.endsAt >= now
        );
        const score = scoreSchool({
          verified: school.status === "APPROVED" && school.verificationStatus === "APPROVED",
          distanceKm: distance,
          rating: school.rating,
          totalReviews: school.totalReviews,
          availabilityScore: school.availabilityScore,
          featuredBoost: activeFeatured?.boostScore ?? 0,
          complaintPenalty: school.complaintPenalty
        });

        return { ...school, distanceKm: distance, rankingScore: score };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore);

    res.json(ranked);
  })
);

schoolsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const school = await prisma.drivingSchool.findUnique({
      where: { id: req.params.id },
      include: {
        courses: { where: { active: true } },
        reviews: { include: { customer: true }, orderBy: { createdAt: "desc" } }
      }
    });

    if (!school || school.status !== "APPROVED" || school.verificationStatus !== "APPROVED") {
      throw new HttpError(404, "School not found");
    }

    res.json(school);
  })
);

schoolsRouter.get(
  "/:id/bookings",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    await assertSchoolAccess(req, req.params.id);
    const bookings = await prisma.booking.findMany({
      where: { schoolId: req.params.id },
      include: {
        customer: { include: { user: true } },
        course: true,
        instructor: true,
        sessions: true,
        payment: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(bookings);
  })
);

schoolsRouter.get(
  "/:id/earnings",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const school = await assertSchoolAccess(req, req.params.id);

    const [paymentTotals, settlements, recentBookings] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: "SUCCESS", booking: { schoolId: req.params.id } },
        _sum: { amount: true, platformCommission: true, schoolPayout: true }
      }),
      prisma.settlement.findMany({
        where: { schoolId: req.params.id },
        include: { payment: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.booking.findMany({
        where: { schoolId: req.params.id },
        include: { course: true, payment: true },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);

    const pendingPayout = settlements
      .filter((settlement) => settlement.status !== "PAID")
      .reduce((sum, settlement) => sum + Number(settlement.amount), 0);

    res.json({
      school,
      metrics: {
        grossRevenue: Number(paymentTotals._sum.amount ?? 0),
        platformCommission: Number(paymentTotals._sum.platformCommission ?? 0),
        schoolPayout: Number(paymentTotals._sum.schoolPayout ?? 0),
        pendingPayout
      },
      settlements,
      recentBookings
    });
  })
);

schoolsRouter.put(
  "/:id",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    await assertSchoolAccess(req, req.params.id);
    const data = validateBody(schoolUpdateSchema, req.body);
    const school = await prisma.drivingSchool.update({
      where: { id: req.params.id },
      data: req.auth?.role === "SCHOOL_OWNER"
        ? { ...data, status: "PENDING", verificationStatus: "PENDING", verificationSubmittedAt: new Date() }
        : data
    });

    res.json(school);
  })
);

schoolsRouter.post(
  "/:id/uploads/signature",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    await assertSchoolAccess(req, req.params.id);
    const { resourceType } = z.object({
      resourceType: z.enum(["image", "raw"]).default("raw")
    }).parse(req.body);

    res.json(createCloudinaryUploadSignature({ schoolId: req.params.id, resourceType }));
  })
);

schoolsRouter.post(
  "/:id/documents",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    await assertSchoolAccess(req, req.params.id);
    const data = validateBody(documentUploadSchema, req.body);
    const document = await prisma.schoolDocument.create({
      data: {
        schoolId: req.params.id,
        type: data.type,
        url: data.url ?? `https://cdn.example.com/driveconnect/documents/${data.fileName ?? "document.pdf"}`,
        status: "PENDING"
      }
    });

    await prisma.drivingSchool.update({
      where: { id: req.params.id },
      data: { status: "PENDING", verificationStatus: "PENDING", verificationSubmittedAt: new Date() }
    });

    res.status(201).json(document);
  })
);

schoolsRouter.post(
  "/:id/verify",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const school = await prisma.drivingSchool.update({
      where: { id: req.params.id },
      data: { status: "APPROVED", verificationStatus: "APPROVED", verificationReviewedAt: new Date(), verificationReviewedBy: req.auth?.sub ?? null }
    });

    await prisma.schoolDocument.updateMany({
      where: { schoolId: req.params.id },
      data: { status: "APPROVED" }
    });

    res.json(school);
  })
);

schoolsRouter.post(
  "/:id/approve",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const school = await prisma.drivingSchool.update({
      where: { id: req.params.id },
      data: { status: "APPROVED", verificationStatus: "APPROVED", rejectionReason: null, verificationReviewedAt: new Date(), verificationReviewedBy: req.auth?.sub ?? null }
    });

    await prisma.schoolDocument.updateMany({
      where: { schoolId: req.params.id },
      data: { status: "APPROVED" }
    });

    res.json(school);
  })
);

schoolsRouter.post(
  "/:id/reject",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const rejectionReason = typeof req.body?.rejection_reason === "string" && req.body.rejection_reason.trim()
      ? req.body.rejection_reason.trim()
      : null;
    const school = await prisma.drivingSchool.update({
      where: { id: req.params.id },
      data: {
        status: "REJECTED",
        verificationStatus: "REJECTED",
        rejectionReason,
        verificationReviewedAt: new Date(),
        verificationReviewedBy: req.auth?.sub ?? null
      }
    });

    await prisma.schoolDocument.updateMany({
      where: { schoolId: req.params.id },
      data: { status: "REJECTED" }
    });

    res.json(school);
  })
);

schoolsRouter.post(
  "/:id/suspend",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    const school = await prisma.drivingSchool.update({
      where: { id: req.params.id },
      data: {
        status: "SUSPENDED",
        verificationStatus: "SUSPENDED",
        verificationReviewedAt: new Date(),
        verificationReviewedBy: req.auth?.sub ?? null
      }
    });

    res.json(school);
  })
);
