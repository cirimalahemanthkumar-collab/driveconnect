const pool = require("../db");

const getMySchool = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM driving_schools
       WHERE owner_user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
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
    console.error("Get my school error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting driving school",
    });
  }
};

const createOrUpdateMySchool = async (req, res) => {
  try {
    const {
      school_name,
      description,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      service_radius_km,
    } = req.body;

    if (!school_name || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message: "School name, address, city, and state are required",
      });
    }

    const existingSchool = await pool.query(
      `SELECT id, status
       FROM driving_schools
       WHERE owner_user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    let result;

    if (existingSchool.rows.length > 0) {
      const schoolId = existingSchool.rows[0].id;

      result = await pool.query(
        `UPDATE driving_schools
         SET
          school_name = $1,
          description = $2,
          email = $3,
          phone = $4,
          address = $5,
          city = $6,
          state = $7,
          pincode = $8,
          latitude = $9,
          longitude = $10,
          service_radius_km = $11,
          status = CASE 
            WHEN status = 'APPROVED' THEN 'UNDER_REVIEW'
            ELSE status
          END,
          updated_at = NOW()
         WHERE id = $12
         RETURNING *`,
        [
          school_name,
          description,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          latitude,
          longitude,
          service_radius_km || 10,
          schoolId,
        ]
      );

      return res.json({
        success: true,
        message: "Driving school updated successfully",
        school: result.rows[0],
      });
    }

    result = await pool.query(
      `INSERT INTO driving_schools
       (
        owner_user_id,
        school_name,
        description,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        latitude,
        longitude,
        service_radius_km,
        status
       )
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING')
       RETURNING *`,
      [
        req.user.id,
        school_name,
        description,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        latitude,
        longitude,
        service_radius_km || 10,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Driving school registered successfully. Waiting for admin approval.",
      school: result.rows[0],
    });
  } catch (error) {
    console.error("Create/update school error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while saving driving school",
    });
  }
};

module.exports = {
  getMySchool,
  createOrUpdateMySchool,
};