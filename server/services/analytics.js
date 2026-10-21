import Campaign, { acceptsDonations } from "../models/campaignmodel.js";
import Donation from "../models/donation-model.js";
import User from "../models/user-model.js";

const DAY = 24 * 60 * 60 * 1000;
const TZ = process.env.REPORT_TIMEZONE || "America/Toronto";

function dayKey(date) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    date,
  );
}

/** Completed-donation totals per day for the last `days` days, zero-filled. */
export async function dailySeries(match, days = 30) {
  const since = new Date(Date.now() - (days - 1) * DAY);
  since.setHours(0, 0, 0, 0);
  const rows = await Donation.aggregate([
    { $match: { ...match, createdAt: { $gte: new Date(since.getTime() - DAY) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$completedAt", "$createdAt"] }, timezone: TZ } },
        amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(new Date(Date.now() - i * DAY));
    const r = byDay.get(key);
    out.push({ date: key, amount: r?.amount || 0, count: r?.count || 0 });
  }
  return out;
}

/** Everything the admin analytics page shows, computed from the ledger. */
export async function adminAnalytics() {
  const now = new Date();
  const completed = { paymentStatus: "completed" };
  const [ledger, bySource, byCategory, campaigns, users, recent, daily] = await Promise.all([
    Donation.aggregate([{ $match: completed }, { $group: { _id: null, raised: { $sum: "$amount" }, n: { $sum: 1 } } }]),
    Donation.aggregate([
      { $match: completed },
      { $group: { _id: "$paymentProvider", raised: { $sum: "$amount" }, n: { $sum: 1 } } },
    ]),
    Donation.aggregate([
      { $match: completed },
      { $lookup: { from: "campaigns", localField: "campaign", foreignField: "_id", as: "c" } },
      { $unwind: "$c" },
      { $group: { _id: "$c.EventCategory", raised: { $sum: "$amount" }, n: { $sum: 1 } } },
      { $sort: { raised: -1 } },
    ]),
    Campaign.find({ isDeleted: false }).populate("createdBy", "name").sort({ createdAt: -1 }).lean(),
    User.countDocuments(),
    Donation.find(completed).sort({ completedAt: -1, createdAt: -1 }).limit(8).lean(),
    dailySeries(completed, 30),
  ]);

  const raised = ledger[0]?.raised || 0;
  const n = ledger[0]?.n || 0;
  const isPublic = (c) => c.isApproved && !c.isRejected;
  const live = campaigns.filter((c) => acceptsDonations(c, now));
  const pending = campaigns.filter((c) => !c.isApproved && !c.isRejected);
  const last30 = daily.reduce((s, d) => s + d.amount, 0);

  return {
    totals: {
      raised,
      donations: n,
      averageDonation: n ? Math.round(raised / n) : 0,
      raisedLast30Days: last30,
      users,
      organisers: new Set(campaigns.map((c) => String(c.createdBy?._id || ""))).size,
      campaigns: {
        total: campaigns.length,
        live: live.length,
        pending: pending.length,
        rejected: campaigns.filter((c) => c.isRejected).length,
        funded: campaigns.filter((c) => isPublic(c) && c.EventCurrentAmount >= c.EventTargetAmount).length,
      },
    },
    daily,
    byCategory: byCategory.map((c) => ({ category: c._id, raised: c.raised, donations: c.n })),
    bySource: bySource.map((s) => ({ source: s._id, raised: s.raised, donations: s.n })),
    topCampaigns: campaigns
      .filter(isPublic)
      .sort((a, b) => b.EventCurrentAmount - a.EventCurrentAmount)
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        title: c.title,
        raised: c.EventCurrentAmount,
        target: c.EventTargetAmount,
        donationCount: c.donationCount,
        percent: Math.round((c.EventCurrentAmount / c.EventTargetAmount) * 100),
      })),
    pending: pending.map((c) => ({
      _id: c._id,
      title: c.title,
      organizer: c.organizer,
      owner: c.createdBy?.name || "Unknown",
      EventCategory: c.EventCategory,
      EventTargetAmount: c.EventTargetAmount,
      createdAt: c.createdAt,
    })),
    recentDonations: recent.map((d) => ({
      _id: d._id,
      donorName: d.isAnonymous ? "Anonymous" : d.donorName,
      campaignId: d.campaign,
      campaignTitle: d.campaignTitle,
      amount: d.amount,
      source: d.paymentProvider,
      createdAt: d.completedAt || d.createdAt,
    })),
  };
}

