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

function isAdminRole(role) {
  return ["ADMIN", "SUPER_ADMIN", "SUPPORT_STAFF"].includes(role);
}

// CUSTOMER / PARTNER CREATE COMPLAINT
const createComplaint = async (req, res) => {
  const client = await pool.connect();

  try {
    const { school_id, booking_id, subject, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    await client.query("BEGIN");

    let finalSchoolId = school_id || null;
    let finalBookingId = booking_id || null;

    if (booking_id) {
      const bookingResult = await client.query(
        `SELECT *
         FROM bookings
         WHERE id = $1`,
        [booking_id]
      );

      if (bookingResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      const booking = bookingResult.rows[0];

      if (req.user.role === "CUSTOMER" && booking.customer_user_id !== req.user.id) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          success: false,
          message: "You cannot raise complaint for another customer's booking",
        });
      }

      finalSchoolId = booking.school_id;
      finalBookingId = booking.id;
    }

    const complaintResult = await client.query(
      `INSERT INTO complaints
       (
        raised_by_user_id,
        school_id,
        booking_id,
        subject,
        description,
        status
       )
       VALUES ($1, $2, $3, $4, $5, 'OPEN')
       RETURNING *`,
      [req.user.id, finalSchoolId, finalBookingId, subject, description]
    );

    const complaint = complaintResult.rows[0];

    await client.query(
      `INSERT INTO complaint_messages
       (complaint_id, sender_user_id, message)
       VALUES ($1, $2, $3)`,
      [complaint.id, req.user.id, description]
    );

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       SELECT id, $1, $2, $3
       FROM users
       WHERE role IN ('ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF')`,
      [
        "New Complaint Raised",
        `New complaint received: ${subject}`,
        "COMPLAINT",
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      complaint,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating complaint",
    });
  } finally {
    client.release();
  }
};

// USER VIEW OWN COMPLAINTS
const getMyComplaints = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        comp.*,
        ds.school_name,
        b.booking_status
       FROM complaints comp
       LEFT JOIN driving_schools ds ON comp.school_id = ds.id
       LEFT JOIN bookings b ON comp.booking_id = b.id
       WHERE comp.raised_by_user_id = $1
       ORDER BY comp.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      complaints: result.rows,
    });
  } catch (error) {
    console.error("Get my complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting complaints",
    });
  }
};

// ADMIN VIEW ALL COMPLAINTS
const getAllComplaints = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        comp.*,
        u.full_name AS raised_by_name,
        u.email AS raised_by_email,
        u.phone AS raised_by_phone,
        ds.school_name,
        b.booking_status
      FROM complaints comp
      JOIN users u ON comp.raised_by_user_id = u.id
      LEFT JOIN driving_schools ds ON comp.school_id = ds.id
      LEFT JOIN bookings b ON comp.booking_id = b.id
    `;

    const values = [];

    if (status) {
      query += ` WHERE comp.status = $1`;
      values.push(status);
    }

    query += ` ORDER BY comp.created_at DESC`;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      count: result.rows.length,
      complaints: result.rows,
    });
  } catch (error) {
    console.error("Get all complaints error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting all complaints",
    });
  }
};

// VIEW ONE COMPLAINT WITH MESSAGES
const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaintResult = await pool.query(
      `SELECT
        comp.*,
        u.full_name AS raised_by_name,
        u.email AS raised_by_email,
        ds.school_name
       FROM complaints comp
       JOIN users u ON comp.raised_by_user_id = u.id
       LEFT JOIN driving_schools ds ON comp.school_id = ds.id
       WHERE comp.id = $1`,
      [complaintId]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const complaint = complaintResult.rows[0];

    let allowed = false;

    if (isAdminRole(req.user.role)) {
      allowed = true;
    }

    if (complaint.raised_by_user_id === req.user.id) {
      allowed = true;
    }

    if (req.user.role === "SCHOOL_OWNER" && complaint.school_id) {
      const school = await getSchoolByOwner(req.user.id);

      if (school && school.id === complaint.school_id) {
        allowed = true;
      }
    }

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this complaint",
      });
    }

    const messagesResult = await pool.query(
      `SELECT
        cm.*,
        u.full_name AS sender_name,
        u.role AS sender_role
       FROM complaint_messages cm
       JOIN users u ON cm.sender_user_id = u.id
       WHERE cm.complaint_id = $1
       ORDER BY cm.created_at ASC`,
      [complaintId]
    );

    return res.json({
      success: true,
      complaint,
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error("Get complaint by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting complaint",
    });
  }
};

// ADD MESSAGE TO COMPLAINT
const addComplaintMessage = async (req, res) => {
  const client = await pool.connect();

  try {
    const { complaintId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    await client.query("BEGIN");

    const complaintResult = await client.query(
      `SELECT *
       FROM complaints
       WHERE id = $1`,
      [complaintId]
    );

    if (complaintResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const complaint = complaintResult.rows[0];

    let allowed = false;

    if (isAdminRole(req.user.role)) {
      allowed = true;
    }

    if (complaint.raised_by_user_id === req.user.id) {
      allowed = true;
    }

    if (req.user.role === "SCHOOL_OWNER" && complaint.school_id) {
      const school = await getSchoolByOwner(req.user.id);

      if (school && school.id === complaint.school_id) {
        allowed = true;
      }
    }

    if (!allowed) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "You do not have access to this complaint",
      });
    }

    const messageResult = await client.query(
      `INSERT INTO complaint_messages
       (complaint_id, sender_user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [complaintId, req.user.id, message]
    );

    await client.query(
      `UPDATE complaints
       SET updated_at = NOW()
       WHERE id = $1`,
      [complaintId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Complaint message added successfully",
      complaint_message: messageResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Add complaint message error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while adding complaint message",
    });
  } finally {
    client.release();
  }
};

// ADMIN UPDATE COMPLAINT STATUS
const updateComplaintByAdmin = async (req, res) => {
  const client = await pool.connect();

  try {
    const { complaintId } = req.params;
    const { status, admin_response } = req.body;

    const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint status",
      });
    }

    await client.query("BEGIN");

    const oldComplaintResult = await client.query(
      `SELECT *
       FROM complaints
       WHERE id = $1`,
      [complaintId]
    );

    if (oldComplaintResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const oldComplaint = oldComplaintResult.rows[0];

    const updatedResult = await client.query(
      `UPDATE complaints
       SET status = $1,
           assigned_to_admin_id = $2,
           admin_response = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, req.user.id, admin_response || oldComplaint.admin_response, complaintId]
    );

    const updatedComplaint = updatedResult.rows[0];

    if (admin_response) {
      await client.query(
        `INSERT INTO complaint_messages
         (complaint_id, sender_user_id, message)
         VALUES ($1, $2, $3)`,
        [complaintId, req.user.id, admin_response]
      );
    }

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        oldComplaint.raised_by_user_id,
        "Complaint Status Updated",
        `Your complaint status is now ${status}.`,
        "COMPLAINT",
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
        "UPDATE_COMPLAINT_STATUS",
        "complaints",
        complaintId,
        oldComplaint,
        updatedComplaint,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating complaint",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  addComplaintMessage,
  updateComplaintByAdmin,
};