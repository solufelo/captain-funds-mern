export declare const CATEGORIES: string[];

export declare const DEMO_ACCOUNTS: {
  organiser: { email: string; password: string; name: string };
  admin: { email: string; password: string; name: string };
};

export interface SeedUser {
  key: string;
  name: string;
  email: string;
  password: string | null;
  isAdmin: boolean;
}

export interface SeedCampaign {
  key: string;
  owner: string;
  title: string;
  description: string;
  organizer: string;
  image: string;
  EventTargetAmount: number;
  EventCurrentAmount: number;
  donationCount: number;
  EventCategory: string;
  location: string;
  endDate: Date;
  status: string;
  isActive: boolean;
  isApproved: boolean;
  isRejected: boolean;
  isFeatured: boolean;
  isDeleted: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeedDonation {
  key: string;
  campaignKey: string;
  donorName: string;
  amount: number;
  message: string;
  isAnonymous: boolean;
  createdAt: Date;
}

export declare function buildDemoSeed(now?: number): {
  users: SeedUser[];
  campaigns: SeedCampaign[];
  donations: SeedDonation[];
};
