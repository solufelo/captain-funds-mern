import mongoose from "mongoose";
import { CATEGORIES } from "../../shared/demo-seed.js";

// Field names (EventTargetAmount, EventCurrentAmount, EventCategory) are kept
// from the original client interface so existing UI code keeps working.
// Money is stored in whole dollars (integers) to avoid float drift.
const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 5000 },
    organizer: { type: String, required: true, trim: true, maxlength: 80 },
    image: { type: String, default: "" },
    EventTargetAmount: { type: Number, required: true, min: 100, max: 1_000_000 },
    EventCurrentAmount: { type: Number, default: 0, min: 0 },
    donationCount: { type: Number, default: 0, min: 0 },
    EventCategory: { type: String, required: true, enum: CATEGORIES },
    location: { type: String, required: true, trim: true, maxlength: 80 },
    endDate: { type: Date, required: true },
    status: { type: String, default: "active" },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    rejectionReason: { type: String, maxlength: 300 },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true },
);

campaignSchema.index({ isApproved: 1, isActive: 1, isDeleted: 1, createdAt: -1 });

campaignSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

/** Public filter: what anonymous visitors may see. */
export const PUBLIC_FILTER = { isApproved: true, isDeleted: false, isRejected: false };

/** Whether a campaign can take a donation right now. */
export function acceptsDonations(campaign, now = new Date()) {
  return (
    campaign.isApproved &&
    campaign.isActive &&
    !campaign.isDeleted &&
    !campaign.isRejected &&
    new Date(campaign.endDate) > now
  );
}

const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

export default Campaign;
