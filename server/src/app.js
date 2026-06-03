const express = require("express");
const cors = require("cors");
const reviewRoutes = require("./routes/reviewRoutes");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const partnerBookingRoutes = require("./routes/partnerBookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const partnerAssetsRoutes = require("./routes/partnerAssetsRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const payoutRoutes = require("./routes/payoutRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const documentRoutes = require("./routes/documentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DriveConnect backend is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server health is good",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/partner/courses", courseRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/customer/bookings", bookingRoutes);
app.use("/api/partner/bookings", partnerBookingRoutes);
app.use("/api/customer/payments", paymentRoutes);
app.use("/api/partner/assets", partnerAssetsRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/documents", documentRoutes);

module.exports = app;