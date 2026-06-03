const pool = require("../db");

const getSchools = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        ds.*,
        u.full_name AS owner_name,
        u.email AS owner_email,
        u.phone AS owner_phone
      FROM driving_schools ds
      JOIN users u ON ds.owner_user_id = u.id
    `;

    const values = [];

    if (status) {
      query += ` WHERE ds.status = $1`;
      values.push(status);
    }

    query += ` ORDER BY ds.created_at DESC`;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      count: result.rows.length,
      schools: result.rows,
    });
  } catch (error) {
    console.error("Get schools error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting schools",
    });
  }
};

const getSchoolById = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const result = await pool.query(
      `SELECT 
        ds.*,
        u.full_name AS owner_name,
        u.email AS owner_email,
        u.phone AS owner_phone
       FROM driving_schools ds
       JOIN users u ON ds.owner_user_id = u.id
       WHERE ds.id = $1`,
      [schoolId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    return res.json({
      success: true,
      school: result.rows[0],
    });
  } catch (error) {
    console.error("Get school by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting school",
    });
  }
};

const updateSchoolStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { schoolId } = req.params;
    const { status, admin_notes } = req.body;

    const allowedStatuses = [
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "SUSPENDED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid school status",
      });
    }

    await client.query("BEGIN");

    const oldSchoolResult = await client.query(
      `SELECT * FROM driving_schools WHERE id = $1`,
      [schoolId]
    );

    if (oldSchoolResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const oldSchool = oldSchoolResult.rows[0];

    const updateResult = await client.query(
      `UPDATE driving_schools
       SET 
        status = $1,
        admin_notes = $2,
        updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, admin_notes || null, schoolId]
    );

    const updatedSchool = updateResult.rows[0];

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        updatedSchool.owner_user_id,
        "Driving School Status Updated",
        `Your driving school "${updatedSchool.school_name}" status is now ${status}.`,
        "SCHOOL_STATUS",
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
        "UPDATE_SCHOOL_STATUS",
        "driving_schools",
        schoolId,
        oldSchool,
        updatedSchool,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: `Driving school status updated to ${status}`,
      school: updatedSchool,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update school status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating school status",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getSchools,
  getSchoolById,
  updateSchoolStatus,
};