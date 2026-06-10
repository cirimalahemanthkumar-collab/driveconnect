const express = require("express");

const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  sendNotificationByAdmin,
} = require("../controllers/notificationController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.get("/my", protect, getMyNotifications);

router.patch(
  "/:notificationId/read",
  protect,
  markNotificationRead
);

router.patch(
  "/read-all",
  protect,
  markAllNotificationsRead
);

router.post(
  "/admin/send",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN", "SUPPORT_STAFF"),
  sendNotificationByAdmin
);

module.exports = router;
