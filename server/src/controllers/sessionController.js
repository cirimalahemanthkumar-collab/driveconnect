const pool = require("../db");

async function getSchoolByOwner(userId) {
  const result = await pool.query(
    `SELECT *
     FROM driving_schools
     WHERE owner_user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
}

const createClassSession = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      booking_id,
      instructor_id,
      vehicle_id,
      session_date,
      start_time,
      end_time,
      notes,
    } = req.body;

    if (
      !booking_id ||
      !instructor_id ||
      !vehicle_id ||
      !session_date ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID, instructor ID, vehicle ID, session date, start time, and end time are required",
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

    if (school.status !== "APPROVED") {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "Driving school must be approved before scheduling classes",
      });
    }

    const bookingResult = await client.query(
      `SELECT
        b.*,
        c.course_name,
        c.total_sessions
       FROM bookings b
       JOIN courses c ON b.course_id = c.id
       WHERE b.id = $1 AND b.school_id = $2`,
      [booking_id, school.id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Booking not found for your school",
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.booking_status !== "ONGOING") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Class sessions can be scheduled only after payment is completed",
      });
    }

    const existingSessionsResult = await client.query(
      `SELECT COUNT(*)::int AS session_count
       FROM class_sessions
       WHERE booking_id = $1
       AND status != 'CANCELLED'`,
      [booking_id]
    );

    const existingSessionCount =
      existingSessionsResult.rows[0].session_count || 0;

    if (existingSessionCount >= booking.total_sessions) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `This booking already has ${booking.total_sessions} sessions scheduled`,
      });
    }

    const instructorResult = await client.query(
      `SELECT *
       FROM instructors
       WHERE id = $1 AND school_id = $2 AND is_active = true`,
      [instructor_id, school.id]
    );

    if (instructorResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Invalid or inactive instructor",
      });
    }

    const vehicleResult = await client.query(
      `SELECT *
       FROM vehicles
       WHERE id = $1 AND school_id = $2 AND is_active = true`,
      [vehicle_id, school.id]
    );

    if (vehicleResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Invalid or inactive vehicle",
      });
    }

    const sessionResult = await client.query(
      `INSERT INTO class_sessions
       (
        booking_id,
        instructor_id,
        vehicle_id,
        session_date,
        start_time,
        end_time,
        status,
        notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED', $7)
       RETURNING *`,
      [
        booking_id,
        instructor_id,
        vehicle_id,
        session_date,
        start_time,
        end_time,
        notes || null,
      ]
    );

    const session = sessionResult.rows[0];

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        booking.customer_user_id,
        "Class Session Scheduled",
        `Your class for ${booking.course_name} is scheduled on ${session_date} from ${start_time} to ${end_time}.`,
        "BOOKING",
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Class session scheduled successfully",
      session,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create class session error:", error);

    if (error.code === "23P01") {
      return res.status(409).json({
        success: false,
        message:
          "Instructor or vehicle is already booked for this date and time",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while scheduling class session",
    });
  } finally {
    client.release();
  }
};

const getPartnerSessions = async (req, res) => {
  try {
    const { status, date } = req.query;

    const school = await getSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    let query = `
      SELECT
        cs.*,
        b.booking_status,
        c.course_name,
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        i.full_name AS instructor_name,
        v.vehicle_number,
        v.vehicle_model
      FROM class_sessions cs
      JOIN bookings b ON cs.booking_id = b.id
      JOIN courses c ON b.course_id = c.id
      JOIN users u ON b.customer_user_id = u.id
      LEFT JOIN instructors i ON cs.instructor_id = i.id
      LEFT JOIN vehicles v ON cs.vehicle_id = v.id
      WHERE b.school_id = $1
    `;

    const values = [school.id];
    let count = 2;

    if (status) {
      query += ` AND cs.status = $${count}`;
      values.push(status);
      count++;
    }

    if (date) {
      query += ` AND cs.session_date = $${count}`;
      values.push(date);
      count++;
    }

    query += ` ORDER BY cs.session_date ASC, cs.start_time ASC`;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      count: result.rows.length,
      sessions: result.rows,
    });
  } catch (error) {
    console.error("Get partner sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting sessions",
    });
  }
};

const getCustomerSessions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        cs.id,
        cs.booking_id,
        cs.booking_id AS "bookingId",
        ds.school_name,
        ds.school_name AS "schoolName",
        c.course_name,
        c.course_name AS "courseName",
        c.vehicle_type,
        c.vehicle_type AS "vehicleType",
        c.transmission,
        cs.session_date,
        cs.session_date AS "sessionDate",
        cs.start_time AS session_time,
        cs.start_time AS "sessionTime",
        cs.status,
        cs.created_at,
        cs.created_at AS "createdAt",
        ds.phone AS school_phone,
        i.full_name AS instructor_name,
        i.full_name AS "instructorName",
        i.phone AS instructor_phone,
        v.vehicle_number,
        v.vehicle_number AS "vehicleNumber",
        v.vehicle_model
       FROM class_sessions cs
       JOIN bookings b ON cs.booking_id = b.id
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON b.school_id = ds.id
       LEFT JOIN instructors i ON cs.instructor_id = i.id
       LEFT JOIN vehicles v ON cs.vehicle_id = v.id
       WHERE b.customer_user_id = $1
       ORDER BY cs.session_date ASC, cs.start_time ASC`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      const derivedSessions = await getDerivedCustomerSessions(req.user.id);

      return res.json({
        success: true,
        count: derivedSessions.length,
        sessions: derivedSessions,
      });
    }

    return res.json({
      success: true,
      count: result.rows.length,
      sessions: result.rows,
    });
  } catch (error) {
    if (error.code === "42P01") {
      try {
        const derivedSessions = await getDerivedCustomerSessions(req.user.id);

        return res.json({
          success: true,
          count: derivedSessions.length,
          sessions: derivedSessions,
        });
      } catch (fallbackError) {
        console.error("Get derived customer sessions error:", fallbackError);
      }
    }

    console.error("Get customer sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting customer sessions",
    });
  }
};

