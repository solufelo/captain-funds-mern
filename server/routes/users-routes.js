import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import User from "../models/user-model.js";
import Campaign from "../models/campaignmodel.js";
import Donation from "../models/donation-model.js";
import { requireAuth, requireAdmin, signToken } from "../middleware/auth.js";
import { validate, validObjectIdParam, email, password, loginPassword } from "../middleware/validate.js";
import { emitToAdmins, emitToUser } from "../socket/socketHandler.js";
import { env } from "../config/env.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Wait a few minutes and try again." },
});

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  isAdmin: u.isAdmin,
  isActive: u.isActive,
  phone: u.phone,
  location: u.location,
  bio: u.bio,
  website: u.website,
  timeStamp: u.timeStamp,
  lastLogin: u.lastLogin,
});

const profileFields = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80).optional(),
    phone: z.string().trim().max(40).optional(),
    location: z.string().trim().max(80).optional(),
    bio: z.string().trim().max(500).optional(),
    website: z.string().trim().max(200).optional(),
  })
  .strip();

// ---- Public auth -----------------------------------------------------------

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email,
  password,
});

router.post("/register", authLimiter, validate(registerSchema), async (req, res) => {
  const { name, email: mail, password: pw } = req.body;
  if (await User.exists({ email: mail })) {
    return res.status(409).json({ success: false, message: "An account with this email already exists." });
  }
  // Role is never taken from the request: new accounts are always organisers/donors.
  const user = await User.create({ name, email: mail, password: await bcrypt.hash(pw, 10) });
  emitToAdmins("new-user-registered", { userId: user._id, name: user.name });
  res.status(201).json({
    success: true,
    message: "Account created.",
    token: signToken(user),
    user: publicUser(user),
  });
});

const loginSchema = z.object({ email, password: loginPassword });

router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const ok = user && (await bcrypt.compare(req.body.password, user.password));
  if (!ok) return res.status(401).json({ success: false, message: "Email or password is incorrect." });
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: "This account has been deactivated. Contact support." });
  }
  user.lastLogin = new Date();
  await user.save();
  res.json({ success: true, message: "Signed in.", token: signToken(user), user: publicUser(user) });
});

// ---- Signed-in user --------------------------------------------------------
// Fixed-path routes come before /:id so they are reachable.

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

router.put("/profile", requireAuth, validate(profileFields), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
  res.json({ success: true, message: "Profile updated.", user: publicUser(user) });
});

const changePasswordSchema = z.object({ currentPassword: loginPassword, newPassword: password });

router.put("/change-password", requireAuth, authLimiter, validate(changePasswordSchema), async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!(await bcrypt.compare(req.body.currentPassword, user.password))) {
    return res.status(400).json({ success: false, message: "Current password is incorrect." });
  }
  user.password = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  res.json({ success: true, message: "Password changed." });
});

// ---- Admin user management -------------------------------------------------

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const [users, campaignCounts, donationTotals] = await Promise.all([
    User.find({}, "-password").sort({ timeStamp: -1 }).lean(),
    Campaign.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: "$createdBy", n: { $sum: 1 } } }]),
    Donation.aggregate([
      { $match: { paymentStatus: "completed", donor: { $ne: null } } },
      { $group: { _id: "$donor", n: { $sum: 1 }, total: { $sum: "$amount" } } },
    ]),
  ]);
  const campaigns = new Map(campaignCounts.map((c) => [String(c._id), c.n]));
  const donations = new Map(donationTotals.map((d) => [String(d._id), d]));
  res.json({
    success: true,
    count: users.length,
    users: users.map((u) => ({
      ...publicUser(u),
      totalCampaigns: campaigns.get(String(u._id)) || 0,
      totalDonations: donations.get(String(u._id))?.n || 0,
      totalDonated: donations.get(String(u._id))?.total || 0,
    })),
  });
});

const adminCreateSchema = registerSchema.extend({
  isAdmin: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

router.post("/create", requireAuth, requireAdmin, validate(adminCreateSchema), async (req, res) => {
  if (await User.exists({ email: req.body.email })) {
    return res.status(409).json({ success: false, message: "An account with this email already exists." });
  }
  const user = await User.create({ ...req.body, password: await bcrypt.hash(req.body.password, 10) });
  res.status(201).json({ success: true, message: "User created.", user: publicUser(user) });
});

router.get("/:id", requireAuth, validObjectIdParam(), async (req, res) => {
  if (String(req.user._id) !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: "You can only view your own account." });
  }
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, user: publicUser(user) });
});

const adminUpdateSchema = profileFields.extend({
  email: email.optional(),
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

router.put("/:id", requireAuth, validObjectIdParam(), async (req, res) => {
  const self = String(req.user._id) === req.params.id;
  if (!self && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: "You can only edit your own account." });
  }
  const schema = req.user.isAdmin ? adminUpdateSchema : profileFields;
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
  if (self && parsed.data.isAdmin === false) {
    return res.status(400).json({ success: false, message: "You cannot remove your own admin role." });
  }
  const user = await User.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, message: "User updated.", user: publicUser(user) });
});

router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  validObjectIdParam(),
  validate(z.object({ isActive: z.boolean() })),
  async (req, res) => {
    if (String(req.user._id) === req.params.id) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    emitToUser(user._id, "account-status-changed", { isActive: user.isActive });
    res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}.`, user: publicUser(user) });
  },
);

router.delete("/:id", requireAuth, requireAdmin, validObjectIdParam(), async (req, res) => {
  if (String(req.user._id) === req.params.id) {
    return res.status(400).json({ success: false, message: "You cannot delete your own account." });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, message: "User deleted." });
});

export default router;
