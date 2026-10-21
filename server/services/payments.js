import crypto from "crypto";
import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient = null;

function stripe() {
  if (!stripeClient) stripeClient = new Stripe(env.payments.secretKey);
  return stripeClient;
}

/** Tests inject a fake Stripe client here instead of hitting the network. */
export function setStripeClientForTest(fake) {
  stripeClient = fake;
}

export function paymentMode() {
  return env.payments.mode;
}

export function mockTransactionId() {
  return `mock_${crypto.randomUUID()}`;
}

function appUrl() {
  // Redirects only ever go to our own configured front end, never to a URL
  // taken from the request (no open redirect).
  return (process.env.APP_URL || env.clientUrls[0]).replace(/\/$/, "");
}

/** Creates a Stripe Checkout Session (test mode) for a pending donation. */
export async function createCheckoutSession({ donation, campaign }) {
  const base = `${appUrl()}/campaigns/${campaign._id}`;
  return stripe().checkout.sessions.create({
    mode: "payment",
    submit_type: "donate",
    customer_email: donation.donorEmail || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: env.currency,
          unit_amount: donation.amount * 100,
          product_data: { name: `Donation to ${campaign.title}`, description: "Captain Funds demo (Stripe test mode)" },
        },
      },
    ],
    metadata: { donationId: String(donation._id), campaignId: String(campaign._id) },
    success_url: `${base}?donation=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}?donation=cancelled`,
  });
}

export async function retrieveCheckoutSession(sessionId) {
  return stripe().checkout.sessions.retrieve(sessionId);
}

export function constructWebhookEvent(rawBody, signature) {
  if (!env.payments.webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  return stripe().webhooks.constructEvent(rawBody, signature, env.payments.webhookSecret);
}
