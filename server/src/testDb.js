const pool = require("./db");

async function testDbConnection() {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    console.log("Database connected successfully");
    console.log("Current database time:", result.rows[0].current_time);
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

testDbConnection();