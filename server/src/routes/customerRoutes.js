const express = require("express");
const {
  getMyProfile,
  createOrUpdateMyProfile,
} = require("../controllers/customerController");
const {
  getCustomerSessions,
} = require("../controllers/sessionController");
const {
  createOrUpdateReview,
  getMyReviews,
} = require("../controllers/reviewController");
const {
  createComplaint,
  getMyComplaints,
} = require("../controllers/complaintController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/profile",
  protect,
  allowRoles("CUSTOMER"),
  getMyProfile
);

router.put(
  "/profile",
  protect,
  allowRoles("CUSTOMER"),
  createOrUpdateMyProfile
);

router.get(
  "/sessions",
  protect,
  allowRoles("CUSTOMER"),
  getCustomerSessions
);

router.get(
  "/reviews",
  protect,
  allowRoles("CUSTOMER"),
  getMyReviews
);

router.post(
  "/reviews",
  protect,
  allowRoles("CUSTOMER"),
  createOrUpdateReview
);

router.get(
  "/complaints",
  protect,
  allowRoles("CUSTOMER"),
  getMyComplaints
);

router.post(
  "/complaints",
  protect,
  allowRoles("CUSTOMER"),
  createComplaint
);

module.exports = router;
