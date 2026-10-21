import "./setup-env.js";
import request from "supertest";
import { connectDb, disconnectDb } from "../config/db-config.js";
import { createApp } from "../app.js";
import { seedDemoData } from "../seed/seed-demo.js";
import { DEMO_ACCOUNTS } from "../../shared/demo-seed.js";

export { DEMO_ACCOUNTS };

/** Fresh in-memory MongoDB (port 4191) seeded with the fictional demo data. */
export async function startTestApp() {
  await connectDb({ memoryPort: 4191 });
  await seedDemoData();
  const app = createApp({ demoAccounts: true });
  return { app, api: () => request(app) };
}

export async function stopTestApp() {
  await disconnectDb();
}

export async function tokenFor(app, { email, password }) {
  const res = await request(app).post("/api/users/login").send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token;
}

export function inDays(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

export function validCampaign(overrides = {}) {
  return {
    title: "Test Garden Beds",
    description: "Raised garden beds for the test plot behind the community hall.",
    organizer: "Test Gardeners",
    EventCategory: "Environment",
    location: "Testville (fictional)",
    EventTargetAmount: 2500,
    endDate: inDays(30),
    ...overrides,
  };
}
