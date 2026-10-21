export interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  phone?: string;
  location?: string;
  bio?: string;
  website?: string;
  timeStamp?: string;
  lastLogin?: string;
}

export interface Campaign {
  _id: string;
  title: string;
  description: string;
  organizer: string;
  image: string;
  EventTargetAmount: number;
  EventCurrentAmount: number;
  donationCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  status: string;
  EventCategory: string;
  location: string;
  endDate: string | Date;
  isActive?: boolean;
  isDeleted?: boolean;
  isFeatured?: boolean;
  isApproved?: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
  isArchived?: boolean;
  isDemo?: boolean;
  createdBy?: string | { _id: string; name: string; email?: string };
}

export type CampaignInput = Pick<
  Campaign,
  "title" | "description" | "organizer" | "EventCategory" | "location" | "EventTargetAmount" | "image"
> & { endDate: string };

export type PaymentSource = "mock" | "stripe" | "seed" | "simulated";

/** A donation as anyone may see it: no email, name hidden if anonymous. */
export interface PublicDonation {
  _id: string;
  donorName: string;
  amount: number;
  message: string;
  createdAt: string | Date;
  source: PaymentSource;
  campaignId?: string;
  campaignTitle?: string;
}

export interface CampaignDetail {
  campaign: Campaign;
  recentDonations: PublicDonation[];
  canDonate: boolean;
  viewerIsOwner: boolean;
}

export interface PlatformStats {
  totalRaised: number;
  totalDonations: number;
  liveCampaigns: number;
  organisers: number;
  /** Latest gifts to public campaigns, newest first (public shape). */
  recentGifts?: PublicDonation[];
}

export interface DailyPoint {
  date: string;
  amount: number;
  count: number;
}

export interface OrganiserDashboard {
  campaigns: Campaign[];
  totals: {
    raised: number;
    donations: number;
    averageDonation: number;
    liveCampaigns: number;
    pendingCampaigns: number;
    totalGoal: number;
  };
  recentDonations: PublicDonation[];
  daily: DailyPoint[];
}

export interface AdminAnalytics {
  totals: {
    raised: number;
    donations: number;
    averageDonation: number;
    raisedLast30Days: number;
    users: number;
    organisers: number;
    campaigns: { total: number; live: number; pending: number; rejected: number; funded: number };
  };
  daily: DailyPoint[];
  byCategory: { category: string; raised: number; donations: number }[];
  bySource: { source: PaymentSource; raised: number; donations: number }[];
  /** Money by gift size; `min` is the band's lower bound in dollars (0, 25, 100, 250). */
  bySize: { min: number; raised: number; donations: number }[];
  topCampaigns: { _id: string; title: string; raised: number; target: number; donationCount: number; percent: number }[];
  pending: {
    _id: string;
    title: string;
    organizer: string;
    owner: string;
    EventCategory: string;
    EventTargetAmount: number;
    createdAt: string | Date;
  }[];
  recentDonations: (PublicDonation & { campaignTitle: string })[];
}

export interface CheckoutInput {
  campaignId: string;
  amount: number;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  isAnonymous?: boolean;
}

export interface Receipt {
  id: string;
  amount: number;
  currency: string;
  campaignId: string;
  campaignTitle: string;
  createdAt: string | Date;
  mode: PaymentSource;
}

export type CheckoutResult =
  | {
      mode: "mock";
      message: string;
      donation: PublicDonation;
      receipt: Receipt;
      campaign: { _id: string; EventCurrentAmount: number; donationCount: number };
    }
  | { mode: "stripe"; checkoutUrl: string };

export interface MyDonation {
  _id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  paymentProvider: PaymentSource;
  transactionId?: string;
  createdAt: string | Date;
}

export interface MyDonations {
  donations: MyDonation[];
  stats: { totalDonations: number; totalAmount: number; averageDonation: number; campaignsSupported: number };
}

export interface AdminUser extends User {
  totalCampaigns: number;
  totalDonations: number;
  totalDonated: number;
}

export interface AppConfig {
  payments: "mock" | "stripe";
  currency: string;
  uploads: boolean;
  demoAccounts: boolean;
  /** true when running as the static browser-only demo (no API) */
  browserDemo: boolean;
}

export interface Session {
  token: string;
  user: User;
}

export interface CampaignQuery {
  q?: string;
  category?: string;
  sort?: "featured" | "newest" | "ending" | "most-funded";
  featured?: boolean;
  limit?: number;
}
