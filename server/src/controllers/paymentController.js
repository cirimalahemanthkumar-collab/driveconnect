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
    const fallback = await getBookingPaymentSummaries(req.user.id);
    let realPayments = [];

    try {
      realPayments = await getRealCustomerPayments(req.user.id);
    } catch (paymentLookupError) {
      if (isConnectionError(paymentLookupError)) throw paymentLookupError;
      console.error("Customer real payment lookup failed, using booking summaries:", paymentLookupError.message);
    }

    const payments = realPayments.length ? realPayments : fallback;

    return res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    if (isConnectionError(error)) {
      console.error("Customer payments database connection error:", error);

      return res.status(500).json({
        success: false,
        message: "Database connection failed while getting payments",
      });
    }

    console.error("Get payments error:", error);

    return res.json({
      success: true,
      count: 0,
      payments: [],
    });
  }
};

async function getBookingPaymentSummaries(customerUserId) {
  const schema = await getPaymentSchema();

  if (
    !hasColumns(schema.bookings, ["id", "customer_user_id", "course_id", "school_id", "booking_status"]) ||
    !hasColumns(schema.courses, ["id", "course_name"]) ||
    !hasColumns(schema.driving_schools, ["id", "school_name"])
  ) {
    return [];
  }

  const schoolJoin = schema.courses.has("school_id")
    ? `COALESCE(b.${quoteIdent("school_id")}, c.${quoteIdent("school_id")}) = ds.${quoteIdent("id")}`
    : `b.${quoteIdent("school_id")} = ds.${quoteIdent("id")}`;

  const amountExpression = courseMoneyExpression(schema.courses, schema.bookings);
  const advanceExpression = schema.courses.has("advance_amount")
    ? `COALESCE(c.${quoteIdent("advance_amount")}, 0)`
    : "0";
  const createdAtExpression = schema.bookings.has("created_at")
    ? `b.${quoteIdent("created_at")}`
    : "NULL::timestamp";

  const result = await pool.query(
    `SELECT
      b.${quoteIdent("id")} AS id,
      NULL::text AS payment_id,
      NULL::text AS "paymentId",
      b.${quoteIdent("id")} AS booking_id,
      b.${quoteIdent("id")} AS "bookingId",
      ds.${quoteIdent("school_name")} AS school_name,
      ds.${quoteIdent("school_name")} AS "schoolName",
      c.${quoteIdent("course_name")} AS course_name,
      c.${quoteIdent("course_name")} AS "courseName",
      ${amountExpression} AS amount,
      ${advanceExpression} AS advance_amount,
      ${advanceExpression} AS "advanceAmount",
      CASE
        WHEN UPPER(b.${quoteIdent("booking_status")}::text) IN ('ACCEPTED', 'CONFIRMED', 'ONGOING', 'COMPLETED') THEN 'PENDING'
        ELSE 'UNPAID'
      END AS payment_status,
      CASE
        WHEN UPPER(b.${quoteIdent("booking_status")}::text) IN ('ACCEPTED', 'CONFIRMED', 'ONGOING', 'COMPLETED') THEN 'PENDING'
        ELSE 'UNPAID'
      END AS "paymentStatus",
      CASE
        WHEN UPPER(b.${quoteIdent("booking_status")}::text) IN ('ACCEPTED', 'CONFIRMED', 'ONGOING', 'COMPLETED') THEN 'PENDING'
        ELSE 'UNPAID'
      END AS status,
      NULL::text AS payment_method,
      NULL::text AS "paymentMethod",
      b.${quoteIdent("id")} AS transaction_reference,
      b.${quoteIdent("id")} AS "transactionReference",
      ${createdAtExpression} AS created_at,
      ${createdAtExpression} AS "createdAt",
      b.${quoteIdent("booking_status")} AS booking_status,
      b.${quoteIdent("booking_status")} AS "bookingStatus"
     FROM bookings b
     JOIN courses c ON b.${quoteIdent("course_id")} = c.${quoteIdent("id")}
     JOIN driving_schools ds ON ${schoolJoin}
     WHERE b.${quoteIdent("customer_user_id")} = $1
     ORDER BY ${createdAtExpression} DESC NULLS LAST`,
    [customerUserId]
  );

  return result.rows;
}

