const pool = require("../db");

const adminRoles = ["ADMIN", "SUPER_ADMIN", "SUPPORT_STAFF", "ACCOUNTANT"];

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

function notificationValues(input) {
  return {
    userId: input.userId || null,
    recipientRole: input.recipientRole ? normalizeRole(input.recipientRole) : null,
    title: String(input.title || "").trim(),
    message: String(input.message || "").trim(),
    type: String(input.type || "GENERAL").trim().toUpperCase(),
    entityType: input.entityType || null,
    entityId: input.entityId || null,
    data: input.data && typeof input.data === "object" ? input.data : {},
  };
}

async function createNotification(input, client = pool) {
  const values = notificationValues(input);

  if (!values.title || !values.message || (!values.userId && !values.recipientRole)) {
    return null;
  }

  const result = await client.query(
    `INSERT INTO notifications
     (user_id, recipient_role, title, message, type, entity_type, entity_id, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     RETURNING
      id,
      user_id,
      recipient_role,
      title,
      message,
      type,
      entity_type,
      entity_id,
      data,
      is_read,
      created_at,
      read_at`,
    [
      values.userId,
      values.recipientRole,
      values.title,
      values.message,
      values.type,
      values.entityType,
      values.entityId,
      JSON.stringify(values.data),
    ]
  );

  return result.rows[0];
}

function notifyUser(userId, input, client = pool) {
  return createNotification({ ...input, userId }, client);
}

function notifyAdmins(input, client = pool) {
  return createNotification({ ...input, recipientRole: "ADMIN" }, client);
}

function accessibleRolesFor(role) {
  const normalized = normalizeRole(role);
  if (adminRoles.includes(normalized)) return adminRoles;
  return [normalized];
}

async function getAccessibleNotifications(user, client = pool) {
  const roles = accessibleRolesFor(user.role);
  const result = await client.query(
    `SELECT
      id,
      user_id,
      recipient_role,
      title,
      message,
      type,
      entity_type,
      entity_id,
      data,
      is_read,
      created_at,
      read_at
     FROM notifications
     WHERE user_id = $1
        OR recipient_role = ANY($2::text[])
     ORDER BY created_at DESC`,
    [user.id, roles]
  );

  return result.rows;
}

async function markNotificationRead(notificationId, user, client = pool) {
  const roles = accessibleRolesFor(user.role);
  const result = await client.query(
    `UPDATE notifications
     SET is_read = true,
         read_at = COALESCE(read_at, NOW())
     WHERE id = $1
       AND (user_id = $2 OR recipient_role = ANY($3::text[]))
     RETURNING *`,
    [notificationId, user.id, roles]
  );

  return result.rows[0] || null;
}

async function markAllNotificationsRead(user, client = pool) {
  const roles = accessibleRolesFor(user.role);
  const result = await client.query(
    `UPDATE notifications
     SET is_read = true,
         read_at = COALESCE(read_at, NOW())
     WHERE is_read = false
       AND (user_id = $1 OR recipient_role = ANY($2::text[]))
     RETURNING id`,
    [user.id, roles]
  );

  return result.rows.length;
}

module.exports = {
  createNotification,
  notifyAdmins,
  notifyUser,
  getAccessibleNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
