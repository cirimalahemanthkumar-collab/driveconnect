import { z } from "zod";
import { bookingStatuses, courseTypes, userRoles, vehicleTypes } from "./constants.js";

export const phoneSchema = z
  .string()
  .min(10, "Mobile number must have at least 10 digits")
  .max(15, "Mobile number must be valid")
  .regex(/^[0-9+ -]+$/, "Mobile number can only contain digits and + - spaces");

export const sendOtpSchema = z.object({
  mobile: phoneSchema
});

export const verifyOtpSchema = z.object({
  mobile: phoneSchema,
  otp: z.string().length(6),
  challengeToken: z.string().min(10),
  name: z.string().min(2).optional(),
  role: z.enum(userRoles).default("CUSTOMER")
});

export const addressSchema = z.object({
  address: z.string().min(5),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

export const schoolRegistrationSchema = z.object({
  ownerMobile: phoneSchema,
  ownerName: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(20),
  phone: phoneSchema,
  email: z.string().email().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  pickupAvailable: z.boolean().default(false),
  femaleInstructorAvailable: z.boolean().default(false),
  commissionPercentage: z.coerce.number().min(0).max(40).default(18)
});

export const schoolUpdateSchema = schoolRegistrationSchema
  .omit({ ownerMobile: true, ownerName: true })
  .partial();

const requiredProfileText = z.string().trim().min(1);
const requiredProfileUrl = z.string().trim().url();

export const partnerSchoolRequiredFields = [
  "school_name",
  "owner_name",
  "owner_phone",
  "owner_email",
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
  "pickup_drop_available",
  "description",
  "phone",
  "email",
  "service_radius_km"
] as const;

export const partnerSchoolVerificationSchema = z.object({
  school_name: requiredProfileText.min(2),
  owner_name: requiredProfileText.min(2),
  owner_phone: phoneSchema,
  owner_email: z.string().trim().email(),
  address: requiredProfileText.min(5),
  city: requiredProfileText.min(2),
  state: requiredProfileText.min(2),
  pincode: requiredProfileText.min(4),
  google_maps_link: requiredProfileUrl,
  license_number: requiredProfileText,
  license_document_url: requiredProfileUrl,
  owner_id_proof_url: requiredProfileUrl,
  pan_number: requiredProfileText.min(10),
  gst_number: z.string().trim().optional(),
  bank_account_name: requiredProfileText.min(2),
  bank_account_number: requiredProfileText.min(6),
  ifsc: requiredProfileText.min(4),
  upi_id: requiredProfileText,
  working_hours: requiredProfileText,
  pickup_drop_available: z.boolean(),
  description: requiredProfileText.min(20),
  phone: phoneSchema,
  email: z.string().trim().email(),
  service_radius_km: z.coerce.number().int().positive(),
  status: z.literal("PENDING").optional(),
  verification_status: z.literal("PENDING").optional()
});

export const documentUploadSchema = z.object({
  type: z.string().min(2),
  url: z.string().url().optional(),
  fileName: z.string().min(2).optional()
});

export const courseSchema = z.object({
  title: z.string().min(3),
  type: z.enum(courseTypes),
  vehicleType: z.enum(vehicleTypes),
  durationDays: z.coerce.number().int().positive(),
  totalSessions: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
  advanceAmount: z.coerce.number().nonnegative(),
  description: z.string().min(10),
  pickupIncluded: z.boolean().default(false)
});

export const instructorSchema = z.object({
  name: z.string().min(2),
  phone: phoneSchema,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  experienceYears: z.coerce.number().int().min(0),
  languages: z.array(z.string()).default(["English"]),
  active: z.boolean().default(true)
});

export const vehicleSchema = z.object({
  type: z.enum(vehicleTypes),
  make: z.string().min(2),
  model: z.string().min(1),
  registrationNumber: z.string().min(4),
  active: z.boolean().default(true)
});

export const bookingSchema = z.object({
  customerId: z.string().min(1).optional(),
  schoolId: z.string().min(1),
  courseId: z.string().min(1),
  preferredStartDate: z.coerce.date(),
  preferredTimeSlot: z.string().min(2),
  pickupAddress: z.string().optional(),
  notes: z.string().optional()
});

export const bookingStatusSchema = z.object({
  status: z.enum(bookingStatuses)
});

export const assignInstructorSchema = z.object({
  instructorId: z.string().min(1)
});

export const scheduleSessionSchema = z.object({
  instructorId: z.string().min(1).optional(),
  scheduledAt: z.coerce.date(),
  notes: z.string().optional()
});

export const paymentCreateSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().positive().optional(),
  method: z.enum(["CARD", "UPI", "NETBANKING", "WALLET", "CASH"]).default("UPI")
});

export const paymentSuccessSchema = z.object({
  bookingId: z.string().min(1),
  providerPaymentId: z.string().min(3).default("mock_razorpay_success")
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  schoolId: z.string().min(1),
  rating: z.coerce.number().min(1).max(5),
  instructorRating: z.coerce.number().min(1).max(5).optional(),
  comment: z.string().min(3)
});

export const complaintSchema = z.object({
  bookingId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  schoolId: z.string().min(1).optional(),
  subject: z.string().min(3),
  description: z.string().min(10)
});

export const complaintResolutionSchema = z.object({
  resolution: z.string().min(5)
});
