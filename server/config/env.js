import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const isProduction = process.env.NODE_ENV === "production";

function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (isProduction) {
    throw new Error("JWT_SECRET must be set (16+ characters) in production.");
  }
  // Dev/test only: a per-process random secret. Tokens stop working on restart,
  // which is fine locally and impossible to forget to rotate.
  console.warn("[env] JWT_SECRET not set; using a random development secret.");
  return crypto.randomBytes(32).toString("hex");
}

export function resolvePayments(key = process.env.STRIPE_SECRET_KEY || "") {
  if (!key) return { mode: "mock" };
  if (!key.startsWith("sk_test_")) {
    // This project is a portfolio demo: it never touches real money.
    throw new Error("STRIPE_SECRET_KEY must be a Stripe TEST key (sk_test_...). Live keys are refused.");
  }
  return { mode: "stripe", secretKey: key, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "" };
}

export const env = {
  isProduction,
  isTest: process.env.NODE_ENV === "test",
  port: Number(process.env.PORT) || 4100,
  mongoUrl: process.env.MONGODB_URL || process.env.MONGODB_URI || "",
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  clientUrls: (process.env.CLIENT_URL || "http://localhost:4150,http://localhost:4173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  payments: resolvePayments(),
  currency: (process.env.CURRENCY || "cad").toLowerCase(),
  enableSimulation: process.env.ENABLE_SIMULATION === "true",
  uploadsConfigured: Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
  ),
};

// Lets tests swap payment mode without re-importing the module.
export function setPaymentsForTest(payments) {
  env.payments = payments;
}
