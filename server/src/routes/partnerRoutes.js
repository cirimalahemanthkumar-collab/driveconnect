const express = require("express");

const {
  getMySchool,
  createOrUpdateMySchool,
} = require("../controllers/partnerController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/school",
  protect,
  allowRoles("SCHOOL_OWNER"),
  getMySchool
);

router.put(
  "/school",
  protect,
  allowRoles("SCHOOL_OWNER"),
  createOrUpdateMySchool
);

module.exports = router;