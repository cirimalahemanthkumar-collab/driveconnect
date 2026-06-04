import "dotenv/config";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { adminRouter } from "./routes/admin.js";
import { apiRouter } from "./routes/api.js";
import { authRouter } from "./routes/auth.js";
import { bookingsRouter } from "./routes/bookings.js";
import { complaintsRouter } from "./routes/complaints.js";
import { coursesRouter } from "./routes/courses.js";
import { customersRouter } from "./routes/customers.js";
import { instructorsRouter } from "./routes/instructors.js";
import { paymentsRouter, razorpayWebhookHandler } from "./routes/payments.js";
import { reviewsRouter } from "./routes/reviews.js";
import { schoolsRouter } from "./routes/schools.js";
import { vehiclesRouter } from "./routes/vehicles.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { swaggerSpec } from "./swagger.js";
import { assertSafeProductionRuntime, getAllowedWebOrigins } from "./config.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = getAllowedWebOrigins();

assertSafeProductionRuntime();
app.disable("x-powered-by");
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true
}));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");

  if ((process.env.APP_ENV ?? process.env.NODE_ENV) === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
});
app.post("/payments/razorpay/webhook", express.raw({ type: "application/json" }), razorpayWebhookHandler);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "driveconnect-api" });
});

app.use("/api", apiRouter);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/auth", authRouter);
app.use("/customers", customersRouter);
app.use("/schools", schoolsRouter);
app.use(coursesRouter);
app.use(instructorsRouter);
app.use(vehiclesRouter);
app.use(bookingsRouter);
app.use(paymentsRouter);
app.use(reviewsRouter);
app.use(complaintsRouter);
app.use(adminRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`DriveConnect API running on http://localhost:${port}`);
  console.log(`Swagger docs available on http://localhost:${port}/docs`);
});
