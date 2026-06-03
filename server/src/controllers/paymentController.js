const pool = require("../db");

const createPaymentOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT 
        b.*,
        ds.owner_user_id,
        ds.school_name
       FROM bookings b
       JOIN driving_schools ds ON b.school_id = ds.id
       WHERE b.id = $1 AND b.customer_user_id = $2`,
      [booking_id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.booking_status !== "ACCEPTED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Payment can be created only for ACCEPTED bookings",
      });
    }

    const existingSuccessPayment = await client.query(
      `SELECT id
       FROM payment_orders
       WHERE booking_id = $1 AND status = 'SUCCESS'`,
      [booking_id]
    );

    if (existingSuccessPayment.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Payment already completed for this booking",
      });
    }

    const gatewayOrderId = `TEST_ORDER_${Date.now()}`;

    const orderResult = await client.query(
      `INSERT INTO payment_orders
       (
        booking_id,
        customer_user_id,
        gateway_name,
        gateway_order_id,
        amount,
        currency,
        status
       )
       VALUES ($1, $2, $3, $4, $5, 'INR', 'PENDING')
       RETURNING *`,
      [
        booking.id,
        req.user.id,
        "TEST_GATEWAY",
        gatewayOrderId,
        booking.total_amount,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      payment_order: orderResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating payment order",
    });
  } finally {
    client.release();
  }
};

const markTestPaymentSuccess = async (req, res) => {
  const client = await pool.connect();

  try {
    const { paymentOrderId } = req.params;
    const { payment_method } = req.body;

    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT 
        po.*,
        b.booking_status,
        b.school_id,
        b.platform_commission_amount,
        b.school_earning_amount,
        ds.owner_user_id,
        ds.school_name
       FROM payment_orders po
       JOIN bookings b ON po.booking_id = b.id
       JOIN driving_schools ds ON b.school_id = ds.id
       WHERE po.id = $1 AND po.customer_user_id = $2`,
      [paymentOrderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    const order = orderResult.rows[0];

    if (order.status === "SUCCESS") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Payment already marked as success",
      });
    }

    const gatewayPaymentId = `TEST_PAYMENT_${Date.now()}`;

    const transactionResult = await client.query(
      `INSERT INTO payment_transactions
       (
        payment_order_id,
        booking_id,
        gateway_payment_id,
        amount,
        currency,
        status,
        payment_method,
        gateway_response,
        paid_at
       )
       VALUES ($1, $2, $3, $4, 'INR', 'SUCCESS', $5, $6, NOW())
       RETURNING *`,
      [
        order.id,
        order.booking_id,
        gatewayPaymentId,
        order.amount,
        payment_method || "UPI",
        {
          mode: "test",
          message: "Test payment marked successful from local backend",
        },
      ]
    );

    const updatedOrderResult = await client.query(
      `UPDATE payment_orders
       SET status = 'SUCCESS',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [order.id]
    );

    const oldBookingStatus = order.booking_status;

    const updatedBookingResult = await client.query(
      `UPDATE bookings
       SET booking_status = 'ONGOING',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [order.booking_id]
    );

    await client.query(
      `INSERT INTO booking_status_history
       (booking_id, old_status, new_status, changed_by_user_id, reason)
       VALUES ($1, $2, 'ONGOING', $3, $4)`,
      [
        order.booking_id,
        oldBookingStatus,
        req.user.id,
        "Payment completed successfully",
      ]
    );

    await client.query(
      `INSERT INTO school_payouts
       (
        school_id,
        booking_id,
        gross_amount,
        commission_amount,
        payout_amount,
        status
       )
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [
        order.school_id,
        order.booking_id,
        order.amount,
        order.platform_commission_amount,
        order.school_earning_amount,
      ]
    );

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        order.owner_user_id,
        "Payment Received",
        `Payment received for booking at ${order.school_name}.`,
        "PAYMENT",
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Test payment marked as successful",
      payment_order: updatedOrderResult.rows[0],
      transaction: transactionResult.rows[0],
      booking: updatedBookingResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Mark test payment success error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while marking payment success",
    });
  } finally {
    client.release();
  }
};

const getMyPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        po.*,
        b.booking_status,
        c.course_name,
        ds.school_name
       FROM payment_orders po
       JOIN bookings b ON po.booking_id = b.id
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON b.school_id = ds.id
       WHERE po.customer_user_id = $1
       ORDER BY po.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      payments: result.rows,
    });
  } catch (error) {
    console.error("Get payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting payments",
    });
  }
};

module.exports = {
  createPaymentOrder,
  markTestPaymentSuccess,
  getMyPayments,
};