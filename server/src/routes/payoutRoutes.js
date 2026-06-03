const express = require("express");

const {
  getPartnerPayouts,
  getPartnerEarningsSummary,
  getAdminPayouts,
  markPayoutPaid,
} = require("../controllers/payoutController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/partner",
  protect,
  allowRoles("SCHOOL_OWNER"),
  getPartnerPayouts
);

router.get(
  "/partner/summary",
  protect,
  allowRoles("SCHOOL_OWNER"),
  getPartnerEarningsSummary
);

router.get(
  "/admin",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN", "ACCOUNTANT"),
  getAdminPayouts
);

router.patch(
  "/admin/:payoutId/paid",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN", "ACCOUNTANT"),
  markPayoutPaid
);

module.exports = router;