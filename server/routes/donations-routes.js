import express from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { z } from "zod";
import Campaign, { acceptsDonations } from "../models/campaignmodel.js";
import Donation, { toPublicDonation } from "../models/donation-model.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validate, wholeDollars, optionalText } from "../middleware/validate.js";
import { completeDonation, failDonation } from "../services/donation-ledger.js";
import {
  constructWebhookEvent,
  createCheckoutSession,
  mockTransactionId,
  paymentMode,
  retrieveCheckoutSession,
} from "../services/payments.js";
import { env } from "../config/env.js";

const router = express.Router();

const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: env.isTest ? 1000 : 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many donation attempts. Wait a few minutes and try again." },
});

const checkoutSchema = z.object({
  campaignId: z.string().refine((v) => mongoose.isValidObjectId(v), "Campaign not found."),
  amount: wholeDollars(1, 10_000, "Donation"),
  donorName: z.string().trim().max(80).optional().default(""),
  donorEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address.")
    .optional()
    .default(""),
  message: optionalText(280),
  isAnonymous: z.boolean().optional().default(false),
});

function receipt(donation, campaign) {
  return {
    id: donation.transactionId || String(donation._id),
    amount: donation.amount,
    currency: donation.currency,
    campaignId: String(campaign._id),
    campaignTitle: campaign.title,
    createdAt: donation.completedAt || donation.createdAt,
    mode: donation.paymentProvider,
  };
}

// POST /api/donations/checkout
// Mock mode: records a clearly labelled test donation immediately.
// Stripe mode: creates a pending donation + a Stripe Checkout (test) session.
router.post("/checkout", checkoutLimiter, optionalAuth, validate(checkoutSchema), async (req, res) => {
  const { campaignId, amount, donorName, donorEmail, message, isAnonymous } = req.body;
  const campaign = await Campaign.findById(campaignId);
  if (!campaign || campaign.isDeleted) {
    return res.status(404).json({ success: false, message: "Campaign not found." });
  }
  if (!acceptsDonations(campaign)) {
    return res.status(409).json({ success: false, message: "This campaign is not accepting donations right now." });
  }

  const name = donorName || req.user?.name || "Guest supporter";
  const donation = await Donation.create({
    campaign: campaign._id,
    campaignTitle: campaign.title,
    donor: req.user?._id,
    donorName: name.slice(0, 80),
    donorEmail: donorEmail || req.user?.email || undefined,
    amount,
    currency: env.currency,
    message,
    isAnonymous,
    paymentProvider: paymentMode() === "stripe" ? "stripe" : "mock",
    paymentStatus: "pending",
    transactionId: paymentMode() === "stripe" ? undefined : mockTransactionId(),
  });

  if (paymentMode() === "stripe") {
    try {
      const session = await createCheckoutSession({ donation, campaign });
      donation.stripeSessionId = session.id;
      await donation.save();
      return res.status(201).json({ success: true, mode: "stripe", checkoutUrl: session.url });
    } catch (err) {
      await failDonation(donation._id);
      console.error("[stripe] checkout session failed:", err.message);
      return res.status(502).json({ success: false, message: "Could not reach the payment provider. Please try again." });
    }
  }

  const { donation: done, campaign: updated } = await completeDonation(donation._id);
  res.status(201).json({
    success: true,
    mode: "mock",
    message: "Test donation recorded. No real money moved.",
    donation: toPublicDonation(done),
    receipt: receipt(done, updated),
    campaign: { _id: updated._id, EventCurrentAmount: updated.EventCurrentAmount, donationCount: updated.donationCount },
  });
});

// GET /api/donations/verify/:sessionId
// Called by the campaign page after Stripe redirects back. Works without a
// webhook tunnel in local dev; idempotent with the webhook.
router.get("/verify/:sessionId", async (req, res) => {
  if (paymentMode() !== "stripe") {
    return res.status(404).json({ success: false, message: "Stripe is not enabled." });
  }
  const sessionId = String(req.params.sessionId);
  if (!/^cs_test_[A-Za-z0-9_]+$/.test(sessionId)) {
    return res.status(404).json({ success: false, message: "Payment session not found." });
  }
  const donation = await Donation.findOne({ stripeSessionId: sessionId });
  if (!donation) return res.status(404).json({ success: false, message: "Payment session not found." });

  let current = donation;
  if (donation.paymentStatus === "pending") {
    const session = await retrieveCheckoutSession(sessionId);
    if (session.payment_status === "paid") {
      current = (await completeDonation(donation._id, { transactionId: session.payment_intent || session.id })).donation;
    } else if (session.status === "expired") {
      current = (await failDonation(donation._id)) || donation;
    }
  }
  const campaign = await Campaign.findById(current.campaign);
  res.json({
    success: true,
    status: current.paymentStatus,
    donation: toPublicDonation(current),
    receipt: campaign ? receipt(current, campaign) : null,
  });
});

// GET /api/donations/mine — the signed-in user's own giving history.
router.get("/mine", requireAuth, async (req, res) => {
  const donations = await Donation.find({ donor: req.user._id, paymentStatus: { $ne: "pending" } })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  const completed = donations.filter((d) => d.paymentStatus === "completed");
  const total = completed.reduce((s, d) => s + d.amount, 0);
  res.json({
    success: true,
    donations: donations.map((d) => ({
      _id: d._id,
      campaignId: d.campaign,
      campaignTitle: d.campaignTitle,
      amount: d.amount,
      currency: d.currency,
      message: d.message,
      isAnonymous: d.isAnonymous,
      paymentStatus: d.paymentStatus,
      paymentProvider: d.paymentProvider,
      transactionId: d.transactionId,
      createdAt: d.completedAt || d.createdAt,
    })),
    stats: {
      totalDonations: completed.length,
      totalAmount: total,
      averageDonation: completed.length ? Math.round(total / completed.length) : 0,
      campaignsSupported: new Set(completed.map((d) => String(d.campaign))).size,
    },
  });
});

export default router;

// Mounted separately in app.js with express.raw(), before express.json().
export async function stripeWebhookHandler(req, res) {
  if (paymentMode() !== "stripe") return res.status(404).end();
  let event;
  try {
    event = constructWebhookEvent(req.body, req.headers["stripe-signature"]);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook signature check failed: ${err.message}` });
  }
  const session = event.data?.object;
  const donationId = session?.metadata?.donationId;
  if (donationId && mongoose.isValidObjectId(donationId)) {
    if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
      await completeDonation(donationId, { transactionId: session.payment_intent || session.id });
    } else if (event.type === "checkout.session.expired") {
      await failDonation(donationId);
    }
  }
  res.json({ received: true });
}
