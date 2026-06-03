const express = require("express");
const {
  getMyProfile,
  createOrUpdateMyProfile,
} = require("../controllers/customerController");

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

module.exports = router;