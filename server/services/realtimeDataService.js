import Campaign from "../models/campaignmodel.js";
import Donation from "../models/donation-model.js";
import { completeDonation } from "./donation-ledger.js";

// Optional activity simulator for live demos (ENABLE_SIMULATION=true or the
// admin start endpoint). Every simulated gift is written to the donation
// ledger with paymentProvider "simulated", so totals stay consistent and
// analytics can show (and exclude) simulated money honestly.
const NAMES = ["Alex R.", "Jordan P.", "Sam K.", "Riley M.", "Casey D.", "Morgan T.", "Avery L.", "Noor H."];
const AMOUNTS = [10, 20, 25, 25, 40, 50, 75, 100];

class RealtimeDataService {
  constructor() {
    this.timer = null;
    this.generated = 0;
    this.lastActivity = null;
  }

  get isRunning() {
    return Boolean(this.timer);
  }

  startSimulation(intervalMs = 15000) {
    if (this.timer) return false;
    this.timer = setInterval(() => this.generateDonation().catch((e) => console.error("[sim]", e.message)), intervalMs);
    this.timer.unref?.();
    return true;
  }

  stopSimulation() {
    if (!this.timer) return false;
    clearInterval(this.timer);
    this.timer = null;
    return true;
  }

  async generateDonation() {
    const live = await Campaign.find({
      isActive: true,
      isApproved: true,
      isDeleted: false,
      isRejected: false,
      endDate: { $gt: new Date() },
    })
      .select("_id title")
      .lean();
    if (!live.length) return null;
    const campaign = live[Math.floor(Math.random() * live.length)];
    const donation = await Donation.create({
      campaign: campaign._id,
      campaignTitle: campaign.title,
      donorName: NAMES[Math.floor(Math.random() * NAMES.length)],
      amount: AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)],
      paymentProvider: "simulated",
      paymentStatus: "pending",
    });
    await completeDonation(donation._id);
    this.generated += 1;
    this.lastActivity = new Date();
    return donation;
  }

  getStatus() {
    return { isRunning: this.isRunning, generated: this.generated, lastActivity: this.lastActivity };
  }
}

const realtimeDataService = new RealtimeDataService();
export default realtimeDataService;
