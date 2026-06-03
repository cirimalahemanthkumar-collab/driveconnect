export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export type AdminSession = {
  id: string;
  name: string;
  mobile: string;
  token: string;
};

export type School = {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  pickupAvailable: boolean;
  femaleInstructorAvailable: boolean;
  ownerName: string;
  ownerMobile: string;
  verificationStatus: "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  commissionPercentage: number;
  createdAt: string;
};

export type PartnerSession = {
  token: string;
  school: School;
};

export type Course = {
  id: string;
  schoolId: string;
  title: string;
  vehicleType: string;
  courseType: string;
  totalSessions: number;
  durationDays: number;
  price: number;
  advanceAmount: number;
  pickupIncluded: boolean;
};

export type Booking = {
  id: string;
  customerName: string;
  customerMobile: string;
  schoolId: string;
  schoolName: string;
  courseId: string;
  courseTitle: string;
  preferredStartDate: string;
  preferredTimeSlot: string;
  pickupAddress?: string;
  notes?: string;
  totalAmount: number;
  advanceAmount: number;
  bookingFee: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSummary = {
  schools: number;
  verifiedSchools: number;
  pendingSchools: number;
  bookings: number;
  acceptedBookings: number;
  grossBookingValue: number;
  platformCommission: number;
  bookingFees: number;
  platformRevenue: number;
  schoolPayouts: number;
};

export type Payment = {
  id: string;
  bookingId: string;
  schoolId: string;
  schoolName: string;
  customerName: string;
  courseTitle: string;
  amount: number;
  bookingFee: number;
  platformCommission: number;
  schoolPayout: number;
  status: "MOCK_SUCCESS";
  paidAt: string;
};

export type Settlement = {
  id: string;
  paymentId: string;
  bookingId: string;
  schoolId: string;
  schoolName: string;
  amount: number;
  platformCommission: number;
  status: "PENDING" | "PAID";
  createdAt: string;
};

export type PartnerEarnings = {
  payments: Payment[];
  settlements: Settlement[];
  totals: {
    grossBookingValue: number;
    platformCommission: number;
    schoolPayout: number;
    pendingPayout: number;
  };
};

export type Bootstrap = {
  adminConfigured: boolean;
  verifiedSchools: number;
  pendingSchools: number;
  bookings: number;
};

export const storageKeys = {
  admin: "driveconnect_admin_session",
  partner: "driveconnect_partner_session",
  customerMobile: "driveconnect_customer_mobile",
  lastBooking: "driveconnect_last_booking"
} as const;

export function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function setupAdmin(input: { name: string; mobile: string; pin: string }) {
  return request<AdminSession>("/local/admin/setup", { method: "POST", body: input });
}

export function getBootstrap() {
  return request<Bootstrap>("/local/bootstrap");
}

export function loginAdmin(input: { mobile: string; pin: string }) {
  return request<AdminSession>("/local/admin/login", { method: "POST", body: input });
}

export function getAdminSummary(token: string) {
  return request<AdminSummary>("/local/admin/summary", { adminToken: token });
}

export function getAdminBookings(token: string) {
  return request<Booking[]>("/local/admin/bookings", { adminToken: token });
}

export function getAdminPayments(token: string) {
  return request<Payment[]>("/local/admin/payments", { adminToken: token });
}

export function listSchools(status?: School["verificationStatus"]) {
  return request<School[]>(`/local/schools${status ? `?status=${status}` : ""}`);
}

export function listCourses(schoolId?: string) {
  return request<Course[]>(`/local/courses${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ""}`);
}

export function updateSchoolStatus(token: string, schoolId: string, status: "VERIFIED" | "REJECTED" | "SUSPENDED") {
  return request<School>(`/local/admin/schools/${schoolId}/status`, {
    method: "POST",
    adminToken: token,
    body: { status }
  });
}

export function registerPartner(input: {
  ownerName: string;
  ownerMobile: string;
  ownerPin: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  pickupAvailable: boolean;
  femaleInstructorAvailable: boolean;
}) {
  return request<PartnerSession>("/local/partners/register", { method: "POST", body: input });
}

export function loginPartner(input: { mobile: string; pin: string }) {
  return request<PartnerSession>("/local/partners/login", { method: "POST", body: input });
}

export function getPartnerBookings(token: string) {
  return request<Booking[]>("/local/partners/bookings", { partnerToken: token });
}

export function getPartnerCourses(token: string) {
  return request<Course[]>("/local/partners/courses", { partnerToken: token });
}

export function getPartnerEarnings(token: string) {
  return request<PartnerEarnings>("/local/partners/earnings", { partnerToken: token });
}

export function createPartnerCourse(token: string, input: {
  title: string;
  vehicleType: "FOUR_WHEELER" | "TWO_WHEELER" | "BOTH";
  courseType: "BEGINNER" | "REFRESHER" | "ADVANCED";
  totalSessions: number;
  durationDays: number;
  price: number;
  advanceAmount: number;
  pickupIncluded: boolean;
}) {
  return request<Course>("/local/partners/courses", { method: "POST", partnerToken: token, body: input });
}

export function updateBookingStatus(token: string, bookingId: string, status: "SCHOOL_ACCEPTED" | "SCHOOL_REJECTED" | "CANCELLED") {
  return request<Booking>(`/local/bookings/${bookingId}/status`, {
    method: "POST",
    partnerToken: token,
    body: { status }
  });
}

export function createBooking(input: {
  customerName: string;
  customerMobile: string;
  schoolId: string;
  courseId: string;
  preferredStartDate: string;
  preferredTimeSlot: string;
  pickupAddress?: string;
  notes?: string;
}) {
  return request<Booking>("/local/bookings", { method: "POST", body: input });
}

export function getCustomerBookings(customerMobile: string) {
  return request<Booking[]>(`/local/bookings?customerMobile=${encodeURIComponent(customerMobile)}`);
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  adminToken?: string;
  partnerToken?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.adminToken ? { "x-admin-token": options.adminToken } : {}),
      ...(options.partnerToken ? { "x-partner-token": options.partnerToken } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json().catch(() => ({ message: "The API returned an invalid response." }));

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }

  return payload as T;
}
