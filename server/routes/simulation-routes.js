import express from "express";
import { env } from "../config/env.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import realtimeDataService from "../services/realtimeDataService.js";
import { seedDemoData } from "../seed/seed-demo.js";

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get("/status", (_req, res) => {
  res.json({ success: true, status: realtimeDataService.getStatus() });
});

router.post("/start", (_req, res) => {
  const started = realtimeDataService.startSimulation();
  res.json({ success: true, message: started ? "Simulation started." : "Simulation already running.", running: true });
});

router.post("/stop", (_req, res) => {
  const stopped = realtimeDataService.stopSimulation();
  res.json({ success: true, message: stopped ? "Simulation stopped." : "Simulation was not running.", running: false });
});

// Re-seeds the fictional demo dataset. Never available in production.
router.post("/seed", async (_req, res) => {
  if (env.isProduction) return res.status(403).json({ success: false, message: "Seeding is disabled in production." });
  const result = await seedDemoData({ reset: true });
  res.json({ success: true, message: "Demo data reset.", ...result });
});

export default router;