async function getRealCustomerPayments(customerUserId) {
  const schema = await getPaymentSchema();
  const source = findPaymentSource(schema);

  if (!source || !source.columns.has("booking_id")) {
    return [];
  }

  const sourceName = source.table;
  const sourceColumns = source.columns;

  if (
    !hasColumns(schema.bookings, ["id", "customer_user_id", "course_id", "school_id", "booking_status"]) ||
    !hasColumns(schema.courses, ["id", "course_name"]) ||
    !hasColumns(schema.driving_schools, ["id", "school_name"])
  ) {
    return [];
  }

  const schoolJoin = schema.courses.has("school_id")
    ? `COALESCE(b.${quoteIdent("school_id")}, c.${quoteIdent("school_id")}) = ds.${quoteIdent("id")}`
    : `b.${quoteIdent("school_id")} = ds.${quoteIdent("id")}`;

  const transactionJoin = buildTransactionJoin(schema.payment_transactions, sourceColumns);
  const paymentIdExpression = sourceColumns.has("id")
    ? `p.${quoteIdent("id")}`
    : `p.${quoteIdent("booking_id")}`;
  const paymentAmountExpression = sourceColumns.has("amount")
    ? `COALESCE(p.${quoteIdent("amount")}, ${courseMoneyExpression(schema.courses, schema.bookings)})`
    : courseMoneyExpression(schema.courses, schema.bookings);
  const statusExpression = firstExistingColumn(sourceColumns, ["status", "payment_status"])
    ? `COALESCE(p.${quoteIdent(firstExistingColumn(sourceColumns, ["status", "payment_status"]))}::text, 'PENDING')`
    : "'PENDING'";
  const paymentMethodExpression = firstExistingColumn(sourceColumns, ["payment_method", "method", "gateway_name", "provider"])
    ? `p.${quoteIdent(firstExistingColumn(sourceColumns, ["payment_method", "method", "gateway_name", "provider"]))}::text`
    : "NULL::text";
  const referenceExpression = firstExistingColumn(sourceColumns, ["transaction_reference", "gateway_payment_id", "provider_payment_id", "gateway_order_id", "provider_order_id", "reference"])
    ? `p.${quoteIdent(firstExistingColumn(sourceColumns, ["transaction_reference", "gateway_payment_id", "provider_payment_id", "gateway_order_id", "provider_order_id", "reference"]))}::text`
    : `${paymentIdExpression}::text`;
  const paymentCreatedExpression = firstExistingColumn(sourceColumns, ["created_at", "createdAt", "paid_at", "paidAt", "updated_at", "updatedAt"])
    ? `p.${quoteIdent(firstExistingColumn(sourceColumns, ["created_at", "createdAt", "paid_at", "paidAt", "updated_at", "updatedAt"]))}`
    : "NULL::timestamp";
  const createdAtExpression = schema.bookings.has("created_at")
    ? `COALESCE(${paymentCreatedExpression}, b.${quoteIdent("created_at")})`
    : paymentCreatedExpression;
  const advanceExpression = schema.courses.has("advance_amount")
    ? `COALESCE(c.${quoteIdent("advance_amount")}, 0)`
    : "0";
  const customerFilter = sourceColumns.has("customer_user_id")
    ? `AND p.${quoteIdent("customer_user_id")} = $1`
    : "";

  const result = await pool.query(
    `SELECT
      ${paymentIdExpression} AS id,
      ${paymentIdExpression} AS payment_id,
      ${paymentIdExpression} AS "paymentId",
      b.${quoteIdent("id")} AS booking_id,
      b.${quoteIdent("id")} AS "bookingId",
      ds.${quoteIdent("school_name")} AS school_name,
      ds.${quoteIdent("school_name")} AS "schoolName",
      c.${quoteIdent("course_name")} AS course_name,
      c.${quoteIdent("course_name")} AS "courseName",
      ${paymentAmountExpression} AS amount,
      ${advanceExpression} AS advance_amount,
      ${advanceExpression} AS "advanceAmount",
      ${statusExpression} AS payment_status,
      ${statusExpression} AS "paymentStatus",
      ${statusExpression} AS status,
      COALESCE(tx.payment_method, ${paymentMethodExpression}) AS payment_method,
      COALESCE(tx.payment_method, ${paymentMethodExpression}) AS "paymentMethod",
      COALESCE(tx.transaction_reference, ${referenceExpression}) AS transaction_reference,
      COALESCE(tx.transaction_reference, ${referenceExpression}) AS "transactionReference",
      ${createdAtExpression} AS created_at,
      ${createdAtExpression} AS "createdAt",
      b.${quoteIdent("booking_status")} AS booking_status,
      b.${quoteIdent("booking_status")} AS "bookingStatus"
     FROM ${quoteIdent(sourceName)} p
     JOIN bookings b ON p.${quoteIdent("booking_id")} = b.${quoteIdent("id")}
     JOIN courses c ON b.${quoteIdent("course_id")} = c.${quoteIdent("id")}
     JOIN driving_schools ds ON ${schoolJoin}
     ${transactionJoin}
     WHERE b.${quoteIdent("customer_user_id")} = $1
     ${customerFilter}
     ORDER BY ${createdAtExpression} DESC NULLS LAST`,
    [customerUserId]
  );

  return result.rows;
}

