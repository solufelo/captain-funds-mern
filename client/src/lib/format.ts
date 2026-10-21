import type { Campaign } from "../interfaces";

const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-CA", { notation: "compact", maximumFractionDigits: 1 });
const DAY = 24 * 60 * 60 * 1000;

export const formatMoney = (n: number) => money.format(Math.round(n || 0));
export const formatCompactMoney = (n: number) => (n >= 10000 ? `$${compact.format(n)}` : formatMoney(n));
export const formatNumber = (n: number) => (n || 0).toLocaleString("en-CA");

export function percentFunded(c: Pick<Campaign, "EventCurrentAmount" | "EventTargetAmount">) {
  if (!c.EventTargetAmount) return 0;
  return Math.round((c.EventCurrentAmount / c.EventTargetAmount) * 100);
}

export function daysLeft(endDate: string | Date) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / DAY);
}

export function daysLeftLabel(endDate: string | Date) {
  const d = daysLeft(endDate);
  if (d < 0) return "Ended";
  if (d === 0) return "Last day";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

export function timeAgo(date: string | Date) {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)} min ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)} h ago`;
  const d = h / 24;
  if (d < 30) return `${Math.floor(d)} d ago`;
  return new Date(date).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

export type CampaignState = "pending" | "rejected" | "live" | "funded" | "ended" | "paused";

export function campaignState(c: Campaign): CampaignState {
  if (c.isRejected) return "rejected";
  if (!c.isApproved) return "pending";
  if (daysLeft(c.endDate) < 0) return "ended";
  if (c.isActive === false) return "paused";
  if (c.EventCurrentAmount >= c.EventTargetAmount) return "funded";
  return "live";
}

export const STATE_LABEL: Record<CampaignState, string> = {
  pending: "In review",
  rejected: "Rejected",
  live: "Live",
  funded: "Funded",
  ended: "Ended",
  paused: "Paused",
};

export const SOURCE_LABEL: Record<string, string> = {
  seed: "Seeded demo data",
  mock: "Mock test payments",
  stripe: "Stripe test mode",
  simulated: "Simulator",
};
