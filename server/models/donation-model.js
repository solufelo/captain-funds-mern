import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    campaignTitle: { type: String, required: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    donorName: { type: String, required: true, maxlength: 80 },
    donorEmail: { type: String, maxlength: 254 },
    amount: { type: Number, required: true, min: 1, max: 10_000 },
    currency: { type: String, default: "cad" },
    message: { type: String, maxlength: 280, default: "" },
    isAnonymous: { type: Boolean, default: false },
    // mock = labelled test payment, stripe = Stripe test mode,
    // seed = fictional demo data, simulated = optional activity simulator
    paymentProvider: { type: String, enum: ["mock", "stripe", "seed", "simulated"], required: true },
    paymentStatus: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
    stripeSessionId: { type: String },
    transactionId: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

donationSchema.index({ campaign: 1, paymentStatus: 1, createdAt: -1 });
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

donationSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

/** Shape safe to show anyone: no email, name hidden when anonymous. */
export function toPublicDonation(d) {
  return {
    _id: d._id,
    donorName: d.isAnonymous ? "Anonymous" : d.donorName,
    amount: d.amount,
    message: d.message || "",
    createdAt: d.completedAt || d.createdAt,
    source: d.paymentProvider,
  };
}

const Donation = mongoose.models.Donation || mongoose.model("Donation", donationSchema);

export default Donation;
