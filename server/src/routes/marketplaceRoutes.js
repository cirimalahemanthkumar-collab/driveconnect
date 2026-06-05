const express = require("express");

const {
  getMarketplaceSummary,
  getApprovedSchools,
  getSchoolDetails,
  getAvailableCourses,
  getCourseDetails,
} = require("../controllers/marketplaceController");

const router = express.Router();

router.get("/summary", getMarketplaceSummary);

router.get("/schools", getApprovedSchools);
router.get("/schools/:schoolId", getSchoolDetails);

router.get("/courses", getAvailableCourses);
router.get("/courses/:courseId", getCourseDetails);

module.exports = router;
