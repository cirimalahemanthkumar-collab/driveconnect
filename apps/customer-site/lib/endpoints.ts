export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    registerStart: "/api/auth/register/start",
    registerVerify: "/api/auth/register/verify",
    registerResend: "/api/auth/register/resend",
    me: "/api/auth/me"
  },
  marketplace: {
    summary: "/api/marketplace/summary",
    schools: "/api/marketplace/schools",
    courses: "/api/marketplace/courses"
  },
  customer: {
    bookings: "/api/customer/bookings",
    payments: "/api/customer/payments",
    sessions: "/api/customer/sessions",
    reviews: "/api/customer/reviews",
    complaints: "/api/customer/complaints",
    notifications: "/api/notifications"
  },
  partner: {
    dashboard: "/api/dashboard/partner",
    school: "/api/partner/school",
    courses: "/api/partner/courses",
    bookings: "/api/partner/bookings",
    instructors: "/api/partner/assets/instructors",
    vehicles: "/api/partner/assets/vehicles",
    sessions: "/api/sessions/partner",
    payoutSummary: "/api/payouts/partner/summary",
    payouts: "/api/payouts/partner",
    documents: "/api/documents/partner/school",
    notifications: "/api/notifications"
  }
} as const;
