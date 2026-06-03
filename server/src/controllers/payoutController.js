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

const getPartnerPayouts = async (req, res) => {
  try {
    const school = await getSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const result = await pool.query(
      `SELECT
        sp.*,
        b.booking_status,
        c.course_name,
        u.full_name AS customer_name,
        u.phone AS customer_phone
       FROM school_payouts sp
       LEFT JOIN bookings b ON sp.booking_id = b.id
       LEFT JOIN courses c ON b.course_id = c.id
       LEFT JOIN users u ON b.customer_user_id = u.id
       WHERE sp.school_id = $1
       ORDER BY sp.created_at DESC`,
      [school.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      payouts: result.rows,
    });
  } catch (error) {
    console.error("Get partner payouts error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting partner payouts",
    });
  }
};

const getPartnerEarningsSummary = async (req, res) => {
  try {
    const school = await getSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const result = await pool.query(
      `SELECT
        COALESCE(SUM(gross_amount), 0) AS total_gross_amount,
        COALESCE(SUM(commission_amount), 0) AS total_platform_commission,
        COALESCE(SUM(payout_amount), 0) AS total_school_earning,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN payout_amount ELSE 0 END), 0) AS pending_payout_amount,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN payout_amount ELSE 0 END), 0) AS paid_payout_amount,
        COUNT(*)::int AS total_payout_records
       FROM school_payouts
       WHERE school_id = $1`,
      [school.id]
    );

    return res.json({
      success: true,
      school: {
        id: school.id,
        school_name: school.school_name,
      },
      summary: result.rows[0],
    });
  } catch (error) {
    console.error("Get partner earnings summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting earnings summary",
    });
  }
};

const getAdminPayouts = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        sp.*,
        ds.school_name,
        ds.city,
        ds.phone AS school_phone,
        u.full_name AS owner_name,
        u.email AS owner_email,
        u.phone AS owner_phone,
        b.booking_status,
        c.course_name
      FROM school_payouts sp
      JOIN driving_schools ds ON sp.school_id = ds.id
      JOIN users u ON ds.owner_user_id = u.id
      LEFT JOIN bookings b ON sp.booking_id = b.id
      LEFT JOIN courses c ON b.course_id = c.id
    `;

    const values = [];

    if (status) {
      query += ` WHERE sp.status = $1`;
      values.push(status);
    }

    query += ` ORDER BY sp.created_at DESC`;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      count: result.rows.length,
      payouts: result.rows,
    });
  } catch (error) {
    console.error("Get admin payouts error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting admin payouts",
    });
  }
};

const markPayoutPaid = async (req, res) => {
  const client = await pool.connect();

  try {
    const { payoutId } = req.params;
    const { payout_reference } = req.body;

    await client.query("BEGIN");

    const oldPayoutResult = await client.query(
      `SELECT
        sp.*,
        ds.owner_user_id,
        ds.school_name
       FROM school_payouts sp
       JOIN driving_schools ds ON sp.school_id = ds.id
       WHERE sp.id = $1`,
      [payoutId]
    );

    if (oldPayoutResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Payout not found",
      });
    }

    const oldPayout = oldPayoutResult.rows[0];

    if (oldPayout.status === "PAID") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Payout already marked as paid",
      });
    }

    const updatedResult = await client.query(
      `UPDATE school_payouts
       SET status = 'PAID',
           payout_reference = $1,
           payout_date = NOW()
       WHERE id = $2
       RETURNING *`,
      [payout_reference || `MANUAL_PAYOUT_${Date.now()}`, payoutId]
    );

    const updatedPayout = updatedResult.rows[0];

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        oldPayout.owner_user_id,
        "Payout Paid",
        `Your payout for ${oldPayout.school_name} has been marked as paid.`,
        "PAYMENT",
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
        "MARK_PAYOUT_PAID",
        "school_payouts",
        payoutId,
        oldPayout,
        updatedPayout,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Payout marked as paid successfully",
      payout: updatedPayout,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Mark payout paid error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while marking payout paid",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getPartnerPayouts,
  getPartnerEarningsSummary,
  getAdminPayouts,
  markPayoutPaid,
};