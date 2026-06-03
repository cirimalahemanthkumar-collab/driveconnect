const express = require("express");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelMyBooking,
} = require("../controllers/bookingController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("CUSTOMER"),
  createBooking
);

router.get(
  "/",
  protect,
  allowRoles("CUSTOMER"),
  getMyBookings
);

router.get(
  "/:bookingId",
  protect,
  allowRoles("CUSTOMER"),
  getBookingById
);

router.patch(
  "/:bookingId/cancel",
  protect,
  allowRoles("CUSTOMER"),
  cancelMyBooking
);

module.exports = router;