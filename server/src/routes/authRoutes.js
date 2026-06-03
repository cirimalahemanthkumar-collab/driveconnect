const express = require("express");
const { register, login } = require("../controllers/authController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

router.get(
  "/admin-test",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin access granted",
      user: req.user,
    });
  }
);

module.exports = router;