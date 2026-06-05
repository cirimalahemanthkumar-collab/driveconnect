const pool = require("../db");

async function safeQuery(label, query, fallback = {}) {
  try {
    const result = await pool.query(query);
    return result.rows[0] || fallback;
  } catch (error) {
    console.error(`Admin dashboard ${label} stats failed:`, error.message);
    return fallback;
  }
}

function readNumber(row, key) {
  const value = Number(row?.[key]);
  return Number.isFinite(value) ? value : 0;
}

const getAdminDashboard = async (req, res) => {
  try {
    const users = await safeQuery(
      "users",
      `SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE UPPER(role::text) = 'CUSTOMER')::int AS total_customers,
        COUNT(*) FILTER (WHERE UPPER(role::text) IN ('SCHOOL_OWNER', 'PARTNER'))::int AS total_school_owners,
        COUNT(*) FILTER (WHERE UPPER(role::text) IN ('ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF', 'ACCOUNTANT'))::int AS total_admins
       FROM users`
    );

    const schools = await safeQuery(
      "schools",
      `SELECT
        COUNT(*)::int AS total_schools,
        COUNT(*) FILTER (WHERE status::text IN ('APPROVED', 'VERIFIED') OR verification_status::text IN ('APPROVED', 'VERIFIED'))::int AS approved_schools,
        COUNT(*) FILTER (WHERE status::text IN ('PENDING', 'UNDER_REVIEW') OR verification_status::text IN ('PENDING', 'UNDER_REVIEW'))::int AS pending_schools
       FROM driving_schools`
    );

    const courses = await safeQuery(
      "courses",
      `SELECT
        COUNT(*)::int AS total_courses,
        COUNT(*) FILTER (WHERE is_active = true)::int AS active_courses
       FROM courses`
    );

    const bookings = await safeQuery(
      "bookings",
      `SELECT
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'PENDING')::int AS pending_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'ACCEPTED')::int AS accepted_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'COMPLETED')::int AS completed_bookings,
        COALESCE(SUM(total_amount), 0) AS revenue_total,
        COALESCE(SUM(platform_commission_amount), 0) AS commission_total
       FROM bookings`
    );

    const payments = await safeQuery(
      "payments",
      `SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0) AS revenue_total
       FROM payment_orders`
    );

    const documents = await safeQuery("documents", `SELECT COUNT(*)::int AS total_documents FROM school_documents`);
    const vehicles = await safeQuery("vehicles", `SELECT COUNT(*)::int AS total_vehicles FROM vehicles`);
    const instructors = await safeQuery("instructors", `SELECT COUNT(*)::int AS total_instructors FROM instructors`);
    const complaints = await safeQuery("complaints", `SELECT COUNT(*)::int AS total_complaints FROM complaints`);
    const reviews = await safeQuery("reviews", `SELECT COUNT(*)::int AS total_reviews FROM reviews`);

    const payouts = await safeQuery(
      "payouts",
      `SELECT
        COALESCE(SUM(payout_amount), 0) AS payout_total
       FROM school_payouts`
    );

    const stats = {
      total_users: readNumber(users, "total_users"),
      totalUsers: readNumber(users, "total_users"),
      total_customers: readNumber(users, "total_customers"),
      totalCustomers: readNumber(users, "total_customers"),
      total_school_owners: readNumber(users, "total_school_owners"),
      totalSchoolOwners: readNumber(users, "total_school_owners"),
      total_admins: readNumber(users, "total_admins"),
      totalAdmins: readNumber(users, "total_admins"),
      total_schools: readNumber(schools, "total_schools"),
      totalSchools: readNumber(schools, "total_schools"),
      approved_schools: readNumber(schools, "approved_schools"),
      approvedSchools: readNumber(schools, "approved_schools"),
      pending_schools: readNumber(schools, "pending_schools"),
      pendingSchools: readNumber(schools, "pending_schools"),
      total_courses: readNumber(courses, "total_courses"),
      totalCourses: readNumber(courses, "total_courses"),
      active_courses: readNumber(courses, "active_courses"),
      activeCourses: readNumber(courses, "active_courses"),
      total_bookings: readNumber(bookings, "total_bookings"),
      totalBookings: readNumber(bookings, "total_bookings"),
      pending_bookings: readNumber(bookings, "pending_bookings"),
      pendingBookings: readNumber(bookings, "pending_bookings"),
      accepted_bookings: readNumber(bookings, "accepted_bookings"),
      acceptedBookings: readNumber(bookings, "accepted_bookings"),
      completed_bookings: readNumber(bookings, "completed_bookings"),
      completedBookings: readNumber(bookings, "completed_bookings"),
      total_documents: readNumber(documents, "total_documents"),
      totalDocuments: readNumber(documents, "total_documents"),
      total_vehicles: readNumber(vehicles, "total_vehicles"),
      totalVehicles: readNumber(vehicles, "total_vehicles"),
      total_instructors: readNumber(instructors, "total_instructors"),
      totalInstructors: readNumber(instructors, "total_instructors"),
      total_complaints: readNumber(complaints, "total_complaints"),
      totalComplaints: readNumber(complaints, "total_complaints"),
      total_reviews: readNumber(reviews, "total_reviews"),
      totalReviews: readNumber(reviews, "total_reviews"),
      revenue_total: readNumber(payments, "revenue_total") || readNumber(bookings, "revenue_total"),
      revenueTotal: readNumber(payments, "revenue_total") || readNumber(bookings, "revenue_total"),
      commission_total: readNumber(bookings, "commission_total"),
      commissionTotal: readNumber(bookings, "commission_total"),
      payout_total: readNumber(payouts, "payout_total"),
      payoutTotal: readNumber(payouts, "payout_total"),
    };

    return res.json({
      success: true,
      dashboard: stats,
      stats,
      ...stats,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting admin dashboard",
    });
  }
};

