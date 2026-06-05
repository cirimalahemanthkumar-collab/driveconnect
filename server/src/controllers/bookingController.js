const pool = require("../db");

const bookingListSelect = `
  b.id,
  b.id AS booking_id,
  b.customer_user_id,
  b.school_id,
  b.course_id,
  b.booking_status,
  b.booking_status AS status,
  b.preferred_start_date,
  b.preferred_start_date AS requested_date,
  NULL::text AS requested_time,
  ds.pickup_drop_available AS pickup_required,
  NULL::text AS pickup_address,
  b.created_at,
  b.created_at AS "createdAt",
  b.updated_at,
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
  c.course_type,
  c.course_type AS "courseType",
  c.vehicle_type,
  c.vehicle_type AS "vehicleType",
  c.transmission,
  c.duration_days,
  c.duration_days AS "durationDays",
  c.total_sessions,
  c.total_sessions AS "totalSessions"
`;

function calculateAmounts(course) {
  const baseAmount = Number(course.price);
  const discountPrice = course.discount_price
    ? Number(course.discount_price)
    : baseAmount;

  const discountAmount = baseAmount - discountPrice;
  const taxAmount = 0;
  const totalAmount = discountPrice + taxAmount;

  const commissionPercent = Number(course.platform_commission_percent || 10);
  const platformCommissionAmount = (totalAmount * commissionPercent) / 100;
  const schoolEarningAmount = totalAmount - platformCommissionAmount;

  return {
    baseAmount,
    discountAmount,
    taxAmount,
    totalAmount,
    platformCommissionAmount,
    schoolEarningAmount,
  };
}

const createBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      course_id,
      preferred_start_date,
      requested_date,
      preferred_date,
      requested_time,
      preferred_time,
    } = req.body;
    const preferredStartDate = preferred_start_date || requested_date || preferred_date;

    if (!course_id || !preferredStartDate) {
      return res.status(400).json({
        success: false,
        message: "Course ID and preferred start date are required",
      });
    }

    await client.query("BEGIN");

    const courseResult = await client.query(
      `SELECT 
        c.*,
        ds.id AS school_id,
        ds.school_name,
        ds.owner_user_id,
        ds.status AS school_status
       FROM courses c
       JOIN driving_schools ds ON c.school_id = ds.id
       WHERE c.id = $1`,
      [course_id]
    );

    if (courseResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const course = courseResult.rows[0];

    if (course.school_status !== "APPROVED") {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "This driving school is not approved",
      });
    }

    if (!course.is_active) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "This course is not active",
      });
    }

    const amounts = calculateAmounts(course);

    const bookingResult = await client.query(
      `INSERT INTO bookings
       (
        customer_user_id,
        school_id,
        course_id,
        booking_status,
        preferredStartDate,
        base_amount,
        discount_amount,
        tax_amount,
        total_amount,
        platform_commission_amount,
        school_earning_amount
       )
       VALUES
       ($1, $2, $3, 'PENDING', $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        course.school_id,
        course.id,
        preferred_start_date,
        amounts.baseAmount,
        amounts.discountAmount,
        amounts.taxAmount,
        amounts.totalAmount,
        amounts.platformCommissionAmount,
        amounts.schoolEarningAmount,
      ]
    );

    const booking = bookingResult.rows[0];

    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, old_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        booking.id,
        null,
        "PENDING",
        req.user.id,
        "Customer created a new booking",
      ]
    );

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        course.owner_user_id,
        "New Booking Request",
        `New booking request received for ${course.course_name}.`,
        "BOOKING",
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Booking created successfully. Waiting for driving school approval.",
      booking: {
        ...booking,
        booking_id: booking.id,
        status: booking.booking_status,
        requested_date: booking.preferred_start_date,
        requested_time: requested_time || preferred_time || null,
        school_name: course.school_name,
        course_name: course.course_name,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating booking",
    });
  } finally {
    client.release();
  }
};

const getMyBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        ${bookingListSelect},
        ds.phone AS school_phone,
        ds.email AS school_email,
        ds.address AS school_address,
        ds.city AS school_city,
        ds.state AS school_state
       FROM bookings b
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON COALESCE(b.school_id, c.school_id) = ds.id
       JOIN users customer ON b.customer_user_id = customer.id
       WHERE b.customer_user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting bookings",
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const result = await pool.query(
      `SELECT
        ${bookingListSelect},
        c.course_name,
        c.description AS course_description,
        c.vehicle_type,
        c.transmission,
        c.duration_days,
        c.total_sessions,
        ds.school_name,
        ds.email AS school_email,
        ds.phone AS school_phone,
        ds.address AS school_address,
        ds.city AS school_city,
        ds.state AS school_state
       FROM bookings b
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON COALESCE(b.school_id, c.school_id) = ds.id
       JOIN users customer ON b.customer_user_id = customer.id
       WHERE b.id = $1 AND b.customer_user_id = $2`,
      [bookingId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting booking",
    });
  }
};

const cancelMyBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const { bookingId } = req.params;
    const { cancellation_reason } = req.body;

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT 
        b.*,
        ds.owner_user_id,
        ds.school_name
       FROM bookings b
       JOIN driving_schools ds ON b.school_id = ds.id
       WHERE b.id = $1 AND b.customer_user_id = $2`,
      [bookingId, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = bookingResult.rows[0];

    if (
      booking.booking_status === "COMPLETED" ||
      booking.booking_status === "CANCELLED" ||
      booking.booking_status === "REFUNDED"
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled when status is ${booking.booking_status}`,
      });
    }

    const updatedResult = await client.query(
      `UPDATE bookings
       SET booking_status = 'CANCELLED',
           cancelled_at = NOW(),
           cancellation_reason = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [cancellation_reason || "Cancelled by customer", bookingId]
    );

    const updatedBooking = updatedResult.rows[0];

    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, old_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        bookingId,
        booking.booking_status,
        "CANCELLED",
        req.user.id,
        cancellation_reason || "Cancelled by customer",
      ]
    );

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        booking.owner_user_id,
        "Booking Cancelled",
        `A booking for ${booking.school_name} was cancelled by the customer.`,
        "BOOKING",
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling booking",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelMyBooking,
};
