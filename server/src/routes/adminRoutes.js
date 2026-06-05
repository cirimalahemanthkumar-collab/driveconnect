const express = require("express");

const {
  getSchools,
  getSchoolById,
  updateSchoolStatus,
} = require("../controllers/adminSchoolController");
const { getAdminDashboard } = require("../controllers/dashboardController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  getAdminDashboard
);

router.get(
  "/schools",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  getSchools
);

router.get(
  "/schools/:schoolId",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  getSchoolById
);

router.patch(
  "/schools/:schoolId/status",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  updateSchoolStatus
);

module.exports = router;
