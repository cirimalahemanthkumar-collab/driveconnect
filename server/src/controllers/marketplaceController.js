const pool = require("../db");

const getApprovedSchools = async (req, res) => {
  try {
    const { city, vehicle_type, transmission, search } = req.query;

    let query = `
      SELECT DISTINCT
        ds.id,
        ds.school_name,
        ds.description,
        ds.email,
        ds.phone,
        ds.address,
        ds.city,
        ds.state,
        ds.pincode,
        ds.latitude,
        ds.longitude,
        ds.service_radius_km,
        ds.average_rating,
        ds.total_reviews,
        ds.created_at
      FROM driving_schools ds
      LEFT JOIN courses c ON c.school_id = ds.id
      WHERE ds.status = 'APPROVED'
    `;

    const values = [];
    let count = 1;

    if (city) {
      query += ` AND LOWER(ds.city) = LOWER($${count})`;
      values.push(city);
      count++;
    }

    if (vehicle_type) {
      query += ` AND c.vehicle_type = $${count}`;
      values.push(vehicle_type);
      count++;
    }

    if (transmission) {
      query += ` AND c.transmission = $${count}`;
      values.push(transmission);
      count++;
    }

    if (search) {
      query += ` AND (
        LOWER(ds.school_name) LIKE LOWER($${count})
        OR LOWER(ds.city) LIKE LOWER($${count})
        OR LOWER(ds.address) LIKE LOWER($${count})
      )`;
      values.push(`%${search}%`);
      count++;
    }

    query += ` ORDER BY ds.created_at DESC`;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      count: result.rows.length,
      schools: result.rows,
    });
  } catch (error) {
    console.error("Get approved schools error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting schools",
    });
  }
};

const getSchoolDetails = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const schoolResult = await pool.query(
      `SELECT
        id,
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
        average_rating,
        total_reviews,
        created_at
       FROM driving_schools
       WHERE id = $1 AND status = 'APPROVED'`,
      [schoolId]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Approved driving school not found",
      });
    }

    const coursesResult = await pool.query(
      `SELECT *
       FROM courses
       WHERE school_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [schoolId]
    );

    return res.json({
      success: true,
      school: schoolResult.rows[0],
      courses: coursesResult.rows,
    });
  } catch (error) {
    console.error("Get school details error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting school details",
    });
  }
};

const getAvailableCourses = async (req, res) => {
  try {
    const { city, vehicle_type, transmission } = req.query;

    let query = `
      SELECT
        c.*,
        ds.school_name,
        ds.city,
        ds.state,
        ds.address,
        ds.average_rating,
        ds.total_reviews
      FROM courses c
      JOIN driving_schools ds ON c.school_id = ds.id
      WHERE ds.status = 'APPROVED'
      AND c.is_active = true
    `;

    const values = [];
    let count = 1;

    if (city) {
      query += ` AND LOWER(ds.city) = LOWER($${count})`;
      values.push(city);
      count++;
    }

    if (vehicle_type) {
      query += ` AND c.vehicle_type = $${count}`;
      values.push(vehicle_type);
      count++;
    }

    if (transmission) {
      query += ` AND c.transmission = $${count}`;
      values.push(transmission);
      count++;
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      count: result.rows.length,
      courses: result.rows,
    });
  } catch (error) {
    console.error("Get available courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting courses",
    });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await pool.query(
      `SELECT
        c.*,
        ds.school_name,
        ds.description AS school_description,
        ds.email AS school_email,
        ds.phone AS school_phone,
        ds.address,
        ds.city,
        ds.state,
        ds.pincode,
        ds.latitude,
        ds.longitude,
        ds.average_rating,
        ds.total_reviews
       FROM courses c
       JOIN driving_schools ds ON c.school_id = ds.id
       WHERE c.id = $1
       AND c.is_active = true
       AND ds.status = 'APPROVED'`,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      course: result.rows[0],
    });
  } catch (error) {
    console.error("Get course details error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting course details",
    });
  }
};

module.exports = {
  getApprovedSchools,
  getSchoolDetails,
  getAvailableCourses,
  getCourseDetails,
};