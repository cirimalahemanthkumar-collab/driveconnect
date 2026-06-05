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

async function getApprovedSchool(userId) {
  const school = await getSchoolByOwner(userId);

  if (!school) {
    return {
      error: {
        status: 404,
        message: "Driving school not found",
      },
    };
  }

  if (school.status !== "APPROVED") {
    return {
      error: {
        status: 403,
        message: "Driving school must be approved first",
      },
    };
  }

  return { school };
}

const allowedVehicleTypes = ["TWO_WHEELER", "CAR", "HEAVY_VEHICLE"];
const allowedTransmissions = ["MANUAL", "AUTOMATIC", "BOTH"];
const allowedFuelTypes = ["PETROL", "DIESEL", "CNG", "ELECTRIC"];

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

function normalizeUpperEnum(value, allowedValues) {
  const normalized = String(value || "").trim().toUpperCase();
  return allowedValues.includes(normalized) ? normalized : null;
}

function parseOptionalBoolean(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toUpperCase();
  if (["ACTIVE", "TRUE", "1", "YES"].includes(normalized)) return true;
  if (["INACTIVE", "FALSE", "0", "NO"].includes(normalized)) return false;

  return null;
}

// =========================
// INSTRUCTORS
// =========================

const getInstructors = async (req, res) => {
  try {
    const { school, error } = await getApprovedSchool(req.user.id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM instructors
       WHERE school_id = $1
       ORDER BY created_at DESC`,
      [school.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      instructors: result.rows,
    });
  } catch (error) {
    console.error("Get instructors error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting instructors",
    });
  }
};

const createInstructor = async (req, res) => {
  try {
    const { full_name, phone, email, license_number, experience_years } =
      req.body;

    if (!full_name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Instructor full name and phone are required",
      });
    }

    const { school, error } = await getApprovedSchool(req.user.id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const result = await pool.query(
      `INSERT INTO instructors
       (
        school_id,
        full_name,
        phone,
        email,
        license_number,
        experience_years,
        is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [
        school.id,
        full_name,
        phone,
        email || null,
        license_number || null,
        experience_years || 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Instructor created successfully",
      instructor: result.rows[0],
    });
  } catch (error) {
    console.error("Create instructor error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating instructor",
    });
  }
};

const updateInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { full_name, phone, email, license_number, experience_years } =
      req.body;

    if (!full_name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Instructor full name and phone are required",
      });
    }

    const { school, error } = await getApprovedSchool(req.user.id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const result = await pool.query(
      `UPDATE instructors
       SET
        full_name = $1,
        phone = $2,
        email = $3,
        license_number = $4,
        experience_years = $5,
        updated_at = NOW()
       WHERE id = $6 AND school_id = $7
       RETURNING *`,
      [
        full_name,
        phone,
        email || null,
        license_number || null,
        experience_years || 0,
        instructorId,
        school.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    return res.json({
      success: true,
      message: "Instructor updated successfully",
      instructor: result.rows[0],
    });
  } catch (error) {
    console.error("Update instructor error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating instructor",
    });
  }
};

const updateInstructorStatus = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Instructor active status is required",
      });
    }

    const { school, error } = await getApprovedSchool(req.user.id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const result = await pool.query(
      `UPDATE instructors
       SET is_active = $1,
           updated_at = NOW()
       WHERE id = $2 AND school_id = $3
       RETURNING *`,
      [is_active, instructorId, school.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    return res.json({
      success: true,
      message: "Instructor status updated successfully",
      instructor: result.rows[0],
    });
  } catch (error) {
    console.error("Update instructor status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating instructor status",
    });
  }
};

// =========================
// VEHICLES
// =========================

const getVehicles = async (req, res) => {
  try {
    const { school, error } = await getApprovedSchool(req.user.id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const result = await pool.query(
      `SELECT
        v.*,
        i.full_name AS instructor_name
       FROM vehicles v
       LEFT JOIN instructors i ON v.instructor_id = i.id
       WHERE v.school_id = $1
       ORDER BY v.created_at DESC`,
      [school.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      vehicles: result.rows,
    });
  } catch (error) {
    console.error("Get vehicles error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting vehicles",
    });
  }
};

