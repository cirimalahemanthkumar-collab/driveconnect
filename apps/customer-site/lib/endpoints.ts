export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    me: "/api/auth/me"
  },
  marketplace: {
    schools: "/api/marketplace/schools",
    courses: "/api/marketplace/courses"
  },
  customer: {
    bookings: "/api/customer/bookings",
    payments: "/api/customer/payments",
    sessions: "/api/customer/sessions",
    reviews: "/api/customer/reviews",
    complaints: "/api/customer/complaints",
    notifications: "/api/notifications/my"
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
    documents: "/api/documents/partner/school"
  }
} as const;