async function getPaymentSchema() {
  const result = await pool.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
     AND table_name = ANY($1::text[])`,
    [[
      "bookings",
      "courses",
      "driving_schools",
      "payment_orders",
      "payments",
      "payment_transactions",
    ]]
  );

  return result.rows.reduce((schema, row) => {
    if (!schema[row.table_name]) schema[row.table_name] = new Set();
    schema[row.table_name].add(row.column_name);
    return schema;
  }, {
    bookings: new Set(),
    courses: new Set(),
    driving_schools: new Set(),
    payment_orders: new Set(),
    payments: new Set(),
    payment_transactions: new Set(),
  });
}

function findPaymentSource(schema) {
  if (schema.payment_orders.size) {
    return { table: "payment_orders", columns: schema.payment_orders };
  }

  if (schema.payments.size) {
    return { table: "payments", columns: schema.payments };
  }

  return null;
}

function buildTransactionJoin(transactionColumns, sourceColumns) {
  if (!transactionColumns.size || !transactionColumns.has("payment_order_id") || !sourceColumns.has("id")) {
    return "LEFT JOIN LATERAL (SELECT NULL::text AS payment_method, NULL::text AS transaction_reference) tx ON true";
  }

  const methodColumn = firstExistingColumn(transactionColumns, ["payment_method", "method"]);
  const referenceColumn = firstExistingColumn(transactionColumns, ["gateway_payment_id", "provider_payment_id", "transaction_reference", "reference"]);
  const paidAtColumn = firstExistingColumn(transactionColumns, ["paid_at", "created_at", "updated_at"]);

  const methodExpression = methodColumn ? `payment_transaction.${quoteIdent(methodColumn)}::text` : "NULL::text";
  const referenceExpression = referenceColumn ? `payment_transaction.${quoteIdent(referenceColumn)}::text` : "NULL::text";
  const orderExpression = paidAtColumn ? `payment_transaction.${quoteIdent(paidAtColumn)} DESC NULLS LAST` : `payment_transaction.${quoteIdent("payment_order_id")}`;

  return `LEFT JOIN LATERAL (
      SELECT
        ${methodExpression} AS payment_method,
        ${referenceExpression} AS transaction_reference
      FROM payment_transactions payment_transaction
      WHERE payment_transaction.${quoteIdent("payment_order_id")} = p.${quoteIdent("id")}
      ORDER BY ${orderExpression}
      LIMIT 1
    ) tx ON true`;
}

function courseMoneyExpression(courseColumns, bookingColumns) {
  if (courseColumns.has("price")) return `COALESCE(c.${quoteIdent("price")}, 0)`;
  if (courseColumns.has("discount_price")) return `COALESCE(c.${quoteIdent("discount_price")}, 0)`;
  if (bookingColumns.has("total_amount")) return `COALESCE(b.${quoteIdent("total_amount")}, 0)`;
  return "0";
}

function hasColumns(columns, requiredColumns) {
  return requiredColumns.every((column) => columns.has(column));
}

function firstExistingColumn(columns, names) {
  return names.find((name) => columns.has(name)) || "";
}

function quoteIdent(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function isConnectionError(error) {
  return [
    "08000",
    "08003",
    "08006",
    "08001",
    "08004",
    "57P01",
    "57P02",
    "57P03",
  ].includes(error?.code);
}

module.exports = {
  createPaymentOrder,
  markTestPaymentSuccess,
  getMyPayments,
};
