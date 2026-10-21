import { Router } from "express";
import { z } from "zod";
import Campaign from "../models/campaignmodel.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate, validObjectIdParam } from "../middleware/validate.js";
import { campaignFields, createCampaignSchema } from "./campaigns-routes.js";
import { broadcastToAll, emitToUser } from "../socket/socketHandler.js";

const router = Router();

// Every route here is admin-only.
router.use(requireAuth, requireAdmin);

// GET /api/admin/campaigns — every non-deleted campaign, any status
router.get("/", async (_req, res) => {
  const campaigns = await Campaign.find({ isDeleted: false })
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, count: campaigns.length, campaigns });
});

// POST /api/admin/campaigns — admin-created campaigns are published immediately
router.post("/", validate(createCampaignSchema), async (req, res) => {
  const campaign = await Campaign.create({
    ...req.body,
    createdBy: req.user._id,
    isApproved: true,
    isActive: true,
    status: "active",
  });
  broadcastToAll("new-campaign", { campaign: { _id: campaign._id, title: campaign.title } });
  res.status(201).json({ success: true, message: "Campaign published.", campaign });
});

// Raised totals are ledger-derived and never editable here.
const updateSchema = z
  .object({
    ...campaignFields,
    // Editing an existing campaign may keep an end date that is already close.
    endDate: z.coerce.date({ invalid_type_error: "End date is not a valid date." }),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
  })
  .partial();

router.put("/:id", validObjectIdParam(), validate(updateSchema), async (req, res) => {
  const campaign = await Campaign.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found." });
  res.json({ success: true, message: "Campaign updated.", campaign });
});

router.delete("/:id", validObjectIdParam(), async (req, res) => {
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { isDeleted: true, isActive: false },
    { new: true },
  );
  if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found." });
  res.json({ success: true, message: "Campaign deleted." });
});

router.patch("/:id/approve", validObjectIdParam(), async (req, res) => {
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { isApproved: true, isRejected: false, isActive: true, $unset: { rejectionReason: 1 } },
    { new: true },
  );
  if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found." });
  if (campaign.createdBy) emitToUser(campaign.createdBy, "campaign-approved", { campaignId: campaign._id, title: campaign.title });
  broadcastToAll("new-campaign", { campaign: { _id: campaign._id, title: campaign.title } });
  res.json({ success: true, message: "Campaign approved and live.", campaign });
});

router.patch(
  "/:id/reject",
  validObjectIdParam(),
  validate(z.object({ reason: z.string().trim().max(300).optional().default("") })),
  async (req, res) => {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isRejected: true, isApproved: false, isActive: false, rejectionReason: req.body.reason },
      { new: true },
    );
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found." });
    if (campaign.createdBy) emitToUser(campaign.createdBy, "campaign-rejected", { campaignId: campaign._id, title: campaign.title });
    res.json({ success: true, message: "Campaign rejected.", campaign });
  },
);

router.patch("/:id/feature", validObjectIdParam(), async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, isDeleted: false });
  if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found." });
  campaign.isFeatured = !campaign.isFeatured;
  await campaign.save();
  res.json({ success: true, message: campaign.isFeatured ? "Campaign featured." : "Campaign unfeatured.", campaign });
});

export default router;
