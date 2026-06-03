const express = require("express");

const {
  createClassSession,
  getPartnerSessions,
  getCustomerSessions,
  updateSessionStatus,
} = require("../controllers/sessionController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/partner",
  protect,
  allowRoles("SCHOOL_OWNER"),
  createClassSession
);

router.get(
  "/partner",
  protect,
  allowRoles("SCHOOL_OWNER"),
  getPartnerSessions
);

router.patch(
  "/partner/:sessionId/status",
  protect,
  allowRoles("SCHOOL_OWNER"),
  updateSessionStatus
);

router.get(
  "/customer",
  protect,
  allowRoles("CUSTOMER"),
  getCustomerSessions
);

module.exports = router;