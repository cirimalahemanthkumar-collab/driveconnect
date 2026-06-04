const pool = require("../db");
const {
  cleanOptionalText,
  normalizeSubmittedStatus,
  serializeSchool,
} = require("../utils/schoolVerification");

const getSchools = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        ds.*,
        COALESCE(NULLIF(ds.owner_name, ''), u.full_name, '') AS owner_name,
        COALESCE(NULLIF(ds.owner_email, ''), u.email, '') AS owner_email,
        COALESCE(NULLIF(ds.owner_phone, ''), u.phone, '') AS owner_phone,
        u.full_name AS owner_account_name,
        u.email AS owner_account_email,
        u.phone AS owner_account_phone
      FROM driving_schools ds
      JOIN users u ON ds.owner_user_id = u.id
    `;

    const values = [];
    const normalizedStatus = normalizeSubmittedStatus(status);

    if (status && String(status).toUpperCase() !== "ALL") {
      if (!normalizedStatus) {
        return res.status(400).json({
          success: false,
          message: "Status must be one of APPROVED, PENDING, REJECTED, or SUSPENDED",
        });
      }

      if (normalizedStatus === "PENDING") {
        query += ` WHERE (
          ds.status::text IN ('PENDING', 'UNDER_REVIEW')
          OR ds.verification_status::text IN ('PENDING', 'UNDER_REVIEW')
        )`;
      } else if (normalizedStatus === "APPROVED") {
        query += ` WHERE (
          ds.status::text IN ('APPROVED', 'VERIFIED')
          OR ds.verification_status::text IN ('APPROVED', 'VERIFIED')
        )`;
      } else {
        query += ` WHERE (ds.status::text = $1 OR ds.verification_status::text = $1)`;
        values.push(normalizedStatus);
      }
    }

    query += ` ORDER BY COALESCE(ds.verification_submitted_at, ds.updated_at, ds.created_at) DESC`;

    const result = await pool.query(query, values);
    const schools = result.rows.map(serializeSchool);

    return res.json({
      success: true,
      count: schools.length,
      schools,
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
        COALESCE(NULLIF(ds.owner_name, ''), u.full_name, '') AS owner_name,
        COALESCE(NULLIF(ds.owner_email, ''), u.email, '') AS owner_email,
        COALESCE(NULLIF(ds.owner_phone, ''), u.phone, '') AS owner_phone,
        u.full_name AS owner_account_name,
        u.email AS owner_account_email,
        u.phone AS owner_account_phone
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

    const school = serializeSchool(result.rows[0]);

    return res.json({
      success: true,
      school,
      ...school,
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
    const { status, admin_notes, rejection_reason } = req.body;
    const reviewStatus = normalizeSubmittedStatus(status);

    if (!reviewStatus) {
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
        verification_status = $1,
        rejection_reason = $2,
        admin_notes = $3,
        verification_reviewed_at = NOW(),
        verification_reviewed_by = $4,
        updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        reviewStatus,
        reviewStatus === "REJECTED"
          ? cleanOptionalText(rejection_reason || admin_notes) || "Rejected by admin"
          : null,
        admin_notes || null,
        req.user.id,
        schoolId,
      ]
    );

    const updatedSchool = updateResult.rows[0];

    if (["APPROVED", "REJECTED"].includes(reviewStatus)) {
      await client.query(
        `UPDATE school_documents
         SET status = $1,
             rejection_reason = CASE WHEN $1 = 'REJECTED' THEN $2 ELSE NULL END,
             reviewed_by_admin_id = $3,
             reviewed_at = NOW()
         WHERE school_id = $4`,
        [
          reviewStatus,
          reviewStatus === "REJECTED"
            ? cleanOptionalText(rejection_reason || admin_notes) || "Rejected by admin"
            : null,
          req.user.id,
          schoolId,
        ]
      );
    }

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        updatedSchool.owner_user_id,
        "Driving School Status Updated",
        `Your driving school "${updatedSchool.school_name}" status is now ${reviewStatus}.`,
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

    const school = serializeSchool(updatedSchool);

    return res.json({
      success: true,
      message: `Driving school status updated to ${reviewStatus}`,
      school,
      ...school,
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
