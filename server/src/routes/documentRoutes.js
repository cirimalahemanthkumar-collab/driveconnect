const express = require("express");

const {
  uploadSchoolDocument,
  getMySchoolDocuments,
  getAdminSchoolDocuments,
  updateDocumentStatus,
} = require("../controllers/documentController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/partner/school",
  protect,
  allowRoles("SCHOOL_OWNER"),
  uploadSchoolDocument
);

router.get(
  "/partner/school",
  protect,
  allowRoles("SCHOOL_OWNER"),
  getMySchoolDocuments
);

router.get(
  "/admin/school",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN", "SUPPORT_STAFF"),
  getAdminSchoolDocuments
);

router.patch(
  "/admin/school/:documentId/status",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN", "SUPPORT_STAFF"),
  updateDocumentStatus
);

module.exports = router;