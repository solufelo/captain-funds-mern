// Browser-only implementation of the Captain Funds API, used by the static
// demo build (VITE_DEMO_MODE=true). It is seeded from the same fictional
// dataset as the server (shared/demo-seed.js) and mirrors the server's rules:
// pending campaigns stay private, totals come from the donation ledger, only
// admins can approve. Data lives in this browser's localStorage only.
import { buildDemoSeed, CATEGORIES } from "../../../shared/demo-seed.js";
import type {
  AdminAnalytics,
  AdminUser,
  Campaign,
  CampaignDetail,
  CampaignInput,
  CampaignQuery,
  CheckoutInput,
  CheckoutResult,
  DailyPoint,
  MyDonations,
  OrganiserDashboard,
  PaymentSource,
  PlatformStats,
  PublicDonation,
  Session,
  User,
} from "../interfaces";
import { ApiError } from "./errors";

const STORAGE_KEY = "cf2_demo_state";
const VERSION = 3;
const DAY = 24 * 60 * 60 * 1000;

interface DemoUser extends User {
  passwordHash: string;
}
interface DemoDonation {
  _id: string;
  campaignId: string;
  campaignTitle: string;
  donorId?: string;
  donorName: string;
  donorEmail?: string;
  amount: number;
  message: string;
  isAnonymous: boolean;
  source: PaymentSource;
  transactionId: string;
  createdAt: string;
}
interface DemoState {
  version: number;
  users: DemoUser[];
  campaigns: (Campaign & { createdBy: string })[];
  donations: DemoDonation[];
}

let memory: DemoState | null = null;

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`captain-funds:${text}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 12)}`;

