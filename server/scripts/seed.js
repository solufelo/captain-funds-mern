// Loads the fictional demo dataset into MONGODB_URL.
//   npm run seed            -> only if the database has no campaigns yet
//   npm run seed -- --reset -> wipe campaigns + donations, then seed
import { env } from "../config/env.js";
import { connectDb, disconnectDb } from "../config/db-config.js";
import { seedDemoData } from "../seed/seed-demo.js";

if (!env.mongoUrl) {
  console.error("Set MONGODB_URL first. (Without it, `npm run dev` already seeds an in-memory database.)");
  process.exit(1);
}
if (env.isProduction && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error("Refusing to seed demo accounts in production without ALLOW_DEMO_SEED=true.");
  process.exit(1);
}
await connectDb();
console.log(await seedDemoData({ reset: process.argv.includes("--reset") }));
await disconnectDb();
