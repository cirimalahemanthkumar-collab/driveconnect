const express = require("express");

const {
  getMarketplaceSummary,
  getApprovedSchools,
  getSchoolDetails,
  getAvailableCourses,
  getCourseDetails,
} = require("../controllers/marketplaceController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/summary", getMarketplaceSummary);

router.get("/schools", getApprovedSchools);
router.get("/schools/:schoolId", protect, allowRoles("CUSTOMER"), getSchoolDetails);

router.get("/courses", getAvailableCourses);
router.get("/courses/:courseId", protect, allowRoles("CUSTOMER"), getCourseDetails);

module.exports = router;
