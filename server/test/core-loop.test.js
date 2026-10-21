import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_ACCOUNTS, startTestApp, stopTestApp, tokenFor, validCampaign } from "./helpers.js";
import Campaign from "../models/campaignmodel.js";
import Donation from "../models/donation-model.js";

let app, api;
before(async () => ({ app, api } = await startTestApp()));
after(stopTestApp);

// create campaign -> admin approves -> donations -> organiser totals -> admin analytics
test("the full fundraising loop keeps every total in agreement", async () => {
  const organiser = await tokenFor(app, DEMO_ACCOUNTS.organiser);
  const admin = await tokenFor(app, DEMO_ACCOUNTS.admin);
  const asOrganiser = ["Authorization", `Bearer ${organiser}`];
  const asAdmin = ["Authorization", `Bearer ${admin}`];

  const dashBefore = (await api().get("/api/campaigns/mine").set(...asOrganiser)).body;
  const analyticsBefore = (await api().get("/api/admin/analytics").set(...asAdmin)).body.analytics;

  // 1. Organiser creates a campaign: it is pending.
  const created = await api().post("/api/campaigns").set(...asOrganiser).send(validCampaign({ title: "Loop Test Fund" }));
  assert.equal(created.status, 201);
  const id = created.body.campaign._id;
  const queue = (await api().get("/api/admin/analytics").set(...asAdmin)).body.analytics.pending;
  assert.ok(queue.some((p) => String(p._id) === id), "new campaign should be in the admin review queue");

  // 2. Admin approves it.
  assert.equal((await api().patch(`/api/admin/campaigns/${id}/approve`).set(...asAdmin)).status, 200);

  // 3. A guest and a signed-in supporter donate (mock payments).
  assert.equal((await api().post("/api/donations/checkout").send({ campaignId: id, amount: 50 })).status, 201);
  const adminGift = await api().post("/api/donations/checkout").set(...asAdmin).send({ campaignId: id, amount: 25 });
  assert.equal(adminGift.body.campaign.EventCurrentAmount, 75);

  // 4. Organiser dashboard totals.
  const dash = (await api().get("/api/campaigns/mine").set(...asOrganiser)).body;
  assert.equal(dash.totals.raised, dashBefore.totals.raised + 75);
  assert.equal(dash.totals.donations, dashBefore.totals.donations + 2);
  const mineRow = dash.campaigns.find((c) => String(c._id) === id);
  assert.equal(mineRow.EventCurrentAmount, 75);
  assert.equal(dash.recentDonations[0].campaignTitle, "Loop Test Fund");
  assert.equal(dash.daily.at(-1).amount >= 75, true, "today's bucket should include the new gifts");

  // 5. Admin analytics.
  const analytics = (await api().get("/api/admin/analytics").set(...asAdmin)).body.analytics;
  assert.equal(analytics.totals.raised, analyticsBefore.totals.raised + 75);
  assert.equal(analytics.totals.donations, analyticsBefore.totals.donations + 2);
  const mock = analytics.bySource.find((s) => s.source === "mock");
  assert.equal(mock.raised, 75);
  // Gift-size bands partition the ledger: every dollar and gift lands in exactly one.
  assert.deepEqual(analytics.bySize.map((b) => b.min), [0, 25, 100, 250]);
  assert.equal(analytics.bySize.reduce((s, b) => s + b.raised, 0), analytics.totals.raised);
  assert.equal(analytics.bySize.reduce((s, b) => s + b.donations, 0), analytics.totals.donations);
  assert.ok(!analytics.pending.some((p) => String(p._id) === id));
  assert.equal(analytics.daily.length, 30);

  // Ledger and denormalised campaign counters agree.
  const ledger = await Donation.aggregate([
    { $match: { paymentStatus: "completed" } },
    { $group: { _id: null, raised: { $sum: "$amount" } } },
  ]);
  const counters = (await Campaign.find({})).reduce((s, c) => s + c.EventCurrentAmount, 0);
  assert.equal(ledger[0].raised, counters);
  assert.equal(analytics.totals.raised, counters);
});

test("analytics are admin-only", async () => {
  const organiser = await tokenFor(app, DEMO_ACCOUNTS.organiser);
  assert.equal((await api().get("/api/admin/analytics")).status, 401);
  assert.equal((await api().get("/api/admin/analytics").set("Authorization", `Bearer ${organiser}`)).status, 403);
});
