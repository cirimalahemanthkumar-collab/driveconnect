const express = require("express");

const {
  getMyCourses,
  createCourse,
  updateCourse,
  updateCourseStatus,
} = require("../controllers/courseController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("SCHOOL_OWNER"),
  getMyCourses
);

router.post(
  "/",
  protect,
  allowRoles("SCHOOL_OWNER"),
  createCourse
);

router.put(
  "/:courseId",
  protect,
  allowRoles("SCHOOL_OWNER"),
  updateCourse
);

router.patch(
  "/:courseId/status",
  protect,
  allowRoles("SCHOOL_OWNER"),
  updateCourseStatus
);

module.exports = router;