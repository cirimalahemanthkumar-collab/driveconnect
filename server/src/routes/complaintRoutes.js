const express = require("express");

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  addComplaintMessage,
  updateComplaintByAdmin,
} = require("../controllers/complaintController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("CUSTOMER", "SCHOOL_OWNER"),
  createComplaint
);

router.get(
  "/my",
  protect,
  allowRoles("CUSTOMER", "SCHOOL_OWNER"),
  getMyComplaints
);

router.get(
  "/admin/all",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN", "SUPPORT_STAFF"),
  getAllComplaints
);

router.patch(
  "/admin/:complaintId",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN", "SUPPORT_STAFF"),
  updateComplaintByAdmin
);

router.post(
  "/:complaintId/messages",
  protect,
  addComplaintMessage
);

router.get(
  "/:complaintId",
  protect,
  getComplaintById
);

module.exports = router;