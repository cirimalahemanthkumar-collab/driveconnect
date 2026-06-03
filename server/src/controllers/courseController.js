const pool = require("../db");

async function getApprovedSchoolByOwner(userId) {
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

const getMyCourses = async (req, res) => {
  try {
    const school = await getApprovedSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM courses
       WHERE school_id = $1
       ORDER BY created_at DESC`,
      [school.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      courses: result.rows,
    });
  } catch (error) {
    console.error("Get courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting courses",
    });
  }
};

const createCourse = async (req, res) => {
  try {
    const {
      course_name,
      description,
      vehicle_type,
      transmission,
      duration_days,
      total_sessions,
      price,
      discount_price,
      platform_commission_percent,
    } = req.body;

    if (
      !course_name ||
      !vehicle_type ||
      !transmission ||
      !duration_days ||
      !total_sessions ||
      !price
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Course name, vehicle type, transmission, duration days, total sessions, and price are required",
      });
    }

    const allowedVehicleTypes = ["TWO_WHEELER", "CAR", "HEAVY_VEHICLE"];
    const allowedTransmissions = ["MANUAL", "AUTOMATIC"];

    if (!allowedVehicleTypes.includes(vehicle_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle type",
      });
    }

    if (!allowedTransmissions.includes(transmission)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transmission type",
      });
    }

    const school = await getApprovedSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    if (school.status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Your driving school must be approved before adding courses",
      });
    }

    const result = await pool.query(
      `INSERT INTO courses
       (
        school_id,
        course_name,
        description,
        vehicle_type,
        transmission,
        duration_days,
        total_sessions,
        price,
        discount_price,
        platform_commission_percent,
        is_active
       )
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING *`,
      [
        school.id,
        course_name,
        description,
        vehicle_type,
        transmission,
        duration_days,
        total_sessions,
        price,
        discount_price || null,
        platform_commission_percent || 10,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: result.rows[0],
    });
  } catch (error) {
    console.error("Create course error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating course",
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const {
      course_name,
      description,
      vehicle_type,
      transmission,
      duration_days,
      total_sessions,
      price,
      discount_price,
      platform_commission_percent,
    } = req.body;

    const school = await getApprovedSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const courseCheck = await pool.query(
      `SELECT *
       FROM courses
       WHERE id = $1 AND school_id = $2`,
      [courseId, school.id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const result = await pool.query(
      `UPDATE courses
       SET
        course_name = $1,
        description = $2,
        vehicle_type = $3,
        transmission = $4,
        duration_days = $5,
        total_sessions = $6,
        price = $7,
        discount_price = $8,
        platform_commission_percent = $9,
        updated_at = NOW()
       WHERE id = $10 AND school_id = $11
       RETURNING *`,
      [
        course_name,
        description,
        vehicle_type,
        transmission,
        duration_days,
        total_sessions,
        price,
        discount_price || null,
        platform_commission_percent || 10,
        courseId,
        school.id,
      ]
    );

    return res.json({
      success: true,
      message: "Course updated successfully",
      course: result.rows[0],
    });
  } catch (error) {
    console.error("Update course error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating course",
    });
  }
};

const updateCourseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { is_active } = req.body;

    const school = await getApprovedSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const result = await pool.query(
      `UPDATE courses
       SET is_active = $1,
           updated_at = NOW()
       WHERE id = $2 AND school_id = $3
       RETURNING *`,
      [is_active, courseId, school.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      message: "Course status updated successfully",
      course: result.rows[0],
    });
  } catch (error) {
    console.error("Update course status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating course status",
    });
  }
};

module.exports = {
  getMyCourses,
  createCourse,
  updateCourse,
  updateCourseStatus,
};