async function freshState(): Promise<DemoState> {
  const seed = buildDemoSeed(Date.now());
  const users: DemoUser[] = [];
  for (const u of seed.users) {
    users.push({
      _id: u.key,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin,
      isActive: true,
      timeStamp: u.joinedAt.toISOString(),
      passwordHash: u.password ? await sha256(u.password) : "!",
    });
  }
  const titles = new Map(seed.campaigns.map((c) => [c.key, c.title]));
  return {
    version: VERSION,
    users,
    campaigns: seed.campaigns.map(({ key, owner, ...c }) => ({
      ...c,
      _id: key,
      createdBy: owner,
      endDate: c.endDate.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    donations: seed.donations.map((d) => ({
      _id: d.key,
      campaignId: d.campaignKey,
      campaignTitle: titles.get(d.campaignKey) || "",
      donorId: d.donorKey,
      donorName: d.donorName,
      amount: d.amount,
      message: d.message,
      isAnonymous: d.isAnonymous,
      source: "seed" as const,
      transactionId: `seed_${d.key}`,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

async function load(): Promise<DemoState> {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as DemoState) : null;
    if (parsed?.version === VERSION) return (memory = parsed);
  } catch {
    /* storage blocked or corrupt: fall through to a fresh seed */
  }
  memory = await freshState();
  save(memory);
  return memory;
}

function save(state: DemoState) {
  memory = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private window: keep the in-memory copy */
  }
}

export async function resetDemo() {
  memory = await freshState();
  save(memory);
}

// ---- helpers mirroring the server ------------------------------------------

function publicUser(user: DemoUser): User {
  const { passwordHash, ...rest } = user;
  void passwordHash;
  return rest;
}

function currentUser(state: DemoState, token: string | null): DemoUser | null {
  if (!token?.startsWith("demo.")) return null;
  const user = state.users.find((u) => u._id === token.slice(5));
  return user && user.isActive ? user : null;
}

function requireUser(state: DemoState, token: string | null) {
  const user = currentUser(state, token);
  if (!user) throw new ApiError("Please sign in to continue.", 401);
  return user;
}

function requireAdmin(state: DemoState, token: string | null) {
  const user = requireUser(state, token);
  if (!user.isAdmin) throw new ApiError("Admin access required.", 403);
  return user;
}

const isPublic = (c: Campaign) => Boolean(c.isApproved && !c.isRejected && !c.isDeleted);
const acceptsDonations = (c: Campaign) =>
  isPublic(c) && c.isActive !== false && new Date(c.endDate).getTime() > Date.now();

function toPublic(d: DemoDonation): PublicDonation {
  return {
    _id: d._id,
    donorName: d.isAnonymous ? "Anonymous" : d.donorName,
    amount: d.amount,
    message: d.message,
    createdAt: d.createdAt,
    source: d.source,
    campaignId: d.campaignId,
    campaignTitle: d.campaignTitle,
  };
}

function dayKey(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daily(donations: DemoDonation[], days = 30): DailyPoint[] {
  const buckets = new Map<string, DailyPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(Date.now() - i * DAY);
    buckets.set(key, { date: key, amount: 0, count: 0 });
  }
  for (const d of donations) {
    const b = buckets.get(dayKey(new Date(d.createdAt).getTime()));
    if (b) {
      b.amount += d.amount;
      b.count += 1;
    }
  }
  return [...buckets.values()];
}

function validateCampaign(input: Partial<CampaignInput>, { forUpdate = false } = {}) {
  const fail = (m: string) => {
    throw new ApiError(m, 400);
  };
  const has = (k: keyof CampaignInput) => !forUpdate || input[k] !== undefined;
  if (has("title") && (!input.title || input.title.trim().length < 3)) fail("Title must be at least 3 characters.");
  if (has("description") && (!input.description || input.description.trim().length < 20))
    fail("Tell supporters a bit more (20+ characters).");
  if (has("organizer") && (!input.organizer || input.organizer.trim().length < 2)) fail("Organiser name is required.");
  if (has("location") && (!input.location || input.location.trim().length < 2)) fail("Location is required.");
  if (has("EventCategory") && !CATEGORIES.includes(input.EventCategory || "")) fail("Pick a category from the list.");
  if (has("EventTargetAmount")) {
    const g = Number(input.EventTargetAmount);
    if (!Number.isInteger(g) || g < 100 || g > 1_000_000) fail("Goal must be a whole dollar amount between $100 and $1,000,000.");
  }
  if (has("endDate")) {
    const t = new Date(input.endDate || "").getTime();
    if (Number.isNaN(t)) fail("End date is not a valid date.");
    if (!forUpdate && t < Date.now() + DAY) fail("End date must be at least a day from now.");
    if (t > Date.now() + 366 * DAY) fail("Campaigns can run for at most a year.");
  }
  if (input.image && !/^https:\/\/\S+$/i.test(input.image)) fail("Image must be an https:// URL.");
}

// ---- API surface (same shapes as the HTTP API) ------------------------------

export const demoApi = {
  async login(email: string, password: string): Promise<Session> {
    const state = await load();
    const hash = await sha256(password);
    const user = state.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.passwordHash !== hash) throw new ApiError("Email or password is incorrect.", 401);
    if (!user.isActive) throw new ApiError("This account has been deactivated. Contact support.", 403);
    user.lastLogin = new Date().toISOString();
    save(state);
    return { token: `demo.${user._id}`, user: publicUser(user) };
  },

  async register(name: string, email: string, password: string): Promise<Session> {
    const state = await load();
    const mail = email.trim().toLowerCase();
    if (name.trim().length < 2) throw new ApiError("Name must be at least 2 characters.");
    if (!/^\S+@\S+\.\S+$/.test(mail)) throw new ApiError("Enter a valid email address.");
    if (password.length < 8) throw new ApiError("Password must be at least 8 characters.");
    if (state.users.some((u) => u.email === mail)) throw new ApiError("An account with this email already exists.", 409);
    const user: DemoUser = {
      _id: uid("user"),
      name: name.trim(),
      email: mail,
      isAdmin: false,
      isActive: true,
      timeStamp: new Date().toISOString(),
      passwordHash: await sha256(password),
    };
    state.users.push(user);
    save(state);
    return { token: `demo.${user._id}`, user: publicUser(user) };
  },

  async me(token: string | null): Promise<User> {
    return publicUser(requireUser(await load(), token));
  },

  async updateProfile(token: string | null, patch: Partial<User>): Promise<User> {
    const state = await load();
    const user = requireUser(state, token);
    for (const k of ["name", "phone", "location", "bio", "website"] as const) {
      if (patch[k] !== undefined) user[k] = String(patch[k]).slice(0, 500);
    }
    save(state);
    return publicUser(user);
  },

  async stats(): Promise<PlatformStats> {
    const state = await load();
    const pub = state.campaigns.filter(isPublic);
    return {
      totalRaised: state.donations.reduce((s, d) => s + d.amount, 0),
      totalDonations: state.donations.length,
      liveCampaigns: pub.filter(acceptsDonations).length,
      organisers: new Set(pub.map((c) => c.createdBy)).size,
      recentGifts: state.donations
        .filter((d) => pub.some((c) => c._id === d.campaignId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(toPublic),
    };
  },

  async listCampaigns(query: CampaignQuery = {}): Promise<Campaign[]> {
    const state = await load();
    let list = state.campaigns.filter(isPublic);
    if (query.category) list = list.filter((c) => c.EventCategory === query.category);
    if (query.featured) list = list.filter((c) => c.isFeatured);
    if (query.q) {
      const q = query.q.toLowerCase();
      list = list.filter((c) => [c.title, c.organizer, c.location, c.description].some((f) => f.toLowerCase().includes(q)));
    }
    const sort = query.sort || "featured";
    const created = (c: Campaign) => new Date(c.createdAt || 0).getTime();
    if (sort === "newest") list.sort((a, b) => created(b) - created(a));
    if (sort === "featured") list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || created(b) - created(a));
    if (sort === "ending") {
      list = list.filter((c) => new Date(c.endDate).getTime() > Date.now());
      list.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }
    if (sort === "most-funded")
      list.sort((a, b) => b.EventCurrentAmount / b.EventTargetAmount - a.EventCurrentAmount / a.EventTargetAmount);
    return list.slice(0, query.limit || 30);
  },

  async getCampaign(id: string, token: string | null): Promise<CampaignDetail> {
    const state = await load();
    const campaign = state.campaigns.find((c) => c._id === id && !c.isDeleted);
    const viewer = currentUser(state, token);
    const canSee = campaign && (isPublic(campaign) || viewer?.isAdmin || viewer?._id === campaign.createdBy);
    if (!campaign || !canSee) throw new ApiError("Campaign not found.", 404);
    return {
      campaign,
      recentDonations: state.donations.filter((d) => d.campaignId === id).slice(0, 12).map(toPublic),
      canDonate: acceptsDonations(campaign),
      viewerIsOwner: viewer?._id === campaign.createdBy,
    };
  },

  async createCampaign(token: string | null, input: CampaignInput): Promise<Campaign> {
    const state = await load();
    const user = requireUser(state, token);
    validateCampaign(input);
    const now = new Date().toISOString();
    const campaign = {
      _id: uid("camp"),
      title: input.title.trim(),
      description: input.description.trim(),
      organizer: input.organizer.trim(),
      image: input.image || "",
      EventTargetAmount: Number(input.EventTargetAmount),
      EventCurrentAmount: 0,
      donationCount: 0,
      EventCategory: input.EventCategory,
      location: input.location.trim(),
      endDate: new Date(input.endDate).toISOString(),
      status: "active",
      isActive: true,
      isApproved: user.isAdmin,
      isRejected: false,
      isFeatured: false,
      isDeleted: false,
      isDemo: false,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    };
    state.campaigns.unshift(campaign);
    save(state);
    return campaign;
  },

  async checkout(token: string | null, input: CheckoutInput): Promise<CheckoutResult> {
    const state = await load();
    const viewer = currentUser(state, token);
    const amount = Number(input.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 10000)
      throw new ApiError("Donation must be a whole dollar amount between $1 and $10,000.");
    if (input.donorEmail && !/^\S+@\S+\.\S+$/.test(input.donorEmail)) throw new ApiError("Enter a valid email address.");
    const campaign = state.campaigns.find((c) => c._id === input.campaignId && !c.isDeleted);
    if (!campaign) throw new ApiError("Campaign not found.", 404);
    if (!acceptsDonations(campaign)) throw new ApiError("This campaign is not accepting donations right now.", 409);

    const donation: DemoDonation = {
      _id: uid("don"),
      campaignId: campaign._id,
      campaignTitle: campaign.title,
      donorId: viewer?._id,
      donorName: (input.donorName || viewer?.name || "Guest supporter").slice(0, 80),
      donorEmail: input.donorEmail || viewer?.email,
      amount,
      message: (input.message || "").slice(0, 280),
      isAnonymous: Boolean(input.isAnonymous),
      source: "mock",
      transactionId: `mock_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    state.donations.unshift(donation);
    campaign.EventCurrentAmount += amount;
    campaign.donationCount = (campaign.donationCount || 0) + 1;
    save(state);
    window.dispatchEvent(new CustomEvent("cf:donation", { detail: { campaignId: campaign._id } }));
    return {
      mode: "mock",
      message: "Test donation recorded. No real money moved.",
      donation: toPublic(donation),
      receipt: {
        id: donation.transactionId,
        amount,
        currency: "cad",
        campaignId: campaign._id,
        campaignTitle: campaign.title,
        createdAt: donation.createdAt,
        mode: "mock",
      },
      campaign: { _id: campaign._id, EventCurrentAmount: campaign.EventCurrentAmount, donationCount: campaign.donationCount },
    };
  },

  async myDashboard(token: string | null): Promise<OrganiserDashboard> {
    const state = await load();
    const user = requireUser(state, token);
    const campaigns = state.campaigns.filter((c) => c.createdBy === user._id && !c.isDeleted);
    const ids = new Set(campaigns.map((c) => c._id));
    const donations = state.donations.filter((d) => ids.has(d.campaignId));
    const raised = donations.reduce((s, d) => s + d.amount, 0);
    return {
      campaigns,
      totals: {
        raised,
        donations: donations.length,
        averageDonation: donations.length ? Math.round(raised / donations.length) : 0,
        liveCampaigns: campaigns.filter(acceptsDonations).length,
        pendingCampaigns: campaigns.filter((c) => !c.isApproved && !c.isRejected).length,
        totalGoal: campaigns.filter((c) => c.isApproved).reduce((s, c) => s + c.EventTargetAmount, 0),
      },
      recentDonations: donations.slice(0, 10).map(toPublic),
      daily: daily(donations),
    };
  },

  async myDonations(token: string | null): Promise<MyDonations> {
    const state = await load();
    const user = requireUser(state, token);
    const mine = state.donations.filter((d) => d.donorId === user._id);
    const total = mine.reduce((s, d) => s + d.amount, 0);
    return {
      donations: mine.map((d) => ({
        _id: d._id,
        campaignId: d.campaignId,
        campaignTitle: d.campaignTitle,
        amount: d.amount,
        currency: "cad",
        message: d.message,
        isAnonymous: d.isAnonymous,
        paymentStatus: "completed",
        paymentProvider: d.source,
        transactionId: d.transactionId,
        createdAt: d.createdAt,
      })),
      stats: {
        totalDonations: mine.length,
        totalAmount: total,
        averageDonation: mine.length ? Math.round(total / mine.length) : 0,
        campaignsSupported: new Set(mine.map((d) => d.campaignId)).size,
      },
    };
  },

  // ---- admin ----------------------------------------------------------------

  async adminAnalytics(token: string | null): Promise<AdminAnalytics> {
    const state = await load();
    requireAdmin(state, token);
    const campaigns = state.campaigns.filter((c) => !c.isDeleted);
    const byId = new Map(campaigns.map((c) => [c._id, c]));
    const raised = state.donations.reduce((s, d) => s + d.amount, 0);
    const n = state.donations.length;
    const group = <K extends string>(keyOf: (d: DemoDonation) => K) => {
      const m = new Map<K, { raised: number; donations: number }>();
      for (const d of state.donations) {
        const k = keyOf(d);
        const cur = m.get(k) || { raised: 0, donations: 0 };
        cur.raised += d.amount;
        cur.donations += 1;
        m.set(k, cur);
      }
      return [...m.entries()].sort((a, b) => b[1].raised - a[1].raised);
    };
    const series = daily(state.donations);
    const pending = campaigns.filter((c) => !c.isApproved && !c.isRejected);
    const userName = (id: string) => state.users.find((u) => u._id === id)?.name || "Unknown";
    return {
      totals: {
        raised,
        donations: n,
        averageDonation: n ? Math.round(raised / n) : 0,
        raisedLast30Days: series.reduce((s, d) => s + d.amount, 0),
        users: state.users.length,
        organisers: new Set(campaigns.map((c) => c.createdBy)).size,
        campaigns: {
          total: campaigns.length,
          live: campaigns.filter(acceptsDonations).length,
          pending: pending.length,
          rejected: campaigns.filter((c) => c.isRejected).length,
          funded: campaigns.filter((c) => isPublic(c) && c.EventCurrentAmount >= c.EventTargetAmount).length,
        },
      },
      daily: series,
      byCategory: group((d) => byId.get(d.campaignId)?.EventCategory || "Other").map(([category, v]) => ({ category, ...v })),
      bySource: group((d) => d.source).map(([source, v]) => ({ source, ...v })),
      // Same bands as the server's $bucket (server/services/analytics.js).
      bySize: [0, 25, 100, 250].map((min, i, bands) => {
        const inBand = state.donations.filter((d) => d.amount >= min && (i === bands.length - 1 || d.amount < bands[i + 1]));
        return { min, raised: inBand.reduce((s, d) => s + d.amount, 0), donations: inBand.length };
      }),
      topCampaigns: campaigns
        .filter(isPublic)
        .sort((a, b) => b.EventCurrentAmount - a.EventCurrentAmount)
        .slice(0, 5)
        .map((c) => ({
          _id: c._id,
          title: c.title,
          raised: c.EventCurrentAmount,
          target: c.EventTargetAmount,
          donationCount: c.donationCount || 0,
          percent: Math.round((c.EventCurrentAmount / c.EventTargetAmount) * 100),
        })),
      pending: pending.map((c) => ({
        _id: c._id,
        title: c.title,
        organizer: c.organizer,
        owner: userName(c.createdBy),
        EventCategory: c.EventCategory,
        EventTargetAmount: c.EventTargetAmount,
        createdAt: c.createdAt || "",
      })),
      recentDonations: state.donations.slice(0, 8).map((d) => ({ ...toPublic(d), campaignTitle: d.campaignTitle })),
    };
  },

  async adminCampaigns(token: string | null): Promise<Campaign[]> {
    const state = await load();
    requireAdmin(state, token);
    return state.campaigns
      .filter((c) => !c.isDeleted)
      .map((c) => ({ ...c, createdBy: { _id: c.createdBy, name: state.users.find((u) => u._id === c.createdBy)?.name || "Unknown" } }));
  },

  async adminCampaignAction(
    token: string | null,
    id: string,
    action: "approve" | "reject" | "feature" | "delete",
    reason = "",
  ): Promise<void> {
    const state = await load();
    requireAdmin(state, token);
    const c = state.campaigns.find((x) => x._id === id && !x.isDeleted);
    if (!c) throw new ApiError("Campaign not found.", 404);
    if (action === "approve") Object.assign(c, { isApproved: true, isRejected: false, isActive: true, rejectionReason: undefined });
    if (action === "reject") Object.assign(c, { isApproved: false, isRejected: true, isActive: false, rejectionReason: reason });
    if (action === "feature") c.isFeatured = !c.isFeatured;
    if (action === "delete") Object.assign(c, { isDeleted: true, isActive: false });
    c.updatedAt = new Date().toISOString();
    save(state);
  },

  async adminUpdateCampaign(token: string | null, id: string, patch: Partial<CampaignInput & { isActive: boolean; isFeatured: boolean }>) {
    const state = await load();
    requireAdmin(state, token);
    validateCampaign(patch, { forUpdate: true });
    const c = state.campaigns.find((x) => x._id === id && !x.isDeleted);
    if (!c) throw new ApiError("Campaign not found.", 404);
    const allowed = ["title", "description", "organizer", "image", "EventTargetAmount", "EventCategory", "location", "endDate", "isActive", "isFeatured"] as const;
    for (const k of allowed) if (patch[k] !== undefined) (c as unknown as Record<string, unknown>)[k] = patch[k];
    if (patch.EventTargetAmount !== undefined) c.EventTargetAmount = Number(patch.EventTargetAmount);
    c.updatedAt = new Date().toISOString();
    save(state);
    return c;
  },

  async adminUsers(token: string | null): Promise<AdminUser[]> {
    const state = await load();
    requireAdmin(state, token);
    return state.users.map((u) => {
      const gifts = state.donations.filter((d) => d.donorId === u._id);
      return {
        ...publicUser(u),
        totalCampaigns: state.campaigns.filter((c) => c.createdBy === u._id && !c.isDeleted).length,
        totalDonations: gifts.length,
        totalDonated: gifts.reduce((s, d) => s + d.amount, 0),
      };
    });
  },

  async adminSetUserActive(token: string | null, id: string, isActive: boolean) {
    const state = await load();
    const admin = requireAdmin(state, token);
    if (admin._id === id) throw new ApiError("You cannot deactivate your own account.");
    const u = state.users.find((x) => x._id === id);
    if (!u) throw new ApiError("User not found.", 404);
    u.isActive = isActive;
    save(state);
  },

  async adminDeleteUser(token: string | null, id: string) {
    const state = await load();
    const admin = requireAdmin(state, token);
    if (admin._id === id) throw new ApiError("You cannot delete your own account.");
    state.users = state.users.filter((u) => u._id !== id);
    save(state);
  },
};
