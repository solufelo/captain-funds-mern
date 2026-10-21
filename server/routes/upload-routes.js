import express from "express";
import { env } from "../config/env.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Cloudinary is optional. Without keys every upload route answers 503 and the
// client falls back to an image URL field plus generated cover art.
router.use(async (req, res, next) => {
  if (req.path === "/health") return next();
  if (!env.uploadsConfigured) {
    return res.status(503).json({ success: false, message: "Image uploads are not configured on this server." });
  }
  next();
});

async function cloudinary() {
  return import("../config/cloudinary.js");
}

function singleUpload(getMiddleware, field) {
  return async (req, res) => {
    const middleware = (await cloudinary())[getMiddleware];
    middleware.single(field)(req, res, (error) => {
      if (error) return res.status(400).json({ success: false, message: error.message || "Upload failed." });
      if (!req.file) return res.status(400).json({ success: false, message: "No image file provided." });
      res.json({ success: true, imageUrl: req.file.path, publicId: req.file.filename });
    });
  };
}

router.post("/campaign-image", requireAuth, singleUpload("uploadCampaignImage", "image"));
router.post("/profile-image", requireAuth, singleUpload("uploadProfileImage", "profileImage"));

// Deleting arbitrary assets by id is an admin-only maintenance action.
router.delete("/delete/:publicId", requireAuth, requireAdmin, async (req, res) => {
  const { deleteFromCloudinary } = await cloudinary();
  const result = await deleteFromCloudinary(decodeURIComponent(req.params.publicId));
  res.status(result?.result === "ok" ? 200 : 400).json({ success: result?.result === "ok", result });
});

router.get("/health", (_req, res) => {
  res.json({ success: true, configured: env.uploadsConfigured });
});

export default router;
