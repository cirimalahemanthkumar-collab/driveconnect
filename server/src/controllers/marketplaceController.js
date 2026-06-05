const pool = require("../db");
const { serializeSchool } = require("../utils/schoolVerification");

const getApprovedSchools = async (req, res) => {
  try {
    const { city, vehicle_type, transmission, search } = req.query;

    let query = `
      SELECT DISTINCT
        ds.*,
        (
          SELECT COUNT(*)::int
          FROM courses active_course
          WHERE active_course.school_id = ds.id
          AND active_course.is_active = true
        ) AS course_count,
        (
          SELECT COUNT(*)::int
          FROM courses active_course
          WHERE active_course.school_id = ds.id
          AND active_course.is_active = true
        ) AS "courseCount"
      FROM driving_schools ds
      LEFT JOIN courses c ON c.school_id = ds.id AND c.is_active = true
      WHERE ds.status::text = 'APPROVED'
      AND ds.verification_status::text = 'APPROVED'
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

    query += ` ORDER BY ds.average_rating DESC NULLS LAST, ds.created_at DESC`;

    const result = await pool.query(query, values);
    const schools = result.rows.map(serializeSchool);

    return res.json({
      success: true,
      count: schools.length,
      schools,
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
        *
       FROM driving_schools
       WHERE id = $1
       AND status::text = 'APPROVED'
       AND verification_status::text = 'APPROVED'`,
      [schoolId]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Approved driving school not found",
      });
    }

    const coursesResult = await pool.query(
      `SELECT
        id,
        school_id,
        course_name,
        course_name AS "courseName",
        course_type,
        course_type AS "courseType",
        vehicle_type,
        vehicle_type AS "vehicleType",
        transmission,
        duration_days,
        duration_days AS "durationDays",
        total_sessions,
        total_sessions AS "totalSessions",
        price,
        advance_amount,
        advance_amount AS "advanceAmount",
        description,
        is_active,
        created_at,
        created_at AS "createdAt"
       FROM courses
       WHERE school_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [schoolId]
    );

    const school = serializeSchool(schoolResult.rows[0]);

    return res.json({
      success: true,
      school,
      ...school,
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
        c.id,
        c.school_id,
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
        c.total_sessions AS "totalSessions",
        c.price,
        c.advance_amount,
        c.advance_amount AS "advanceAmount",
        c.description,
        c.is_active,
        c.created_at,
        c.created_at AS "createdAt",
        ds.school_name,
        ds.city,
        ds.state,
        ds.address,
        ds.average_rating,
        ds.total_reviews
      FROM courses c
      JOIN driving_schools ds ON c.school_id = ds.id
      WHERE ds.status::text = 'APPROVED'
      AND ds.verification_status::text = 'APPROVED'
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
        c.id,
        c.school_id,
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
        c.total_sessions AS "totalSessions",
        c.price,
        c.advance_amount,
        c.advance_amount AS "advanceAmount",
        c.description,
        c.is_active,
        c.created_at,
        c.created_at AS "createdAt",
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
       AND ds.status::text = 'APPROVED'
       AND ds.verification_status::text = 'APPROVED'`,
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
