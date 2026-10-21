import Campaign from "../models/campaignmodel.js";
import Donation, { toPublicDonation } from "../models/donation-model.js";
import { emitToAdmins, emitToCampaign, emitToUser } from "../socket/socketHandler.js";

/**
 * Moves a donation from pending to completed exactly once, then bumps the
 * campaign's running total. The conditional update makes this idempotent, so
 * a Stripe webhook and the browser's return-trip verify can both call it
 * without double counting.
 *
 * shortcut: the two writes are not in a transaction (the in-memory dev server
 * is a standalone mongod). A crash between them leaves the campaign counter
 * short; scripts/recount.js rebuilds counters from the ledger if ever needed.
 */
export async function completeDonation(donationId, extra = {}) {
  const donation = await Donation.findOneAndUpdate(
    { _id: donationId, paymentStatus: "pending" },
    { $set: { paymentStatus: "completed", completedAt: new Date(), ...extra } },
    { new: true },
  );
  if (!donation) {
    return { donation: await Donation.findById(donationId), campaign: null, alreadyCompleted: true };
  }

  const campaign = await Campaign.findByIdAndUpdate(
    donation.campaign,
    { $inc: { EventCurrentAmount: donation.amount, donationCount: 1 } },
    { new: true },
  );

  if (campaign) {
    const publicDonation = toPublicDonation(donation);
    emitToCampaign(campaign._id, "campaign-updated", {
      campaignId: campaign._id,
      newAmount: campaign.EventCurrentAmount,
      donationCount: campaign.donationCount,
      donation: publicDonation,
    });
    emitToAdmins("new-donation", { ...publicDonation, campaignTitle: campaign.title, campaignId: campaign._id });
    if (campaign.createdBy) {
      emitToUser(campaign.createdBy, "donation-received", {
        ...publicDonation,
        campaignTitle: campaign.title,
        campaignId: campaign._id,
      });
    }
  }

  return { donation, campaign, alreadyCompleted: false };
}

export async function failDonation(donationId) {
  return Donation.findOneAndUpdate(
    { _id: donationId, paymentStatus: "pending" },
    { $set: { paymentStatus: "failed" } },
    { new: true },
  );
}

/** Rebuilds every campaign's raised/donationCount from completed donations. */
export async function recountCampaignTotals() {
  const totals = await Donation.aggregate([
    { $match: { paymentStatus: "completed" } },
    { $group: { _id: "$campaign", raised: { $sum: "$amount" }, n: { $sum: 1 } } },
  ]);
  const byId = new Map(totals.map((t) => [String(t._id), t]));
  const campaigns = await Campaign.find({}, "_id");
  await Promise.all(
    campaigns.map((c) => {
      const t = byId.get(String(c._id));
      return Campaign.updateOne({ _id: c._id }, { EventCurrentAmount: t?.raised || 0, donationCount: t?.n || 0 });
    }),
  );
  return campaigns.length;
}
