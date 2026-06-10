const pool = require("../db");
const {
  createNotification,
  getAccessibleNotifications,
  markAllNotificationsRead: markAllAccessibleNotificationsRead,
  markNotificationRead: markAccessibleNotificationRead,
} = require("../utils/notifications");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await getAccessibleNotifications(req.user);

    return res.json({
      success: true,
      count: notifications.length,
      unread_count: notifications.filter((notification) => !notification.is_read).length,
      notifications,
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
    const notificationId = req.params.notificationId || req.params.id;
    const notification = await markAccessibleNotificationRead(notificationId, req.user);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
      notification,
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
    const updatedCount = await markAllAccessibleNotificationsRead(req.user);

    return res.json({
      success: true,
      message: "All notifications marked as read",
      updated_count: updatedCount,
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
    const { user_id, recipient_role, role, title, message, body, type, entity_type, entity_id, data } = req.body;
    const finalMessage = message || body;
    const finalRole = recipient_role || (role && role !== "ALL" ? role : null);

    if (!title || !finalMessage || (!user_id && !finalRole && role !== "ALL")) {
      return res.status(400).json({
        success: false,
        message: "Title, message, and audience are required",
      });
    }

    if (user_id) {
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
    }

    const notifications = [];

    if (role === "ALL") {
      for (const audienceRole of ["CUSTOMER", "SCHOOL_OWNER", "PARTNER", "ADMIN"]) {
        const notification = await createNotification({
          recipientRole: audienceRole,
          title,
          message: finalMessage,
          type: type || "ADMIN_ACTION",
          entityType: entity_type || null,
          entityId: entity_id || null,
          data: data || {},
        });
        if (notification) notifications.push(notification);
      }
    } else {
      const notification = await createNotification({
        userId: user_id || null,
        recipientRole: finalRole,
        title,
        message: finalMessage,
        type: type || "ADMIN_ACTION",
        entityType: entity_type || null,
        entityId: entity_id || null,
        data: data || {},
      });
      if (notification) notifications.push(notification);
    }

    return res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      notification: notifications[0] || null,
      notifications,
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
