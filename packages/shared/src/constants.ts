export const MOCK_OTP = "123456";

export const bookingStatuses = [
  "BOOKING_CREATED",
  "PAYMENT_PENDING",
  "PAYMENT_SUCCESS",
  "WAITING_FOR_SCHOOL_ACCEPTANCE",
  "SCHOOL_ACCEPTED",
  "SCHOOL_REJECTED",
  "INSTRUCTOR_ASSIGNED",
  "CLASS_SCHEDULED",
  "CLASS_STARTED",
  "CLASS_COMPLETED",
  "COURSE_IN_PROGRESS",
  "COURSE_COMPLETED",
  "CANCELLED",
  "REFUND_REQUESTED",
  "REFUNDED"
] as const;

export const schoolVerificationStatuses = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED"
] as const;

export const userRoles = ["CUSTOMER", "SCHOOL_OWNER", "INSTRUCTOR", "ADMIN"] as const;

export const vehicleTypes = [
  "TWO_WHEELER",
  "FOUR_WHEELER",
  "BOTH",
  "LMV",
  "HMV"
] as const;

export const courseTypes = [
  "BEGINNER",
  "ADVANCED",
  "REFRESHER",
  "TEST_PREP",
  "CORPORATE"
] as const;

export const trustBadges = [
  "Verified Schools",
  "Safe Training",
  "Flexible Timing",
  "Female Instructor Option",
  "Doorstep Pickup"
];

export const DEFAULT_COMMISSION_PERCENTAGE = 18;
