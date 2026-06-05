const express = require("express");

const {
  getInstructors,
  createInstructor,
  updateInstructor,
  updateInstructorStatus,
  getVehicles,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
} = require("../controllers/partnerAssetsController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Instructor routes
router.get(
  "/instructors",
  protect,
  allowRoles("SCHOOL_OWNER", "PARTNER"),
  getInstructors
);

router.post(
  "/instructors",
  protect,
  allowRoles("SCHOOL_OWNER", "PARTNER"),
  createInstructor
);

router.put(
  "/instructors/:instructorId",
  protect,
  allowRoles("SCHOOL_OWNER", "PARTNER"),
  updateInstructor
);

router.patch(
  "/instructors/:instructorId/status",
  protect,
  allowRoles("SCHOOL_OWNER", "PARTNER"),
  updateInstructorStatus
);

// Vehicle routes
router.get(
  "/vehicles",
  protect,
  allowRoles("SCHOOL_OWNER", "PARTNER"),
  getVehicles
);

router.post(
  "/vehicles",
  protect,
  allowRoles("SCHOOL_OWNER", "PARTNER"),
  createVehicle
);

router.put(
  "/vehicles/:vehicleId",
  protect,
  allowRoles("SCHOOL_OWNER", "PARTNER"),
  updateVehicle
);

router.patch(
  "/vehicles/:vehicleId/status",
  protect,
  allowRoles("SCHOOL_OWNER", "PARTNER"),
  updateVehicleStatus
);

module.exports = router;
