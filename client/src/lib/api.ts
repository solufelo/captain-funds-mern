// One API surface for the whole client. In the full-stack build it talks to
// the Express API over HTTP; in the static demo build (VITE_DEMO_MODE=true)
// the same calls are answered by the in-browser demo store.
import axios from "axios";
import type {
  AdminAnalytics,
  AdminUser,
  AppConfig,
  Campaign,
  CampaignDetail,
  CampaignInput,
  CampaignQuery,
  CheckoutInput,
  CheckoutResult,
  MyDonations,
  OrganiserDashboard,
  PlatformStats,
  PublicDonation,
  Receipt,
  Session,
  User,
} from "../interfaces";
import { API_BASE_URL, isDemoMode } from "./config";
import { demoApi } from "./demoStore";
import { getToken, onUnauthorized } from "./session";

const http = axios.create({ baseURL: API_BASE_URL, headers: { "Content-Type": "application/json" } });

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(undefined, (error) => {
  // An expired/invalid token on a signed-in request: drop the session.
  if (error?.response?.status === 401 && error.config?.headers?.Authorization) onUnauthorized();
  return Promise.reject(error);
});

const demo = isDemoMode();

type AdminAction = "approve" | "reject" | "feature" | "delete";

export const api = {
  async config(): Promise<AppConfig> {
    if (demo) return { payments: "mock", currency: "cad", uploads: false, demoAccounts: true, browserDemo: true };
    const { data } = await http.get("/config");
    return { ...data, browserDemo: false };
  },

  async login(email: string, password: string): Promise<Session> {
    if (demo) return demoApi.login(email, password);
    const { data } = await http.post("/users/login", { email, password });
    return { token: data.token, user: data.user };
  },

  async register(name: string, email: string, password: string): Promise<Session> {
    if (demo) return demoApi.register(name, email, password);
    const { data } = await http.post("/users/register", { name, email, password });
    return { token: data.token, user: data.user };
  },

  async me(): Promise<User> {
    if (demo) return demoApi.me(getToken());
    return (await http.get("/users/me")).data.user;
  },

  async updateProfile(patch: Partial<User>): Promise<User> {
    if (demo) return demoApi.updateProfile(getToken(), patch);
    return (await http.put("/users/profile", patch)).data.user;
  },

  async stats(): Promise<PlatformStats> {
    if (demo) return demoApi.stats();
    return (await http.get("/campaigns/stats")).data.stats;
  },

  async listCampaigns(query: CampaignQuery = {}): Promise<Campaign[]> {
    if (demo) return demoApi.listCampaigns(query);
    const params = { ...query, featured: query.featured ? "true" : undefined };
    return (await http.get("/campaigns", { params })).data.campaigns;
  },

  async getCampaign(id: string): Promise<CampaignDetail> {
    if (demo) return demoApi.getCampaign(id, getToken());
    const { data } = await http.get(`/campaigns/${encodeURIComponent(id)}`);
    return data;
  },

  async createCampaign(input: CampaignInput): Promise<{ campaign: Campaign; message: string }> {
    if (demo) {
      const campaign = await demoApi.createCampaign(getToken(), input);
      return {
        campaign,
        message: campaign.isApproved ? "Campaign published." : "Campaign submitted. An admin will review it shortly.",
      };
    }
    const { data } = await http.post("/campaigns", input);
    return { campaign: data.campaign, message: data.message };
  },

  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    if (demo) return demoApi.checkout(getToken(), input);
    return (await http.post("/donations/checkout", input)).data;
  },

  async verifyStripe(sessionId: string): Promise<{ status: string; donation: PublicDonation; receipt: Receipt | null }> {
    return (await http.get(`/donations/verify/${encodeURIComponent(sessionId)}`)).data;
  },

  async myDashboard(): Promise<OrganiserDashboard> {
    if (demo) return demoApi.myDashboard(getToken());
    return (await http.get("/campaigns/mine")).data;
  },

  async myDonations(): Promise<MyDonations> {
    if (demo) return demoApi.myDonations(getToken());
    const { data } = await http.get("/donations/mine");
    return { donations: data.donations, stats: data.stats };
  },

  async adminAnalytics(): Promise<AdminAnalytics> {
    if (demo) return demoApi.adminAnalytics(getToken());
    return (await http.get("/admin/analytics")).data.analytics;
  },

  async adminCampaigns(): Promise<Campaign[]> {
    if (demo) return demoApi.adminCampaigns(getToken());
    return (await http.get("/admin/campaigns")).data.campaigns;
  },

  async adminCampaignAction(id: string, action: AdminAction, reason = ""): Promise<void> {
    if (demo) return demoApi.adminCampaignAction(getToken(), id, action, reason);
    if (action === "delete") await http.delete(`/admin/campaigns/${id}`);
    else if (action === "reject") await http.patch(`/admin/campaigns/${id}/reject`, { reason });
    else await http.patch(`/admin/campaigns/${id}/${action}`);
  },

  async adminUpdateCampaign(
    id: string,
    patch: Partial<CampaignInput & { isActive: boolean; isFeatured: boolean }>,
  ): Promise<Campaign> {
    if (demo) return demoApi.adminUpdateCampaign(getToken(), id, patch);
    return (await http.put(`/admin/campaigns/${id}`, patch)).data.campaign;
  },

  async adminUsers(): Promise<AdminUser[]> {
    if (demo) return demoApi.adminUsers(getToken());
    return (await http.get("/users")).data.users;
  },

  async adminSetUserActive(id: string, isActive: boolean): Promise<void> {
    if (demo) return demoApi.adminSetUserActive(getToken(), id, isActive);
    await http.patch(`/users/${id}/status`, { isActive });
  },

  async adminDeleteUser(id: string): Promise<void> {
    if (demo) return demoApi.adminDeleteUser(getToken(), id);
    await http.delete(`/users/${id}`);
  },
};

export default api;
