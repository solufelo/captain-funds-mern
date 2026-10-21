import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { buildDemoSeed } from "../../shared/demo-seed.js";
import User from "../models/user-model.js";
import Campaign from "../models/campaignmodel.js";
import Donation from "../models/donation-model.js";

/**
 * Loads the fictional demo dataset (shared/demo-seed.js).
 * - Skips when campaigns already exist, unless reset is true.
 * - reset clears campaigns and donations (never other users' accounts).
 * - Demo users are upserted by email.
 */
export async function seedDemoData({ reset = false, now = Date.now() } = {}) {
  if (!reset && (await Campaign.estimatedDocumentCount()) > 0) return { skipped: true };
  if (reset) {
    await Promise.all([Campaign.deleteMany({}), Donation.deleteMany({})]);
  }

  const seed = buildDemoSeed(now);
  const userIds = new Map();
  for (const u of seed.users) {
    const password = await bcrypt.hash(u.password || crypto.randomBytes(24).toString("hex"), 10);
    const user = await User.findOneAndUpdate(
      { email: u.email },
      { $setOnInsert: { name: u.name, email: u.email, password, isAdmin: u.isAdmin, isActive: true, timeStamp: u.joinedAt } },
      { upsert: true, new: true },
    );
    userIds.set(u.key, user._id);
  }

  const campaignIds = new Map(seed.campaigns.map((c) => [c.key, new mongoose.Types.ObjectId()]));
  // Raw driver insert keeps the seeded createdAt dates (Mongoose timestamps
  // would overwrite them); shapes are validated by the seed tests instead.
  await Campaign.collection.insertMany(
    seed.campaigns.map(({ key, owner, ...c }) => ({
      ...c,
      _id: campaignIds.get(key),
      createdBy: userIds.get(owner),
    })),
  );
  await Donation.collection.insertMany(
    seed.donations.map((d) => ({
      campaign: campaignIds.get(d.campaignKey),
      ...(d.donorKey && { donor: userIds.get(d.donorKey) }),
      campaignTitle: seed.campaigns.find((c) => c.key === d.campaignKey).title,
      donorName: d.donorName,
      amount: d.amount,
      currency: "cad",
      message: d.message,
      isAnonymous: d.isAnonymous,
      paymentProvider: "seed",
      paymentStatus: "completed",
      completedAt: d.createdAt,
      createdAt: d.createdAt,
      updatedAt: d.createdAt,
    })),
  );

  return { users: seed.users.length, campaigns: seed.campaigns.length, donations: seed.donations.length };
}
