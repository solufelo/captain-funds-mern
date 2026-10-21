import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { startTestApp, stopTestApp } from "./helpers.js";
import { setPaymentsForTest } from "../config/env.js";
import { setStripeClientForTest } from "../services/payments.js";
import Campaign from "../models/campaignmodel.js";
import Donation from "../models/donation-model.js";

// A stand-in for the Stripe SDK: records calls, no network.
const sessions = new Map();
const fakeStripe = {
  checkout: {
    sessions: {
      async create(params) {
        const id = `cs_test_fake${sessions.size + 1}`;
        const session = { id, url: `https://checkout.stripe.test/${id}`, payment_status: "unpaid", status: "open", params };
        sessions.set(id, session);
        return session;
      },
      async retrieve(id) {
        return sessions.get(id);
      },
    },
  },
  webhooks: {
    constructEvent(body, signature) {
      if (signature !== "valid") throw new Error("bad signature");
      return JSON.parse(body.toString());
    },
  },
};

let api, campaignId;
before(async () => {
  ({ api } = await startTestApp());
  setPaymentsForTest({ mode: "stripe", secretKey: "sk_test_fake", webhookSecret: "whsec_fake" });
  setStripeClientForTest(fakeStripe);
  campaignId = String((await Campaign.findOne({ title: /Lantern/ }))._id);
});
after(async () => {
  setPaymentsForTest({ mode: "mock" });
  setStripeClientForTest(null);
  await stopTestApp();
});

test("Stripe mode creates a pending donation and a test Checkout session", async () => {
  const before = await Campaign.findById(campaignId);
  const res = await api().post("/api/donations/checkout").send({ campaignId, amount: 30, donorEmail: "s@example.com" });
  assert.equal(res.status, 201);
  assert.equal(res.body.mode, "stripe");
  assert.match(res.body.checkoutUrl, /^https:\/\/checkout\.stripe\.test\//);
  const session = [...sessions.values()].at(-1);
  assert.equal(session.params.line_items[0].price_data.unit_amount, 3000);
  assert.equal(session.params.line_items[0].price_data.currency, "cad");
  assert.match(session.params.success_url, /^http:\/\/localhost:4150\/campaigns\//);
  const pending = await Donation.findOne({ stripeSessionId: session.id });
  assert.equal(pending.paymentStatus, "pending");
  assert.equal((await Campaign.findById(campaignId)).EventCurrentAmount, before.EventCurrentAmount);
});

test("verify completes a paid session exactly once", async () => {
  const before = await Campaign.findById(campaignId);
  const session = [...sessions.values()].at(-1);
  const unpaid = await api().get(`/api/donations/verify/${session.id}`);
  assert.equal(unpaid.body.status, "pending");

  session.payment_status = "paid";
  session.payment_intent = "pi_test_123";
  const first = await api().get(`/api/donations/verify/${session.id}`);
  const second = await api().get(`/api/donations/verify/${session.id}`);
  assert.equal(first.body.status, "completed");
  assert.equal(second.body.status, "completed");
  assert.equal((await Campaign.findById(campaignId)).EventCurrentAmount, before.EventCurrentAmount + 30);
  assert.equal((await api().get("/api/donations/verify/not-a-session")).status, 404);
});

test("webhook checks the signature and is idempotent with verify", async () => {
  const created = await api().post("/api/donations/checkout").send({ campaignId, amount: 12 });
  assert.equal(created.status, 201);
  const session = [...sessions.values()].at(-1);
  const donation = await Donation.findOne({ stripeSessionId: session.id });
  const event = JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { id: session.id, payment_status: "paid", metadata: { donationId: String(donation._id) } } },
  });

  const forged = await api().post("/api/donations/webhook").set("Content-Type", "application/json").set("stripe-signature", "forged").send(event);
  assert.equal(forged.status, 400);

  const before = await Campaign.findById(campaignId);
  for (let i = 0; i < 2; i++) {
    const ok = await api().post("/api/donations/webhook").set("Content-Type", "application/json").set("stripe-signature", "valid").send(event);
    assert.equal(ok.status, 200);
  }
  assert.equal((await Campaign.findById(campaignId)).EventCurrentAmount, before.EventCurrentAmount + 12);
});
