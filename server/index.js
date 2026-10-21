import { createServer } from "http";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./config/db-config.js";
import { createApp } from "./app.js";
import { initializeSocket } from "./socket/socketHandler.js";
import realtimeDataService from "./services/realtimeDataService.js";
import { seedDemoData } from "./seed/seed-demo.js";

const { inMemory } = await connectDb();

// The in-memory database starts empty every run, so it is always seeded with
// the fictional demo data. A real database is seeded only on request.
const shouldSeed = inMemory || process.env.SEED_DEMO === "true";
if (shouldSeed) {
  if (env.isProduction && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Refusing to seed demo accounts in production without ALLOW_DEMO_SEED=true.");
  }
  const result = await seedDemoData();
  console.log(result.skipped ? "[seed] data already present" : `[seed] demo data loaded: ${JSON.stringify(result)}`);
}

const app = createApp({ demoAccounts: shouldSeed });
const server = createServer(app);
initializeSocket(server);

if (env.enableSimulation) realtimeDataService.startSimulation();

server.listen(env.port, () => {
  console.log(
    [
      `Captain Funds API  http://localhost:${env.port}`,
      `  database   ${inMemory ? "in-memory MongoDB (data resets on restart)" : "MONGODB_URL"}`,
      `  payments   ${env.payments.mode === "stripe" ? "Stripe TEST mode" : "mock (labelled test payments, no money moves)"}`,
      `  simulation ${env.enableSimulation ? "on" : "off"}`,
    ].join("\n"),
  );
});

async function shutdown() {
  realtimeDataService.stopSimulation();
  server.close();
  await disconnectDb();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
