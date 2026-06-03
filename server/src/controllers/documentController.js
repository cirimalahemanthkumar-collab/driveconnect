const pool = require("../db");

async function getSchoolByOwner(userId) {
  const result = await pool.query(
    `SELECT *
     FROM driving_schools
     WHERE owner_user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
}

const uploadSchoolDocument = async (req, res) => {
  try {
    const {
      document_type,
      document_number,
      document_url,
      file_name,
      file_type,
      file_size_bytes,
      expiry_date,
    } = req.body;

    if (!document_type || !document_url) {
      return res.status(400).json({
        success: false,
        message: "Document type and document URL are required",
      });
    }

    const school = await getSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const result = await pool.query(
      `INSERT INTO school_documents
       (
        school_id,
        document_type,
        document_number,
        document_url,
        file_name,
        file_type,
        file_size_bytes,
        status,
        expiry_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
       RETURNING *`,
      [
        school.id,
        document_type,
        document_number || null,
        document_url,
        file_name || null,
        file_type || null,
        file_size_bytes || null,
        expiry_date || null,
      ]
    );

    await pool.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       SELECT id, $1, $2, $3
       FROM users
       WHERE role IN ('ADMIN', 'SUPER_ADMIN')`,
      [
        "New School Document Uploaded",
        `${school.school_name} uploaded a new document: ${document_type}`,
        "DOCUMENT",
      ]
    );

    return res.status(201).json({
      success: true,
      message: "School document uploaded successfully",
      document: result.rows[0],
    });
  } catch (error) {
    console.error("Upload school document error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while uploading document",
    });
  }
};

const getMySchoolDocuments = async (req, res) => {
  try {
    const school = await getSchoolByOwner(req.user.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "Driving school not found",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM school_documents
       WHERE school_id = $1
       ORDER BY uploaded_at DESC`,
      [school.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      documents: result.rows,
    });
  } catch (error) {
    console.error("Get my school documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting documents",
    });
  }
};

const getAdminSchoolDocuments = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        sd.*,
        ds.school_name,
        ds.city,
        ds.status AS school_status,
        u.full_name AS owner_name,
        u.email AS owner_email,
        u.phone AS owner_phone
      FROM school_documents sd
      JOIN driving_schools ds ON sd.school_id = ds.id
      JOIN users u ON ds.owner_user_id = u.id
    `;

    const values = [];

    if (status) {
      query += ` WHERE sd.status = $1`;
      values.push(status);
    }

    query += ` ORDER BY sd.uploaded_at DESC`;

    const result = await pool.query(query, values);

    return res.json({
      success: true,
      count: result.rows.length,
      documents: result.rows,
    });
  } catch (error) {
    console.error("Get admin school documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting documents",
    });
  }
};

const updateDocumentStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { documentId } = req.params;
    const { status, rejection_reason } = req.body;

    const allowedStatuses = ["APPROVED", "REJECTED", "EXPIRED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document status",
      });
    }

    await client.query("BEGIN");

    const oldDocumentResult = await client.query(
      `SELECT
        sd.*,
        ds.owner_user_id,
        ds.school_name
       FROM school_documents sd
       JOIN driving_schools ds ON sd.school_id = ds.id
       WHERE sd.id = $1`,
      [documentId]
    );

    if (oldDocumentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const oldDocument = oldDocumentResult.rows[0];

    const updatedResult = await client.query(
      `UPDATE school_documents
       SET status = $1,
           rejection_reason = $2,
           reviewed_by_admin_id = $3,
           reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        status,
        status === "REJECTED" ? rejection_reason || "Rejected by admin" : null,
        req.user.id,
        documentId,
      ]
    );

    const updatedDocument = updatedResult.rows[0];

    await client.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        oldDocument.owner_user_id,
        "School Document Status Updated",
        `Your document "${oldDocument.document_type}" is now ${status}.`,
        "DOCUMENT",
      ]
    );

    await client.query(
      `INSERT INTO audit_logs
       (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        "UPDATE_SCHOOL_DOCUMENT_STATUS",
        "school_documents",
        documentId,
        oldDocument,
        updatedDocument,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: `Document status updated to ${status}`,
      document: updatedDocument,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update document status error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating document status",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  uploadSchoolDocument,
  getMySchoolDocuments,
  getAdminSchoolDocuments,
  updateDocumentStatus,
};