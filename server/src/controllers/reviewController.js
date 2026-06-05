const pool = require("../db");

async function updateSchoolRating(client, schoolId) {
  const ratingResult = await client.query(
    `SELECT
      COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating,
      COUNT(*)::int AS total_reviews
     FROM reviews
     WHERE school_id = $1
     AND is_visible = true`,
    [schoolId]
  );

  const { average_rating, total_reviews } = ratingResult.rows[0];

  await client.query(
    `UPDATE driving_schools
     SET average_rating = $1,
         total_reviews = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [average_rating, total_reviews, schoolId]
  );
}

const createOrUpdateReview = async (req, res) => {
  const client = await pool.connect();

  try {
    const { booking_id, rating, comment } = req.body;

    if (!booking_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT
        b.*,
        c.course_name,
        ds.school_name
       FROM bookings b
       JOIN courses c ON b.course_id = c.id
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

    if (booking.booking_status !== "COMPLETED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Review can be submitted only after booking is completed",
      });
    }

    const reviewResult = await client.query(
      `INSERT INTO reviews
       (
        booking_id,
        customer_user_id,
        school_id,
        rating,
        comment,
        is_visible
       )
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (booking_id)
       DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        is_visible = true
       RETURNING *`,
      [
        booking.id,
        req.user.id,
        booking.school_id,
        rating,
        comment || null,
      ]
    );

    await updateSchoolRating(client, booking.school_id);

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Review saved successfully",
      review: reviewResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create/update review error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while saving review",
    });
  } finally {
    client.release();
  }
};

const getMyReviews = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        r.id,
        r.id AS review_id,
        r.id AS "reviewId",
        r.booking_id,
        r.booking_id AS "bookingId",
        r.school_id,
        r.customer_user_id,
        r.rating,
        r.comment,
        r.created_at,
        r.created_at AS "createdAt",
        ds.school_name,
        ds.school_name AS "schoolName",
        c.course_name,
        c.course_name AS "courseName"
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN courses c ON b.course_id = c.id
       JOIN driving_schools ds ON r.school_id = ds.id
       WHERE r.customer_user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      reviews: result.rows,
    });
  } catch (error) {
    console.error("Get my reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting reviews",
    });
  }
};

const getSchoolReviews = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const result = await pool.query(
      `SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS customer_name,
        c.course_name
       FROM reviews r
       JOIN users u ON r.customer_user_id = u.id
       JOIN bookings b ON r.booking_id = b.id
       JOIN courses c ON b.course_id = c.id
       WHERE r.school_id = $1
       AND r.is_visible = true
       ORDER BY r.created_at DESC`,
      [schoolId]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      reviews: result.rows,
    });
  } catch (error) {
    console.error("Get school reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting school reviews",
    });
  }
};

module.exports = {
  createOrUpdateReview,
  getMyReviews,
  getSchoolReviews,
};
