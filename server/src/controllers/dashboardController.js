const pool = require("../db");

const getAdminDashboard = async (req, res) => {
  try {
    const usersResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE role = 'CUSTOMER')::int AS total_customers,
        COUNT(*) FILTER (WHERE role = 'SCHOOL_OWNER')::int AS total_partners,
        COUNT(*) FILTER (WHERE role IN ('ADMIN', 'SUPER_ADMIN'))::int AS total_admins
       FROM users`
    );

    const schoolsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_schools,
        COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved_schools,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_schools,
        COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected_schools,
        COUNT(*) FILTER (WHERE status = 'SUSPENDED')::int AS suspended_schools
       FROM driving_schools`
    );

    const coursesResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_courses,
        COUNT(*) FILTER (WHERE is_active = true)::int AS active_courses,
        COUNT(*) FILTER (WHERE is_active = false)::int AS inactive_courses
       FROM courses`
    );

    const bookingsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'PENDING')::int AS pending_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'ACCEPTED')::int AS accepted_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'ONGOING')::int AS ongoing_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'COMPLETED')::int AS completed_bookings,
        COUNT(*) FILTER (WHERE booking_status = 'CANCELLED')::int AS cancelled_bookings,
        COALESCE(SUM(total_amount), 0) AS total_booking_value,
        COALESCE(SUM(platform_commission_amount), 0) AS total_platform_commission,
        COALESCE(SUM(school_earning_amount), 0) AS total_school_earning
       FROM bookings`
    );

    const paymentsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_payment_orders,
        COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS successful_payments,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_payments,
        COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed_payments,
        COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0) AS successful_payment_amount
       FROM payment_orders`
    );

    const payoutsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_payout_records,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_payouts,
        COUNT(*) FILTER (WHERE status = 'PAID')::int AS paid_payouts,
        COALESCE(SUM(payout_amount) FILTER (WHERE status = 'PENDING'), 0) AS pending_payout_amount,
        COALESCE(SUM(payout_amount) FILTER (WHERE status = 'PAID'), 0) AS paid_payout_amount
       FROM school_payouts`
    );

    const complaintsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_complaints,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_complaints,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::int AS in_progress_complaints,
        COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved_complaints,
        COUNT(*) FILTER (WHERE status = 'CLOSED')::int AS closed_complaints
       FROM complaints`
    );

    const reviewsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_reviews,
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_platform_rating
       FROM reviews
       WHERE is_visible = true`
    );

    return res.json({
      success: true,
      dashboard: {
        users: usersResult.rows[0],
        schools: schoolsResult.rows[0],
        courses: coursesResult.rows[0],
        bookings: bookingsResult.rows[0],
        payments: paymentsResult.rows[0],
        payouts: payoutsResult.rows[0],
        complaints: complaintsResult.rows[0],
        reviews: reviewsResult.rows[0],
      },
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