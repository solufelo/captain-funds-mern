import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import usersRoutes from "./routes/users-routes.js";
import campaignsRoutes from "./routes/campaigns-routes.js";
import donationsRoutes, { stripeWebhookHandler } from "./routes/donations-routes.js";
import adminCampaignsRoutes from "./routes/admin-campaigns-routes.js";
import adminRoutes from "./routes/admin-routes.js";
import uploadRoutes from "./routes/upload-routes.js";
import simulationRoutes from "./routes/simulation-routes.js";
import { emailConfigured } from "./services/emailService.js";
import { errorHandler, notFound } from "./middleware/errors.js";

/** Builds the Express app without listening, so tests can drive it directly. */
export function createApp({ demoAccounts = false } = {}) {
  const app = express();
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);

  app.use(cors({ origin: env.clientUrls }));
  app.use((_req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Stripe needs the raw body to verify webhook signatures.
  app.post("/api/donations/webhook", express.raw({ type: "application/json", limit: "1mb" }), stripeWebhookHandler);

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use("/api/users", usersRoutes);
  app.use("/api/campaigns", campaignsRoutes);
  app.use("/api/donations", donationsRoutes);
  app.use("/api/admin/campaigns", adminCampaignsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/simulation", simulationRoutes);

  // What the client needs to label things honestly (payment mode, demo logins).
  app.get("/api/config", (_req, res) => {
    res.json({
      success: true,
      payments: env.payments.mode,
      currency: env.currency,
      uploads: env.uploadsConfigured,
      demoAccounts,
    });
  });

  app.get("/api/health", (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.status(db === "connected" ? 200 : 503).json({
      status: db === "connected" ? "healthy" : "degraded",
      services: {
        database: db,
        payments: env.payments.mode,
        email: emailConfigured ? "configured" : "not configured",
        uploads: env.uploadsConfigured ? "configured" : "not configured",
      },
      uptime: Math.round(process.uptime()),
    });
  });

  app.get("/", (_req, res) => {
    res.json({ name: "Captain Funds API", docs: "See README.md", health: "/api/health" });
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
