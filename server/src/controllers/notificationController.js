const pool = require("../db");

const getMyNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      notifications: result.rows,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting notifications",
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating notification",
    });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false
       RETURNING *`,
      [req.user.id]
    );

    return res.json({
      success: true,
      message: "All notifications marked as read",
      updated_count: result.rows.length,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating notifications",
    });
  }
};

const sendNotificationByAdmin = async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "User ID, title, and message are required",
      });
    }

    const userCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const result = await pool.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, title, message, type || "GENERAL"]
    );

    return res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("Send notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while sending notification",
    });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  sendNotificationByAdmin,
};