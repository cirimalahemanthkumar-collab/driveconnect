const pool = require("../db");

const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        cp.*,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.status
       FROM customer_profiles cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    return res.json({
      success: true,
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Get customer profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting customer profile",
    });
  }
};

const createOrUpdateMyProfile = async (req, res) => {
  try {
    const {
      date_of_birth,
      gender,
      address,
      city,
      state,
      pincode,
      learner_license_number,
      driving_license_number,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO customer_profiles
       (
        user_id,
        date_of_birth,
        gender,
        address,
        city,
        state,
        pincode,
        learner_license_number,
        driving_license_number,
        emergency_contact_name,
        emergency_contact_phone
       )
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id)
       DO UPDATE SET
        date_of_birth = EXCLUDED.date_of_birth,
        gender = EXCLUDED.gender,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        pincode = EXCLUDED.pincode,
        learner_license_number = EXCLUDED.learner_license_number,
        driving_license_number = EXCLUDED.driving_license_number,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone,
        updated_at = NOW()
       RETURNING *`,
      [
        req.user.id,
        date_of_birth,
        gender,
        address,
        city,
        state,
        pincode,
        learner_license_number,
        driving_license_number,
        emergency_contact_name,
        emergency_contact_phone,
      ]
    );

    return res.json({
      success: true,
      message: "Customer profile saved successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Save customer profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while saving customer profile",
    });
  }
};

module.exports = {
  getMyProfile,
  createOrUpdateMyProfile,
};