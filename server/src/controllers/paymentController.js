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
        COALESCE(po.id, b.id) AS id,
        po.id AS payment_id,
        po.id AS "paymentId",
        b.id AS booking_id,
        b.id AS "bookingId",
        ds.school_name,
        ds.school_name AS "schoolName",
        c.course_name,
        c.course_name AS "courseName",
        COALESCE(po.amount, b.total_amount, c.discount_price, c.price, 0) AS amount,
        COALESCE(c.advance_amount, 0) AS advance_amount,
        COALESCE(c.advance_amount, 0) AS "advanceAmount",
        COALESCE(po.status, CASE
          WHEN UPPER(b.booking_status::text) IN ('ACCEPTED', 'ONGOING', 'COMPLETED') THEN 'PENDING'
          ELSE 'UNPAID'
        END) AS payment_status,
        COALESCE(po.status, CASE
          WHEN UPPER(b.booking_status::text) IN ('ACCEPTED', 'ONGOING', 'COMPLETED') THEN 'PENDING'
          ELSE 'UNPAID'
        END) AS "paymentStatus",
        COALESCE(po.status, CASE
          WHEN UPPER(b.booking_status::text) IN ('ACCEPTED', 'ONGOING', 'COMPLETED') THEN 'PENDING'
          ELSE 'UNPAID'
        END) AS status,
        COALESCE(pt.payment_method, po.gateway_name) AS payment_method,
        COALESCE(pt.payment_method, po.gateway_name) AS "paymentMethod",
        COALESCE(pt.gateway_payment_id, po.gateway_order_id, b.id) AS transaction_reference,
        COALESCE(pt.gateway_payment_id, po.gateway_order_id, b.id) AS "transactionReference",
        COALESCE(po.created_at, b.created_at) AS created_at,
        COALESCE(po.created_at, b.created_at) AS "createdAt",
        b.booking_status,
        b.booking_status AS "bookingStatus"
       FROM bookings b
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON b.school_id = ds.id
       LEFT JOIN LATERAL (
        SELECT *
        FROM payment_orders payment_order
        WHERE payment_order.booking_id = b.id
        AND payment_order.customer_user_id = $1
        ORDER BY payment_order.created_at DESC
        LIMIT 1
       ) po ON true
       LEFT JOIN LATERAL (
        SELECT *
        FROM payment_transactions payment_transaction
        WHERE payment_transaction.payment_order_id = po.id
        ORDER BY payment_transaction.paid_at DESC NULLS LAST
        LIMIT 1
       ) pt ON true
       WHERE b.customer_user_id = $1
       ORDER BY COALESCE(po.created_at, b.created_at) DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      payments: result.rows,
    });
  } catch (error) {
    if (error.code === "42P01") {
      try {
        const fallback = await getBookingPaymentSummaries(req.user.id);

        return res.json({
          success: true,
          count: fallback.length,
          payments: fallback,
        });
      } catch (fallbackError) {
        console.error("Get fallback payment summaries error:", fallbackError);
      }
    }

    console.error("Get payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting payments",
    });
  }
};

async function getBookingPaymentSummaries(customerUserId) {
  const result = await pool.query(
    `SELECT
      b.id AS id,
      NULL::text AS payment_id,
      NULL::text AS "paymentId",
      b.id AS booking_id,
      b.id AS "bookingId",
      ds.school_name,
      ds.school_name AS "schoolName",
      c.course_name,
      c.course_name AS "courseName",
      COALESCE(b.total_amount, c.discount_price, c.price, 0) AS amount,
      COALESCE(c.advance_amount, 0) AS advance_amount,
      COALESCE(c.advance_amount, 0) AS "advanceAmount",
      CASE
        WHEN UPPER(b.booking_status::text) IN ('ACCEPTED', 'ONGOING', 'COMPLETED') THEN 'PENDING'
        ELSE 'UNPAID'
      END AS payment_status,
      CASE
        WHEN UPPER(b.booking_status::text) IN ('ACCEPTED', 'ONGOING', 'COMPLETED') THEN 'PENDING'
        ELSE 'UNPAID'
      END AS "paymentStatus",
      CASE
        WHEN UPPER(b.booking_status::text) IN ('ACCEPTED', 'ONGOING', 'COMPLETED') THEN 'PENDING'
        ELSE 'UNPAID'
      END AS status,
      NULL::text AS payment_method,
      NULL::text AS "paymentMethod",
      b.id AS transaction_reference,
      b.id AS "transactionReference",
      b.created_at,
      b.created_at AS "createdAt",
      b.booking_status,
      b.booking_status AS "bookingStatus"
     FROM bookings b
     JOIN courses c ON b.course_id = c.id
     JOIN driving_schools ds ON b.school_id = ds.id
     WHERE b.customer_user_id = $1
     ORDER BY b.created_at DESC`,
    [customerUserId]
  );

  return result.rows;
}

module.exports = {
  createPaymentOrder,
  markTestPaymentSuccess,
  getMyPayments,
};
