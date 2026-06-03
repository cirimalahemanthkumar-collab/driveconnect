const express = require("express");

const {
  createOrUpdateReview,
  getMyReviews,
  getSchoolReviews,
} = require("../controllers/reviewController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("CUSTOMER"),
  createOrUpdateReview
);

router.get(
  "/my",
  protect,
  allowRoles("CUSTOMER"),
  getMyReviews
);

router.get(
  "/school/:schoolId",
  getSchoolReviews
);

module.exports = router;