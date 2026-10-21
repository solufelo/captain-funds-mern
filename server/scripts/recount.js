// Rebuilds every campaign's raised total and donation count from the
// donation ledger. Safe to run any time.
import { connectDb, disconnectDb } from "../config/db-config.js";
import { recountCampaignTotals } from "../services/donation-ledger.js";

await connectDb();
console.log(`Recounted ${await recountCampaignTotals()} campaigns.`);
await disconnectDb();
