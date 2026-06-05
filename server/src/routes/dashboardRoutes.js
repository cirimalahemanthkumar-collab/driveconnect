const express = require("express");

const {
  getAdminDashboard,
  getPartnerDashboard,
} = require("../controllers/dashboardController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/admin",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  getAdminDashboard
);

router.get(
  "/partner",
  protect,
  allowRoles("SCHOOL_OWNER"),
  getPartnerDashboard
);

module.exports = router;