const getPartnerDashboard = async (req, res) => {
  try {
    const schoolResult = await pool.query(
      `SELECT *
       FROM driving_schools
       WHERE owner_user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const school = schoolResult.rows[0];

    const coursesResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_courses,
        COUNT(*) FILTER (WHERE is_active = true)::int AS active_courses
       FROM courses
       WHERE school_id = $1`,
      [school.id]
    );

    const bookingsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'PENDING')::int AS pending_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'ACCEPTED')::int AS accepted_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'ONGOING')::int AS ongoing_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'COMPLETED')::int AS completed_bookings,
        COALESCE(SUM(total_amount), 0) AS total_booking_value,
        COALESCE(SUM(school_earning_amount), 0) AS total_school_earning
       FROM bookings
       WHERE school_id = $1`,
      [school.id]
    );

    const sessionsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_sessions,
        COUNT(*) FILTER (WHERE status = 'SCHEDULED')::int AS scheduled_sessions,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_sessions,
        COUNT(*) FILTER (WHERE status = 'MISSED')::int AS missed_sessions,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled_sessions
       FROM class_sessions cs
       JOIN bookings b ON cs.booking_id = b.id
       WHERE b.school_id = $1`,
      [school.id]
    );

    const payoutsResult = await pool.query(
      `SELECT
        COALESCE(SUM(payout_amount), 0) AS total_payout_amount,
        COALESCE(SUM(payout_amount) FILTER (WHERE status = 'PENDING'), 0) AS pending_payout_amount,
        COALESCE(SUM(payout_amount) FILTER (WHERE status = 'PAID'), 0) AS paid_payout_amount
       FROM school_payouts
       WHERE school_id = $1`,
      [school.id]
    );

    return res.json({
      success: true,
      school: {
        id: school.id,
        school_name: school.school_name,
        status: school.status,
        average_rating: school.average_rating,
        total_reviews: school.total_reviews,
      },
      dashboard: {
        courses: coursesResult.rows[0],
        bookings: bookingsResult.rows[0],
        sessions: sessionsResult.rows[0],
        payouts: payoutsResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Partner dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting partner dashboard",
    });
  }
};

module.exports = {
  getAdminDashboard,
  getPartnerDashboard,
};
