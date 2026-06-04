const pool = require("../db");

const allowedVehicleTypes = ["TWO_WHEELER", "CAR", "HEAVY_VEHICLE"];
const allowedTransmissions = ["MANUAL", "AUTOMATIC", "BOTH"];
const allowedCourseTypes = ["BEGINNER", "ADVANCED", "REFRESHER", "TEST_PREP"];

function normalizeVehicleType(vehicleType) {
  switch (String(vehicleType || "").trim().toUpperCase()) {
    case "FOUR_WHEELER":
    case "CAR":
      return "CAR";
    case "TWO_WHEELER":
      return "TWO_WHEELER";
    case "HEAVY_VEHICLE":
      return "HEAVY_VEHICLE";
    default:
      return null;
  }
}

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
      course_type,
      vehicle_type,
      transmission,
      duration_days,
      total_sessions,
      price,
      advance_amount,
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

    const normalizedVehicleType = normalizeVehicleType(vehicle_type);

    if (!normalizedVehicleType) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicle type. Use ${allowedVehicleTypes.join(", ")}.`,
      });
    }

    if (!allowedTransmissions.includes(transmission)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transmission type",
      });
    }

    if (course_type && !allowedCourseTypes.includes(course_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course type",
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
        course_type,
        vehicle_type,
        transmission,
        duration_days,
        total_sessions,
        price,
        advance_amount,
        discount_price,
        platform_commission_percent,
        is_active
       )
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
       RETURNING *`,
      [
        school.id,
        course_name,
        description,
        course_type || null,
        normalizedVehicleType,
        transmission,
        duration_days,
        total_sessions,
        price,
        advance_amount || 0,
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
      course_type,
      vehicle_type,
      transmission,
      duration_days,
      total_sessions,
      price,
      advance_amount,
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

    const normalizedVehicleType = normalizeVehicleType(vehicle_type);

    if (!normalizedVehicleType) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicle type. Use ${allowedVehicleTypes.join(", ")}.`,
      });
    }

    if (!allowedTransmissions.includes(transmission)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transmission type",
      });
    }

    if (course_type && !allowedCourseTypes.includes(course_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course type",
      });
    }

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
        course_type = $3,
        vehicle_type = $4,
        transmission = $5,
        duration_days = $6,
        total_sessions = $7,
        price = $8,
        advance_amount = $9,
        discount_price = $10,
        platform_commission_percent = $11,
        updated_at = NOW()
       WHERE id = $12 AND school_id = $13
       RETURNING *`,
      [
        course_name,
        description,
        course_type || null,
        normalizedVehicleType,
        transmission,
        duration_days,
        total_sessions,
        price,
        advance_amount || 0,
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

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Course active status is required",
      });
    }

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
