import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import UserModel from "../models/user-model.js";

export function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function readBearer(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

/**
 * Resolves the user behind a token. Role and active flag are read from the
 * database on every request, so demoting or deactivating someone takes
 * effect immediately rather than when their token expires.
 */
export async function userFromToken(token) {
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
  if (!payload?.sub || !mongoose.isValidObjectId(payload.sub)) return null;
  const user = await UserModel.findById(payload.sub).select("-password").lean();
  if (!user || !user.isActive) return null;
  return user;
}

export async function requireAuth(req, res, next) {
  const user = await userFromToken(readBearer(req));
  if (!user) return res.status(401).json({ success: false, message: "Please sign in to continue." });
  req.user = user;
  next();
}

export async function optionalAuth(req, _res, next) {
  req.user = (await userFromToken(readBearer(req))) || null;
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
}

export function isOwnerOrAdmin(user, ownerId) {
  if (!user) return false;
  return user.isAdmin || (ownerId && String(ownerId) === String(user._id));
}