async function getDerivedCustomerSessions(customerUserId) {
  const result = await pool.query(
    `SELECT
      b.id || '-derived-session' AS id,
      b.id AS booking_id,
      b.id AS "bookingId",
      ds.school_name,
      ds.school_name AS "schoolName",
      c.course_name,
      c.course_name AS "courseName",
      c.vehicle_type,
      c.vehicle_type AS "vehicleType",
      c.transmission,
      b.preferred_start_date AS session_date,
      b.preferred_start_date AS "sessionDate",
      NULL::text AS session_time,
      NULL::text AS "sessionTime",
      b.booking_status AS status,
      NULL::text AS instructor_name,
      NULL::text AS "instructorName",
      NULL::text AS vehicle_number,
      NULL::text AS "vehicleNumber",
      b.created_at,
      b.created_at AS "createdAt"
     FROM bookings b
     JOIN courses c ON b.course_id = c.id
     JOIN driving_schools ds ON b.school_id = ds.id
     WHERE b.customer_user_id = $1
     AND UPPER(b.booking_status::text) IN ('ACCEPTED', 'CONFIRMED', 'ONGOING', 'COMPLETED')
     ORDER BY b.preferred_start_date ASC NULLS LAST, b.created_at DESC`,
    [customerUserId]
  );

  return result.rows;
}

const updateSessionStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { sessionId } = req.params;
    const { status, notes } = req.body;

    const allowedStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED", "MISSED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session status",
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

    const sessionResult = await client.query(
      `SELECT
        cs.*,
        b.school_id,
        b.customer_user_id,
        c.course_name
       FROM class_sessions cs
       JOIN bookings b ON cs.booking_id = b.id
       JOIN courses c ON b.course_id = c.id
       WHERE cs.id = $1 AND b.school_id = $2`,
      [sessionId, school.id]
    );

    if (sessionResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Session not found for your school",
      });
    }

    const oldSession = sessionResult.rows[0];

    const updatedResult = await client.query(
      `UPDATE class_sessions
       SET status = $1,
           notes = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes || oldSession.notes, sessionId]
    );

    const updatedSession = updatedResult.rows[0];

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        oldSession.customer_user_id,
        "Class Session Updated",
        `Your ${oldSession.course_name} class session status is now ${status}.`,
        "BOOKING",
      ]
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
        "UPDATE_CLASS_SESSION_STATUS",
        "class_sessions",
        sessionId,
        oldSession,
        updatedSession,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Session status updated successfully",
      session: updatedSession,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update session status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating session status",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createClassSession,
  getPartnerSessions,
  getCustomerSessions,
  updateSessionStatus,
};
