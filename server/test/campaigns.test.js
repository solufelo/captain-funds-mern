import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_ACCOUNTS, inDays, startTestApp, stopTestApp, tokenFor, validCampaign } from "./helpers.js";
import Campaign, { PUBLIC_FILTER } from "../models/campaignmodel.js";

let app, api, organiser, admin;
before(async () => {
  ({ app, api } = await startTestApp());
  organiser = await tokenFor(app, DEMO_ACCOUNTS.organiser);
  admin = await tokenFor(app, DEMO_ACCOUNTS.admin);
});
after(stopTestApp);

const auth = (t) => ["Authorization", `Bearer ${t}`];

describe("public campaigns", () => {
  test("browse lists only approved campaigns", async () => {
    const res = await api().get("/api/campaigns");
    assert.equal(res.status, 200);
    assert.ok(res.body.count >= 6);
    assert.ok(res.body.campaigns.every((c) => c.isApproved));
    assert.ok(!res.body.campaigns.some((c) => c.title.includes("Fernway")), "pending campaign leaked");
  });

  test("search, category and sort work and are validated", async () => {
    const q = await api().get("/api/campaigns").query({ q: "kennels" });
    assert.equal(q.body.count, 1);
    const cat = await api().get("/api/campaigns").query({ category: "Education" });
    assert.ok(cat.body.campaigns.every((c) => c.EventCategory === "Education"));
    const funded = await api().get("/api/campaigns").query({ sort: "most-funded" });
    const ratios = funded.body.campaigns.map((c) => c.EventCurrentAmount / c.EventTargetAmount);
    assert.deepEqual(ratios, [...ratios].sort((a, b) => b - a));
    assert.equal((await api().get("/api/campaigns").query({ category: "Nope" })).status, 400);
    // Regex metacharacters are treated literally, not as a pattern.
    assert.equal((await api().get("/api/campaigns").query({ q: "(.*" })).status, 200);
  });

  test("detail hides donor emails and 404s bad ids", async () => {
    const [first] = (await api().get("/api/campaigns")).body.campaigns;
    const res = await api().get(`/api/campaigns/${first._id}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.recentDonations.length > 0);
    assert.ok(res.body.recentDonations.every((d) => d.donorEmail === undefined));
    assert.equal(res.body.canDonate, true);
    assert.equal((await api().get("/api/campaigns/not-an-id")).status, 404);
    assert.equal((await api().get("/api/campaigns/0123456789abcdef01234567")).status, 404);
  });

  test("a pending campaign is visible to its owner and admins only", async () => {
    const pending = await Campaign.findOne({ title: /Fernway/ });
    assert.equal((await api().get(`/api/campaigns/${pending._id}`)).status, 404);
    assert.equal((await api().get(`/api/campaigns/${pending._id}`).set(...auth(organiser))).status, 200);
    assert.equal((await api().get(`/api/campaigns/${pending._id}`).set(...auth(admin))).status, 200);
  });

  test("stats come from the donation ledger", async () => {
    const res = await api().get("/api/campaigns/stats");
    const sum = (await Campaign.find({})).reduce((s, c) => s + c.EventCurrentAmount, 0);
    assert.equal(res.body.stats.totalRaised, sum);
    assert.ok(res.body.stats.liveCampaigns >= 5);
  });

  test("stats carry a public feed of recent gifts", async () => {
    const res = await api().get("/api/campaigns/stats");
    const gifts = res.body.stats.recentGifts;
    assert.ok(gifts.length > 0 && gifts.length <= 10);
    const times = gifts.map((g) => new Date(g.createdAt).getTime());
    assert.deepEqual(times, [...times].sort((a, b) => b - a), "newest first");
    const publicIds = new Set((await Campaign.find(PUBLIC_FILTER)).map((c) => String(c._id)));
    for (const g of gifts) {
      assert.equal(g.donorEmail, undefined);
      assert.ok(publicIds.has(String(g.campaignId)), "only gifts to public campaigns");
      assert.ok(g.campaignTitle);
    }
  });
});

describe("creating campaigns", () => {
  test("requires sign-in", async () => {
    assert.equal((await api().post("/api/campaigns").send(validCampaign())).status, 401);
  });

  test("rejects bad input at the boundary", async () => {
    const cases = [
      { EventTargetAmount: 50 },
      { EventTargetAmount: 1000.5 },
      { endDate: inDays(-1) },
      { endDate: inDays(400) },
      { EventCategory: "Crypto" },
      { title: "" },
      { image: "http://insecure.example/img.png" },
      { image: "javascript:alert(1)" },
    ];
    for (const override of cases) {
      const res = await api().post("/api/campaigns").set(...auth(organiser)).send(validCampaign(override));
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(override)}`);
    }
  });

  test("an organiser's campaign goes to review; client-sent totals and flags are ignored", async () => {
    const res = await api()
      .post("/api/campaigns")
      .set(...auth(organiser))
      .send(validCampaign({ EventCurrentAmount: 99999, isApproved: true, isFeatured: true }));
    assert.equal(res.status, 201);
    assert.equal(res.body.campaign.isApproved, false);
    assert.equal(res.body.campaign.EventCurrentAmount, 0);
    assert.equal(res.body.campaign.isFeatured, false);
    const list = await api().get("/api/campaigns").query({ q: "Test Garden" });
    assert.equal(list.body.count, 0);
  });

  test("approval is admin-only and makes the campaign public", async () => {
    const created = await api().post("/api/campaigns").set(...auth(organiser)).send(validCampaign({ title: "Approve Me" }));
    const id = created.body.campaign._id;
    assert.equal((await api().patch(`/api/admin/campaigns/${id}/approve`).set(...auth(organiser))).status, 403);
    assert.equal((await api().patch(`/api/admin/campaigns/${id}/approve`)).status, 401);
    const ok = await api().patch(`/api/admin/campaigns/${id}/approve`).set(...auth(admin));
    assert.equal(ok.status, 200);
    assert.equal((await api().get("/api/campaigns").query({ q: "Approve Me" })).body.count, 1);
  });

  test("admin edits cannot overwrite the raised total", async () => {
    const [c] = (await api().get("/api/campaigns")).body.campaigns;
    const res = await api()
      .put(`/api/admin/campaigns/${c._id}`)
      .set(...auth(admin))
      .send({ EventCurrentAmount: 1, title: "Renamed by admin" });
    assert.equal(res.status, 200);
    assert.equal(res.body.campaign.EventCurrentAmount, c.EventCurrentAmount);
    assert.equal(res.body.campaign.title, "Renamed by admin");
  });

  test("rejecting removes a campaign from public view", async () => {
    const created = await api().post("/api/campaigns").set(...auth(organiser)).send(validCampaign({ title: "Reject Me" }));
    const id = created.body.campaign._id;
    const res = await api().patch(`/api/admin/campaigns/${id}/reject`).set(...auth(admin)).send({ reason: "Test" });
    assert.equal(res.body.campaign.isRejected, true);
    assert.equal((await api().get(`/api/campaigns/${id}`)).status, 404);
  });
});
