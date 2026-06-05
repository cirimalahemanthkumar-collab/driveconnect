const express = require("express");

const {
  getSchools,
  getSchoolById,
  updateSchoolStatus,
} = require("../controllers/adminSchoolController");
const {
  getUsers,
  getCourses,
  getBookings,
  getReviews,
} = require("../controllers/adminListController");
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
  "/users",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  getUsers
);

router.get(
  "/courses",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  getCourses
);

router.get(
  "/bookings",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  getBookings
);

router.get(
  "/reviews",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  getReviews
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
