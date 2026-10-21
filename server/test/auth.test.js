import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_ACCOUNTS, startTestApp, stopTestApp, tokenFor } from "./helpers.js";
import User from "../models/user-model.js";
import { resolvePayments } from "../config/env.js";

let app, api;
before(async () => ({ app, api } = await startTestApp()));
after(stopTestApp);

describe("auth", () => {
  test("register ignores isAdmin from the request and returns a token", async () => {
    const res = await api()
      .post("/api/users/register")
      .send({ name: "Eve Example", email: "EVE@example.com", password: "longenough1", isAdmin: true });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.isAdmin, false);
    assert.equal(res.body.user.email, "eve@example.com");
    assert.ok(res.body.token);
    assert.equal(res.body.user.password, undefined);
  });

  test("register validates input", async () => {
    const bad = await api().post("/api/users/register").send({ name: "X", email: "nope", password: "short" });
    assert.equal(bad.status, 400);
    const dupe = await api()
      .post("/api/users/register")
      .send({ name: "Eve Again", email: "eve@example.com", password: "longenough1" });
    assert.equal(dupe.status, 409);
  });

  test("login rejects a wrong password without saying which field was wrong", async () => {
    const res = await api().post("/api/users/login").send({ email: DEMO_ACCOUNTS.organiser.email, password: "wrong" });
    assert.equal(res.status, 401);
    assert.match(res.body.message, /email or password/i);
  });

  test("/me needs a valid token", async () => {
    assert.equal((await api().get("/api/users/me")).status, 401);
    assert.equal((await api().get("/api/users/me").set("Authorization", "Bearer garbage")).status, 401);
    const token = await tokenFor(app, DEMO_ACCOUNTS.organiser);
    const me = await api().get("/api/users/me").set("Authorization", `Bearer ${token}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, DEMO_ACCOUNTS.organiser.email);
  });

  test("a deactivated user's existing token stops working immediately", async () => {
    await api().post("/api/users/register").send({ name: "Temp User", email: "temp@example.com", password: "longenough1" });
    const token = await tokenFor(app, { email: "temp@example.com", password: "longenough1" });
    await User.updateOne({ email: "temp@example.com" }, { isActive: false });
    assert.equal((await api().get("/api/users/me").set("Authorization", `Bearer ${token}`)).status, 401);
  });

  test("user management is admin-only", async () => {
    const userToken = await tokenFor(app, DEMO_ACCOUNTS.organiser);
    assert.equal((await api().get("/api/users").set("Authorization", `Bearer ${userToken}`)).status, 403);
    const adminToken = await tokenFor(app, DEMO_ACCOUNTS.admin);
    const list = await api().get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    assert.equal(list.status, 200);
    assert.ok(list.body.users.every((u) => u.password === undefined));
    const organiser = list.body.users.find((u) => u.email === DEMO_ACCOUNTS.organiser.email);
    assert.ok(organiser.totalCampaigns >= 1);
  });

  test("a non-admin cannot promote themselves", async () => {
    const token = await tokenFor(app, DEMO_ACCOUNTS.organiser);
    const me = (await api().get("/api/users/me").set("Authorization", `Bearer ${token}`)).body.user;
    const res = await api()
      .put(`/api/users/${me._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isAdmin: true, name: "Still Organiser" });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.isAdmin, false);
    assert.equal(res.body.user.name, "Still Organiser");
  });

  test("Stripe live keys are refused; test keys enable Stripe mode", () => {
    assert.deepEqual(resolvePayments(""), { mode: "mock" });
    assert.throws(() => resolvePayments("sk_live_abc"), /TEST key/);
    assert.equal(resolvePayments("sk_test_abc").mode, "stripe");
  });
});
