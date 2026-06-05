const pool = require("../db");

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        full_name,
        full_name AS "fullName",
        email,
        phone,
        role,
        status,
        created_at,
        created_at AS "createdAt",
        last_login_at,
        last_login_at AS "lastLoginAt"
       FROM users
       ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error("Admin get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting users",
    });
  }
};

const getCourses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        c.id,
        c.school_id,
        c.course_name,
        c.course_name AS "courseName",
        c.course_type,
        c.course_type AS "courseType",
        c.vehicle_type,
        c.vehicle_type AS "vehicleType",
        c.transmission,
        c.duration_days,
        c.duration_days AS "durationDays",
        c.total_sessions,
        c.total_sessions AS "totalSessions",
        c.price,
        c.advance_amount,
        c.advance_amount AS "advanceAmount",
        c.discount_price,
        c.discount_price AS "discountPrice",
        c.is_active,
        c.is_active AS "isActive",
        c.created_at,
        c.created_at AS "createdAt",
        ds.school_name,
        ds.school_name AS "schoolName",
        ds.city,
        ds.state
       FROM courses c
       JOIN driving_schools ds ON c.school_id = ds.id
       ORDER BY c.created_at DESC`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      courses: result.rows,
    });
  } catch (error) {
    console.error("Admin get courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting courses",
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        b.id,
        b.id AS booking_id,
        b.customer_user_id,
        b.school_id,
        b.course_id,
        b.booking_status,
        b.booking_status AS status,
        b.preferred_start_date,
        b.preferred_start_date AS requested_date,
        b.total_amount,
        b.total_amount AS "totalAmount",
        b.platform_commission_amount,
        b.platform_commission_amount AS "platformCommissionAmount",
        b.school_earning_amount,
        b.school_earning_amount AS "schoolEarningAmount",
        b.created_at,
        b.created_at AS "createdAt",
        customer.full_name AS customer_name,
        customer.full_name AS "customerName",
        customer.email AS customer_email,
        customer.email AS "customerEmail",
        customer.phone AS customer_phone,
        customer.phone AS "customerPhone",
        ds.school_name,
        ds.school_name AS "schoolName",
        c.course_name,
        c.course_name AS "courseName",
        c.vehicle_type,
        c.vehicle_type AS "vehicleType",
        c.transmission
       FROM bookings b
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON COALESCE(b.school_id, c.school_id) = ds.id
       JOIN users customer ON b.customer_user_id = customer.id
       ORDER BY b.created_at DESC`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("Admin get bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting bookings",
    });
  }
};

const getReviews = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        r.id,
        r.booking_id,
        r.customer_user_id,
        r.school_id,
        r.rating,
        r.comment,
        r.is_visible,
        r.is_visible AS "isVisible",
        r.created_at,
        r.created_at AS "createdAt",
        u.full_name AS customer_name,
        u.full_name AS "customerName",
        ds.school_name,
        ds.school_name AS "schoolName",
        c.course_name,
        c.course_name AS "courseName"
       FROM reviews r
       JOIN users u ON r.customer_user_id = u.id
       JOIN driving_schools ds ON r.school_id = ds.id
       LEFT JOIN bookings b ON r.booking_id = b.id
       LEFT JOIN courses c ON b.course_id = c.id
       ORDER BY r.created_at DESC`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      reviews: result.rows,
    });
  } catch (error) {
    console.error("Admin get reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting reviews",
    });
  }
};

module.exports = {
  getUsers,
  getCourses,
  getBookings,
  getReviews,
};