const createVehicle = async (req, res) => {
  try {
    const {
      instructor_id,
      vehicle_number,
      registration_number,
      vehicle_type,
      transmission,
      model,
      fuel_type,
      is_active,
      vehicle_model,
      manufacturer,
      insurance_valid_until,
      pollution_valid_until,
      fitness_valid_until,
    } = req.body;

    const vehicleNumber = vehicle_number || registration_number;
    const vehicleModel = model || vehicle_model;

    if (!vehicleNumber || !vehicle_type || !vehicleModel || !transmission || !fuel_type) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number, vehicle type, model, transmission, and fuel type are required",
      });
    }

    const normalizedVehicleType = normalizeVehicleType(vehicle_type);

    if (!normalizedVehicleType) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicle type. Use ${allowedVehicleTypes.join(", ")}.`,
      });
    }

    const normalizedTransmission = normalizeUpperEnum(transmission, allowedTransmissions);

    if (!normalizedTransmission) {
      return res.status(400).json({
        success: false,
        message: `Invalid transmission type. Use ${allowedTransmissions.join(", ")}.`,
      });
    }

    const normalizedFuelType = normalizeUpperEnum(fuel_type, allowedFuelTypes);

    if (!normalizedFuelType) {
      return res.status(400).json({
        success: false,
        message: `Invalid fuel type. Use ${allowedFuelTypes.join(", ")}.`,
      });
    }

    const activeStatus = parseOptionalBoolean(is_active);

    if (activeStatus === null) {
      return res.status(400).json({
        success: false,
        message: "Vehicle status must be active or inactive",
      });
    }

    const { school, error } = await getApprovedSchool(req.user.id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    if (instructor_id) {
      const instructorCheck = await pool.query(
        `SELECT id
         FROM instructors
         WHERE id = $1 AND school_id = $2`,
        [instructor_id, school.id]
      );

      if (instructorCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid instructor for this school",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO vehicles
       (
        school_id,
        instructor_id,
        vehicle_number,
        vehicle_type,
        transmission,
        vehicle_model,
        fuel_type,
        manufacturer,
        insurance_valid_until,
        pollution_valid_until,
        fitness_valid_until,
        is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        school.id,
        instructor_id || null,
        vehicleNumber,
        normalizedVehicleType,
        normalizedTransmission,
        vehicleModel,
        normalizedFuelType,
        manufacturer || null,
        insurance_valid_until || null,
        pollution_valid_until || null,
        fitness_valid_until || null,
        activeStatus ?? true,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error("Create vehicle error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Vehicle number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating vehicle",
    });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const {
      instructor_id,
      vehicle_number,
      registration_number,
      vehicle_type,
      transmission,
      model,
      fuel_type,
      is_active,
      vehicle_model,
      manufacturer,
      insurance_valid_until,
      pollution_valid_until,
      fitness_valid_until,
    } = req.body;

    const vehicleNumber = vehicle_number || registration_number;
    const vehicleModel = model || vehicle_model;

    if (!vehicleNumber || !vehicle_type || !vehicleModel || !transmission || !fuel_type) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number, vehicle type, model, transmission, and fuel type are required",
      });
    }

    const normalizedVehicleType = normalizeVehicleType(vehicle_type);

    if (!normalizedVehicleType) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicle type. Use ${allowedVehicleTypes.join(", ")}.`,
      });
    }

    const normalizedTransmission = normalizeUpperEnum(transmission, allowedTransmissions);

    if (!normalizedTransmission) {
      return res.status(400).json({
        success: false,
        message: `Invalid transmission type. Use ${allowedTransmissions.join(", ")}.`,
      });
    }

    const normalizedFuelType = normalizeUpperEnum(fuel_type, allowedFuelTypes);

    if (!normalizedFuelType) {
      return res.status(400).json({
        success: false,
        message: `Invalid fuel type. Use ${allowedFuelTypes.join(", ")}.`,
      });
    }

    const activeStatus = parseOptionalBoolean(is_active);

    if (activeStatus === null) {
      return res.status(400).json({
        success: false,
        message: "Vehicle status must be active or inactive",
      });
    }

    const { school, error } = await getApprovedSchool(req.user.id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    if (instructor_id) {
      const instructorCheck = await pool.query(
        `SELECT id
         FROM instructors
         WHERE id = $1 AND school_id = $2`,
        [instructor_id, school.id]
      );

      if (instructorCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid instructor for this school",
        });
      }
    }

    const result = await pool.query(
      `UPDATE vehicles
       SET
        instructor_id = $1,
        vehicle_number = $2,
        vehicle_type = $3,
        transmission = $4,
        vehicle_model = $5,
        fuel_type = $6,
        manufacturer = $7,
        insurance_valid_until = $8,
        pollution_valid_until = $9,
        fitness_valid_until = $10,
        is_active = COALESCE($11, is_active),
        updated_at = NOW()
       WHERE id = $12 AND school_id = $13
       RETURNING *`,
      [
        instructor_id || null,
        vehicleNumber,
        normalizedVehicleType,
        normalizedTransmission,
        vehicleModel,
        normalizedFuelType,
        manufacturer || null,
        insurance_valid_until || null,
        pollution_valid_until || null,
        fitness_valid_until || null,
        activeStatus,
        vehicleId,
        school.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error("Update vehicle error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Vehicle number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating vehicle",
    });
  }
};

const updateVehicleStatus = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { is_active } = req.body;

    const activeStatus = parseOptionalBoolean(is_active);

    if (activeStatus === undefined || activeStatus === null) {
      return res.status(400).json({
        success: false,
        message: "Vehicle active status is required",
      });
    }

    const { school, error } = await getApprovedSchool(req.user.id);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const result = await pool.query(
      `UPDATE vehicles
       SET is_active = $1,
           updated_at = NOW()
       WHERE id = $2 AND school_id = $3
       RETURNING *`,
      [activeStatus, vehicleId, school.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.json({
      success: true,
      message: "Vehicle status updated successfully",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error("Update vehicle status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating vehicle status",
    });
  }
};

module.exports = {
  getInstructors,
  createInstructor,
  updateInstructor,
  updateInstructorStatus,
  getVehicles,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
};
