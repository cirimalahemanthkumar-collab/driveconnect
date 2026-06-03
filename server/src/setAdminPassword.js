const bcrypt = require("bcrypt");
const pool = require("./db");

async function setAdminPassword() {
  try {
    const adminEmail = "admin@driveconnect.com";
    const newPassword = "Admin@12345";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1,
           role = 'SUPER_ADMIN',
           status = 'ACTIVE',
           email_verified = true,
           phone_verified = true,
           updated_at = NOW()
       WHERE email = $2
       RETURNING id, full_name, email, role, status`,
      [hashedPassword, adminEmail]
    );

    if (result.rows.length === 0) {
      console.log("Admin user not found");
    } else {
      console.log("Admin password updated successfully");
      console.log(result.rows[0]);
      console.log("Admin login email:", adminEmail);
      console.log("Admin login password:", newPassword);
    }
  } catch (error) {
    console.error("Failed to update admin password:", error.message);
  } finally {
    await pool.end();
  }
}

setAdminPassword();