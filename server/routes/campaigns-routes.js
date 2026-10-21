import { Router } from "express";
import { z } from "zod";
import Campaign, { PUBLIC_FILTER, acceptsDonations } from "../models/campaignmodel.js";
import Donation, { toPublicDonation } from "../models/donation-model.js";
import { CATEGORIES } from "../../shared/demo-seed.js";
import { isOwnerOrAdmin, optionalAuth, requireAuth } from "../middleware/auth.js";
import { validate, validObjectIdParam, wholeDollars, httpUrl } from "../middleware/validate.js";
import { dailySeries } from "../services/analytics.js";

const router = Router();
const DAY = 24 * 60 * 60 * 1000;

// Shared with the admin campaign routes.
export const campaignFields = {
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120),
  description: z.string().trim().min(20, "Tell supporters a bit more (20+ characters).").max(5000),
  organizer: z.string().trim().min(2, "Organiser name is required.").max(80),
  EventCategory: z.enum(CATEGORIES, { errorMap: () => ({ message: "Pick a category from the list." }) }),
  location: z.string().trim().min(2, "Location is required.").max(80),
  EventTargetAmount: wholeDollars(100, 1_000_000, "Goal"),
  endDate: z.coerce
    .date({ invalid_type_error: "End date is not a valid date." })
    .refine((d) => d.getTime() > Date.now() + DAY, "End date must be at least a day from now.")
    .refine((d) => d.getTime() < Date.now() + 366 * DAY, "Campaigns can run for at most a year."),
  image: httpUrl.optional().default(""),
};
export const createCampaignSchema = z.object(campaignFields);

const listQuery = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
  sort: z.enum(["featured", "newest", "ending", "most-funded"]).optional().default("featured"),
  featured: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional().default(30),
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/campaigns — public browse
router.get("/", validate(listQuery, "query"), async (req, res) => {
  const { q, category, sort, featured, limit } = req.valid.query;
  const filter = { ...PUBLIC_FILTER };
  if (category) filter.EventCategory = category;
  if (featured === "true") filter.isFeatured = true;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: rx }, { organizer: rx }, { location: rx }, { description: rx }];
  }

  let campaigns;
  if (sort === "most-funded") {
    campaigns = await Campaign.aggregate([
      { $match: filter },
      { $addFields: { ratio: { $divide: ["$EventCurrentAmount", "$EventTargetAmount"] } } },
      { $sort: { ratio: -1 } },
      { $limit: limit },
      { $project: { ratio: 0, __v: 0 } },
    ]);
  } else {
    const order = {
      featured: { isFeatured: -1, createdAt: -1 },
      newest: { createdAt: -1 },
      ending: { endDate: 1 },
    }[sort];
    const query = sort === "ending" ? { ...filter, endDate: { $gt: new Date() } } : filter;
    campaigns = await Campaign.find(query).sort(order).limit(limit).lean();
  }
  res.json({ success: true, count: campaigns.length, campaigns });
});

// GET /api/campaigns/stats — platform totals for the landing page
router.get("/stats", async (_req, res) => {
  const now = new Date();
  const publicIds = await Campaign.distinct("_id", { ...PUBLIC_FILTER });
  const [ledger, live, organisers, recent] = await Promise.all([
    Donation.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, raised: { $sum: "$amount" }, n: { $sum: 1 } } },
    ]),
    Campaign.countDocuments({ ...PUBLIC_FILTER, isActive: true, endDate: { $gt: now } }),
    Campaign.distinct("createdBy", { ...PUBLIC_FILTER }),
    // Latest gifts to public campaigns only, in the public shape (no emails,
    // anonymous names hidden), for the landing page's live feed.
    Donation.find({ campaign: { $in: publicIds }, paymentStatus: "completed" })
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(10)
      .lean(),
  ]);
  res.json({
    success: true,
    stats: {
      totalRaised: ledger[0]?.raised || 0,
      totalDonations: ledger[0]?.n || 0,
      liveCampaigns: live,
      organisers: organisers.filter(Boolean).length,
      recentGifts: recent.map((d) => ({ ...toPublicDonation(d), campaignId: d.campaign, campaignTitle: d.campaignTitle })),
    },
  });
});

// GET /api/campaigns/mine — organiser dashboard: my campaigns + totals
router.get("/mine", requireAuth, async (req, res) => {
  const campaigns = await Campaign.find({ createdBy: req.user._id, isDeleted: false })
    .sort({ createdAt: -1 })
    .lean();
  const ids = campaigns.map((c) => c._id);
  const match = { campaign: { $in: ids }, paymentStatus: "completed" };
  const [ledger, recent, daily] = await Promise.all([
    Donation.aggregate([{ $match: match }, { $group: { _id: null, raised: { $sum: "$amount" }, n: { $sum: 1 } } }]),
    Donation.find(match).sort({ completedAt: -1, createdAt: -1 }).limit(10).lean(),
    dailySeries(match, 30),
  ]);
  const now = new Date();
  const raised = ledger[0]?.raised || 0;
  const count = ledger[0]?.n || 0;
  res.json({
    success: true,
    campaigns,
    totals: {
      raised,
      donations: count,
      averageDonation: count ? Math.round(raised / count) : 0,
      liveCampaigns: campaigns.filter((c) => acceptsDonations(c, now)).length,
      pendingCampaigns: campaigns.filter((c) => !c.isApproved && !c.isRejected).length,
      totalGoal: campaigns.filter((c) => c.isApproved).reduce((s, c) => s + c.EventTargetAmount, 0),
    },
    recentDonations: recent.map((d) => ({ ...toPublicDonation(d), campaignId: d.campaign, campaignTitle: d.campaignTitle })),
    daily,
  });
});

// POST /api/campaigns — any signed-in user can start a campaign; it goes to
// the admin review queue. Admin-created campaigns are approved immediately.
router.post("/", requireAuth, validate(createCampaignSchema), async (req, res) => {
  const isAdmin = Boolean(req.user.isAdmin);
  const campaign = await Campaign.create({
    ...req.body,
    EventCurrentAmount: 0,
    donationCount: 0,
    createdBy: req.user._id,
    status: "active",
    isActive: true,
    isApproved: isAdmin,
  });
  res.status(201).json({
    success: true,
    message: isAdmin ? "Campaign published." : "Campaign submitted. An admin will review it shortly.",
    campaign,
  });
});

// GET /api/campaigns/:id — public detail. Unapproved campaigns are visible
// only to their owner and admins.
router.get("/:id", validObjectIdParam(), optionalAuth, async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).lean();
  const isPublic = campaign && campaign.isApproved && !campaign.isRejected && !campaign.isDeleted;
  if (!campaign || (!isPublic && !(isOwnerOrAdmin(req.user, campaign.createdBy) && !campaign.isDeleted))) {
    return res.status(404).json({ success: false, message: "Campaign not found." });
  }
  const recent = await Donation.find({ campaign: campaign._id, paymentStatus: "completed" })
    .sort({ completedAt: -1, createdAt: -1 })
    .limit(12)
    .lean();
  res.json({
    success: true,
    campaign,
    recentDonations: recent.map(toPublicDonation),
    canDonate: acceptsDonations(campaign),
    viewerIsOwner: Boolean(req.user && String(campaign.createdBy) === String(req.user._id)),
  });
});

export default router;
