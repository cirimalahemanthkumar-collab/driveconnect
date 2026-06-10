const pool = require("../db");
const { notifyUser } = require("../utils/notifications");

const partnerBookingSelect = `
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
  u.full_name AS customer_name,
  u.full_name AS "customerName",
  u.email AS customer_email,
  u.email AS "customerEmail",
  u.phone AS customer_phone,
  u.phone AS "customerPhone",
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

async function getSchoolByOwner(userId) {
  const result = await pool.query(
    `SELECT *
     FROM driving_schools
     WHERE owner_user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

const getPartnerBookings = async (req, res) => {
  try {
    const { status } = req.query;

    const school = await getSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    let query = `
      SELECT
        ${partnerBookingSelect}
      FROM bookings b
      JOIN courses c ON b.course_id = c.id
      JOIN driving_schools ds ON COALESCE(b.school_id, c.school_id) = ds.id
      JOIN users u ON b.customer_user_id = u.id
      WHERE ds.id = $1
    `;

    const values = [school.id];

    if (status) {
      query += ` AND b.booking_status = $2`;
      values.push(status);
    }

    query += ` ORDER BY b.created_at DESC`;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      count: result.rows.length,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("Get partner bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting partner bookings",
    });
  }
};

const getPartnerBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const school = await getSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const result = await pool.query(
      `SELECT
        ${partnerBookingSelect},
        c.course_name,
        c.description AS course_description,
        c.vehicle_type,
        c.transmission,
        c.duration_days,
        c.total_sessions,
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone
       FROM bookings b
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON COALESCE(b.school_id, c.school_id) = ds.id
       JOIN users u ON b.customer_user_id = u.id
       WHERE b.id = $1 AND ds.id = $2`,
      [bookingId, school.id]
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
    console.error("Get partner booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting booking",
    });
  }
};

const updatePartnerBookingStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { bookingId } = req.params;
    const { booking_status, status, rejection_reason } = req.body;
    const nextStatus = String(booking_status || status || "").trim().toUpperCase();

    const allowedStatuses = ["ACCEPTED", "REJECTED"];

    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Booking status must be ACCEPTED or REJECTED",
      });
    }

    await client.query("BEGIN");

    const schoolResult = await client.query(
      `SELECT *
       FROM driving_schools
       WHERE owner_user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (schoolResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const school = schoolResult.rows[0];

    const bookingResult = await client.query(
      `SELECT
        b.*,
        c.course_name,
        u.full_name AS customer_name
       FROM bookings b
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON COALESCE(b.school_id, c.school_id) = ds.id
       JOIN users u ON b.customer_user_id = u.id
       WHERE b.id = $1 AND ds.id = $2`,
      [bookingId, school.id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Booking not found for your school",
      });
    }

    const oldBooking = bookingResult.rows[0];

    if (oldBooking.booking_status !== "PENDING") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `Only PENDING bookings can be accepted or rejected. Current status is ${oldBooking.booking_status}`,
      });
    }

    let updateQuery;
    let updateValues;

    if (nextStatus === "ACCEPTED") {
      updateQuery = `
        UPDATE bookings
        SET booking_status = 'ACCEPTED',
            accepted_at = NOW(),
            rejected_at = NULL,
            rejection_reason = NULL,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      updateValues = [bookingId];
    } else {
      updateQuery = `
        UPDATE bookings
        SET booking_status = 'REJECTED',
            rejected_at = NOW(),
            rejection_reason = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      updateValues = [rejection_reason || "Rejected by driving school", bookingId];
    }

    const updatedResult = await client.query(updateQuery, updateValues);
    const updatedBooking = updatedResult.rows[0];

    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, old_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        bookingId,
        oldBooking.booking_status,
        nextStatus,
        req.user.id,
        nextStatus === "ACCEPTED"
          ? "Booking accepted by driving school"
          : rejection_reason || "Booking rejected by driving school",
      ]
    );

    await notifyUser(
      oldBooking.customer_user_id,
      {
        title: nextStatus === "ACCEPTED" ? "Booking accepted" : "Booking rejected",
        message:
          nextStatus === "ACCEPTED"
            ? `Your booking for ${oldBooking.course_name} has been accepted by ${school.school_name}.`
            : `Your booking for ${oldBooking.course_name} has been rejected by ${school.school_name}.`,
        type: nextStatus === "ACCEPTED" ? "BOOKING_ACCEPTED" : "BOOKING_REJECTED",
        entityType: "bookings",
        entityId: bookingId,
        data: {
          actionLink: "/customer/bookings",
          rejectionReason: nextStatus === "REJECTED" ? rejection_reason || "Booking rejected by driving school" : null,
        },
      },
      client
    );
    await notifyUser(
      req.user.id,
      {
        title: nextStatus === "ACCEPTED" ? "Booking accepted" : "Booking rejected",
        message: `You ${nextStatus.toLowerCase()} ${oldBooking.customer_name || "a customer"}'s booking for ${oldBooking.course_name}.`,
        type: nextStatus === "ACCEPTED" ? "BOOKING_ACCEPTED" : "BOOKING_REJECTED",
        entityType: "bookings",
        entityId: bookingId,
        data: { actionLink: "/partner/bookings" },
      },
      client
    );

    await client.query(
      `INSERT INTO audit_logs
       (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        "UPDATE_BOOKING_STATUS_BY_PARTNER",
        "bookings",
        bookingId,
        oldBooking,
        updatedBooking,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: `Booking ${nextStatus.toLowerCase()} successfully`,
      booking: {
        ...updatedBooking,
        booking_id: updatedBooking.id,
        status: updatedBooking.booking_status,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update partner booking status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating booking status",
    });
  } finally {
    client.release();
  }
};
const completePartnerBooking = async (req, res) => {
  const client = await pool.connect();

  try {
    const { bookingId } = req.params;

    await client.query("BEGIN");

    const schoolResult = await client.query(
      `SELECT *
       FROM driving_schools
       WHERE owner_user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (schoolResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const school = schoolResult.rows[0];

    const bookingResult = await client.query(
      `SELECT
        b.*,
        c.course_name,
        u.full_name AS customer_name
       FROM bookings b
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON COALESCE(b.school_id, c.school_id) = ds.id
       JOIN users u ON b.customer_user_id = u.id
       WHERE b.id = $1 AND ds.id = $2`,
      [bookingId, school.id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Booking not found for your school",
      });
    }

    const oldBooking = bookingResult.rows[0];

    if (!["ACCEPTED", "ONGOING"].includes(oldBooking.booking_status)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `Only ACCEPTED or ONGOING bookings can be completed. Current status is ${oldBooking.booking_status}`,
      });
    }

    const updatedResult = await client.query(
      `UPDATE bookings
       SET booking_status = 'COMPLETED',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [bookingId]
    );

    const updatedBooking = updatedResult.rows[0];

    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, old_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, 'COMPLETED', $3, $4)`,
      [
        bookingId,
        oldBooking.booking_status,
        req.user.id,
        "Training completed by driving school",
      ]
    );

    await notifyUser(
      oldBooking.customer_user_id,
      {
        title: "Training completed",
        message: `Your training for ${oldBooking.course_name} has been marked as completed.`,
        type: "BOOKING_COMPLETED",
        entityType: "bookings",
        entityId: bookingId,
        data: { actionLink: "/customer/bookings" },
      },
      client
    );
    await notifyUser(
      req.user.id,
      {
        title: "Booking completed",
        message: `You marked ${oldBooking.course_name} as completed.`,
        type: "BOOKING_COMPLETED",
        entityType: "bookings",
        entityId: bookingId,
        data: { actionLink: "/partner/bookings" },
      },
      client
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Booking marked as completed successfully",
      booking: {
        ...updatedBooking,
        booking_id: updatedBooking.id,
        status: updatedBooking.booking_status,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Complete booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while completing booking",
    });
  } finally {
    client.release();
  }
};
module.exports = {
  getPartnerBookings,
  getPartnerBookingById,
  updatePartnerBookingStatus,
  completePartnerBooking,
};
