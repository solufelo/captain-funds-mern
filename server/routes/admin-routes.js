import { Router } from "express";
import { z } from "zod";
import Donation from "../models/donation-model.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { adminAnalytics } from "../services/analytics.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/analytics — platform KPIs, 30-day series, categories, queue
router.get("/analytics", async (_req, res) => {
  res.json({ success: true, analytics: await adminAnalytics() });
});

// GET /api/admin/donations — recent ledger entries (admins may see donor email)
router.get(
  "/donations",
  validate(z.object({ limit: z.coerce.number().int().min(1).max(200).optional().default(50) }), "query"),
  async (req, res) => {
    const donations = await Donation.find({ paymentStatus: { $ne: "pending" } })
      .sort({ createdAt: -1 })
      .limit(req.valid.query.limit)
      .lean();
    res.json({ success: true, donations });
  },
);

export default router;
