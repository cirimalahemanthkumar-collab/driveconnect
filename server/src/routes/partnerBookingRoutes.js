const express = require("express");

const {
  getPartnerBookings,
  getPartnerBookingById,
  updatePartnerBookingStatus,
  completePartnerBooking,
} = require("../controllers/partnerBookingController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("SCHOOL_OWNER"),
  getPartnerBookings
);

router.get(
  "/:bookingId",
  protect,
  allowRoles("SCHOOL_OWNER"),
  getPartnerBookingById
);

router.patch(
  "/:bookingId/status",
  protect,
  allowRoles("SCHOOL_OWNER"),
  updatePartnerBookingStatus
);

router.patch(
  "/:bookingId/complete",
  protect,
  allowRoles("SCHOOL_OWNER"),
  completePartnerBooking
);

module.exports = router;