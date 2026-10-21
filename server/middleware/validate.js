import mongoose from "mongoose";
import { z } from "zod";

/**
 * Validates req[source] against a zod schema and replaces it with the parsed
 * (trimmed, coerced, unknown-keys-stripped) value. Responds 400 with the first
 * few field errors otherwise.
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const errors = result.error.issues.slice(0, 5).map((i) => ({
        field: i.path.join(".") || source,
        message: i.message,
      }));
      return res.status(400).json({ success: false, message: errors[0].message, errors });
    }
    // Express 5 makes req.query a getter, so parsed values go on req.valid.
    req.valid = { ...(req.valid || {}), [source]: result.data };
    if (source === "body") req.body = result.data;
    next();
  };
}

/** 404s any :id param that is not a valid ObjectId (instead of a CastError 500). */
export function validObjectIdParam(name = "id") {
  return (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[name])) {
      return res.status(404).json({ success: false, message: "Not found." });
    }
    next();
  };
}

export const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
export const password = z.string().min(8, "Password must be at least 8 characters.").max(128);
export const loginPassword = z.string().min(1, "Password is required.").max(128);
export const wholeDollars = (min, max, label) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.` })
    .int(`${label} must be a whole dollar amount.`)
    .min(min, `${label} must be at least $${min}.`)
    .max(max, `${label} can be at most $${max.toLocaleString("en-CA")}.`);
export const optionalText = (max) => z.string().trim().max(max).optional().default("");
export const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "Image must be an https:// URL.");
