import { Router } from "express";
import { assignInstructorSchema, bookingSchema, scheduleSessionSchema } from "@driveconnect/shared";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, validateBody } from "../lib/http.js";
import { HttpError } from "../middleware/error.js";
import { createNotification } from "../services/notificationService.js";
import { assertBookingAccess, assertPartnerBookingAccess, getAuthenticatedCustomer } from "../lib/access.js";
import { requireAuth, requireRole } from "../lib/auth.js";

export const bookingsRouter = Router();

bookingsRouter.post(
  "/bookings",
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const data = validateBody(bookingSchema, req.body);
    const customer = await getAuthenticatedCustomer(req);
    const course = await prisma.course.findUnique({ where: { id: data.courseId }, include: { school: true } });

    if (!course || !course.active) {
      throw new HttpError(404, "Course not found");
    }

    if (course.schoolId !== data.schoolId || course.school.status !== "APPROVED" || course.school.verificationStatus !== "APPROVED") {
      throw new HttpError(400, "Choose a valid course from a verified school.");
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        schoolId: data.schoolId,
        courseId: data.courseId,
        preferredStartDate: data.preferredStartDate,
        preferredTimeSlot: data.preferredTimeSlot,
        pickupAddress: data.pickupAddress,
        notes: data.notes,
        totalAmount: course.price,
        advanceAmount: course.advanceAmount,
        status: "BOOKING_CREATED"
      },
      include: { course: true, school: true, customer: { include: { user: true } } }
    });

    await createNotification({
      userId: booking.customer.userId,
      title: "Booking created",
      body: `${booking.course.title} at ${booking.school.name} is ready for payment.`
    });

    res.status(201).json(booking);
  })
);

bookingsRouter.get(
  "/bookings/my",
  requireRole("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const customer = await getAuthenticatedCustomer(req);
    const bookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      include: {
        course: true,
        school: true,
        instructor: true,
        sessions: true,
        payment: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(bookings);
  })
);

bookingsRouter.get(
  "/bookings/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await assertBookingAccess(req, req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { include: { user: true } },
        course: true,
        school: true,
        instructor: true,
        sessions: true,
        payment: true,
        review: true,
        complaints: true
      }
    });

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/accept",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    await assertPartnerBookingAccess(req, req.params.id);
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "SCHOOL_ACCEPTED" },
      include: { customer: true }
    });

    await createNotification({
      userId: booking.customer.userId,
      title: "School accepted your booking",
      body: "Your driving course request has been accepted."
    });

    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/reject",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    await assertPartnerBookingAccess(req, req.params.id);
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "SCHOOL_REJECTED" },
      include: { customer: true }
    });

    await createNotification({
      userId: booking.customer.userId,
      title: "Booking rejected",
      body: "The school could not accept this slot. You can choose another school or time."
    });

    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/assign-instructor",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const currentBooking = await assertPartnerBookingAccess(req, req.params.id);
    const data = validateBody(assignInstructorSchema, req.body);
    const instructor = await prisma.instructor.findUnique({ where: { id: data.instructorId } });

    if (!instructor || instructor.schoolId !== currentBooking.schoolId) {
      throw new HttpError(400, "Assign an instructor from this booking's school.");
    }
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        instructorId: data.instructorId,
        status: "INSTRUCTOR_ASSIGNED"
      },
      include: { instructor: true, customer: true }
    });

    await createNotification({
      userId: booking.customer.userId,
      title: "Instructor assigned",
      body: `${booking.instructor?.name ?? "Your instructor"} has been assigned.`
    });

    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/schedule-session",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const currentBooking = await assertPartnerBookingAccess(req, req.params.id);
    const data = validateBody(scheduleSessionSchema, req.body);

    if (data.instructorId) {
      const instructor = await prisma.instructor.findUnique({ where: { id: data.instructorId } });

      if (!instructor || instructor.schoolId !== currentBooking.schoolId) {
        throw new HttpError(400, "Schedule an instructor from this booking's school.");
      }
    }
    const session = await prisma.classSession.create({
      data: {
        bookingId: req.params.id,
        instructorId: data.instructorId,
        scheduledAt: data.scheduledAt,
        notes: data.notes,
        status: "SCHEDULED"
      }
    });

    await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "CLASS_SCHEDULED" }
    });

    res.status(201).json(session);
  })
);

bookingsRouter.post(
  "/bookings/:id/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    await assertBookingAccess(req, req.params.id);
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" }
    });

    res.json(booking);
  })
);

bookingsRouter.post(
  "/bookings/:id/complete-course",
  requireRole("SCHOOL_OWNER", "ADMIN"),
  asyncHandler(async (req, res) => {
    await assertPartnerBookingAccess(req, req.params.id);
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "COURSE_COMPLETED" }
    });

    await prisma.classSession.updateMany({
      where: { bookingId: req.params.id, status: { not: "COMPLETED" } },
      data: { status: "COMPLETED", completedAt: new Date() }
    });

    res.json(booking);
  })
);
