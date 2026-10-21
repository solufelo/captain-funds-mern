import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_ACCOUNTS, startTestApp, stopTestApp, tokenFor } from "./helpers.js";
import Campaign from "../models/campaignmodel.js";
import Donation from "../models/donation-model.js";

let app, api, liveId;
before(async () => {
  ({ app, api } = await startTestApp());
  liveId = String((await Campaign.findOne({ title: /Harbourline/ }))._id);
});
after(stopTestApp);

describe("mock donations", () => {
  test("a guest can give; the gift is labelled as a test and the total moves", async () => {
    const before = await Campaign.findById(liveId);
    const res = await api()
      .post("/api/donations/checkout")
      .send({ campaignId: liveId, amount: 40, donorName: "Guest Tester", donorEmail: "guest@example.com", message: "hi" });
    assert.equal(res.status, 201);
    assert.equal(res.body.mode, "mock");
    assert.match(res.body.message, /no real money/i);
    assert.match(res.body.receipt.id, /^mock_/);
    assert.equal(res.body.campaign.EventCurrentAmount, before.EventCurrentAmount + 40);
    const after = await Campaign.findById(liveId);
    assert.equal(after.donationCount, before.donationCount + 1);
    const stored = await Donation.findOne({ donorEmail: "guest@example.com" });
    assert.equal(stored.paymentProvider, "mock");
    assert.equal(stored.paymentStatus, "completed");
  });

  test("amounts are validated as whole dollars within limits", async () => {
    for (const amount of [0, -5, 1.5, 20000, "abc", null]) {
      const res = await api().post("/api/donations/checkout").send({ campaignId: liveId, amount });
      assert.equal(res.status, 400, `amount ${amount}`);
    }
    const res = await api().post("/api/donations/checkout").send({ campaignId: liveId, amount: 5, donorEmail: "not-an-email" });
    assert.equal(res.status, 400);
  });

  test("cannot give to a pending, unknown or malformed campaign", async () => {
    const pending = await Campaign.findOne({ title: /Fernway/ });
    assert.equal((await api().post("/api/donations/checkout").send({ campaignId: String(pending._id), amount: 10 })).status, 409);
    assert.equal((await api().post("/api/donations/checkout").send({ campaignId: "0123456789abcdef01234567", amount: 10 })).status, 404);
    assert.equal((await api().post("/api/donations/checkout").send({ campaignId: "nope", amount: 10 })).status, 400);
  });

  test("anonymous gifts never show the donor's name publicly", async () => {
    await api()
      .post("/api/donations/checkout")
      .send({ campaignId: liveId, amount: 11, donorName: "Secret Person", isAnonymous: true });
    const detail = await api().get(`/api/campaigns/${liveId}`);
    const mine = detail.body.recentDonations.find((d) => d.amount === 11);
    assert.equal(mine.donorName, "Anonymous");
    assert.ok(!JSON.stringify(detail.body).includes("Secret Person"));
  });

  test("signed-in donors see their own history", async () => {
    const token = await tokenFor(app, DEMO_ACCOUNTS.organiser);
    // The seed already gives the demo organiser a few gifts of their own.
    const before = (await api().get("/api/donations/mine").set("Authorization", `Bearer ${token}`)).body.stats;
    assert.ok(before.totalDonations > 0, "seeded history");
    await api().post("/api/donations/checkout").set("Authorization", `Bearer ${token}`).send({ campaignId: liveId, amount: 25 });
    const res = await api().get("/api/donations/mine").set("Authorization", `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.stats.totalAmount, before.totalAmount + 25);
    assert.equal(res.body.stats.totalDonations, before.totalDonations + 1);
    assert.equal(res.body.donations[0].campaignTitle, "Harbourline Community Fridge");
    assert.equal((await api().get("/api/donations/mine")).status, 401);
  });
});
