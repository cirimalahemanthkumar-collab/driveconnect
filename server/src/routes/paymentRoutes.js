const express = require("express");

const {
  createPaymentOrder,
  markTestPaymentSuccess,
  getMyPayments,
} = require("../controllers/paymentController");

const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/orders",
  protect,
  allowRoles("CUSTOMER"),
  createPaymentOrder
);

router.patch(
  "/orders/:paymentOrderId/test-success",
  protect,
  allowRoles("CUSTOMER"),
  markTestPaymentSuccess
);

router.get(
  "/",
  protect,
  allowRoles("CUSTOMER"),
  getMyPayments
);

module.exports = router;