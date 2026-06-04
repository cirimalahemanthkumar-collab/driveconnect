import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, getPagination } from "../lib/http.js";
import { requireRole } from "../lib/auth.js";

export const adminRouter = Router();
adminRouter.use(requireRole("ADMIN"));

adminRouter.get(
  "/admin/dashboard",
  asyncHandler(async (_req, res) => {
    const [
      users,
      customers,
      schools,
      verifiedSchools,
      bookings,
      pendingSchools,
      openComplaints,
      paymentAggregate,
      settlementAggregate
    ] = await Promise.all([
      prisma.user.count(),
      prisma.customerProfile.count(),
      prisma.drivingSchool.count(),
      prisma.drivingSchool.count({ where: { status: "APPROVED", verificationStatus: "APPROVED" } }),
      prisma.booking.count(),
      prisma.drivingSchool.count({
        where: {
          OR: [
            { status: "PENDING" },
            { verificationStatus: "PENDING" },
            { verificationStatus: "UNDER_REVIEW" }
          ]
        }
      }),
      prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true, platformCommission: true }
      }),
      prisma.settlement.aggregate({
        _sum: { amount: true }
      })
    ]);

    res.json({
      users,
      customers,
      schools,
      verifiedSchools,
      bookings,
      pendingSchools,
      openComplaints,
      grossRevenue: Number(paymentAggregate._sum.amount ?? 0),
      platformRevenue: Number(paymentAggregate._sum.platformCommission ?? 0),
      schoolPayouts: Number(settlementAggregate._sum.amount ?? 0)
    });
  })
);

adminRouter.get(
  "/admin/schools/pending",
  asyncHandler(async (_req, res) => {
    const schools = await prisma.drivingSchool.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { verificationStatus: "PENDING" },
          { verificationStatus: "UNDER_REVIEW" }
        ]
      },
      include: { documents: true, owner: true },
      orderBy: { createdAt: "asc" }
    });

    res.json(schools);
  })
);

adminRouter.get(
  "/admin/bookings",
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req);
    const bookings = await prisma.booking.findMany({
      skip: pagination.skip,
      take: pagination.take,
      include: { customer: true, school: true, course: true, payment: true },
      orderBy: { createdAt: "desc" }
    });

    res.json({ ...pagination, data: bookings });
  })
);

adminRouter.get(
  "/admin/revenue",
  asyncHandler(async (_req, res) => {
    const payments = await prisma.payment.findMany({
      where: { status: "SUCCESS" },
      include: { booking: { include: { school: true, course: true } }, settlement: true },
      orderBy: { paidAt: "desc" }
    });

    res.json(payments);
  })
);

adminRouter.get(
  "/admin/payments",
  asyncHandler(async (_req, res) => {
    const payments = await prisma.payment.findMany({
      include: {
        booking: { include: { customer: { include: { user: true } }, school: true, course: true } },
        settlement: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(payments);
  })
);

adminRouter.get(
  "/admin/settlements",
  asyncHandler(async (_req, res) => {
    const settlements = await prisma.settlement.findMany({
      include: { school: true, payment: { include: { booking: true } } },
      orderBy: { createdAt: "desc" }
    });

    res.json(settlements);
  })
);

adminRouter.get(
  "/admin/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: { customerProfile: true, ownedSchools: true, instructorProfile: true },
      orderBy: { createdAt: "desc" }
    });

    res.json(users);
  })
);

adminRouter.get(
  "/admin/complaints",
  asyncHandler(async (_req, res) => {
    const complaints = await prisma.complaint.findMany({
      include: { school: true, customer: true, booking: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });

    res.json(complaints);
  })
);

adminRouter.post(
  "/admin/schools/:id/commission",
  asyncHandler(async (req, res) => {
    const body = z.object({ commissionPercentage: z.coerce.number().min(0).max(40) }).parse(req.body);
    const school = await prisma.drivingSchool.update({
      where: { id: req.params.id },
      data: { commissionPercentage: body.commissionPercentage }
    });

    res.json(school);
  })
);

adminRouter.get(
  "/admin/coupons",
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.json(coupons);
  })
);

adminRouter.post(
  "/admin/coupons",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        code: z.string().min(3),
        description: z.string().min(5),
        discountType: z.enum(["FLAT", "PERCENTAGE"]),
        discountValue: z.coerce.number().positive(),
        active: z.boolean().default(true)
      })
      .parse(req.body);
    const coupon = await prisma.coupon.create({ data: body });

    res.status(201).json(coupon);
  })
);

adminRouter.post(
  "/admin/featured-listings",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        schoolId: z.string().min(1),
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date(),
        boostScore: z.coerce.number().min(0).max(40).default(12),
        active: z.boolean().default(true)
      })
      .parse(req.body);
    const listing = await prisma.featuredListing.create({ data: body });

    res.status(201).json(listing);
  })
);
