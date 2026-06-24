import axios from 'axios';
import type { Campaign } from '../interfaces/index';
import { isDemoMode } from '../lib/config';
import { demoDonate, demoGetCampaignById, demoGetCampaigns } from '../lib/demoStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const campaignService = {
  // Get all active campaigns for public view
  getAllCampaigns: async (): Promise<Campaign[]> => {
    if (isDemoMode()) return demoGetCampaigns();
    try {
      const response = await apiClient.get('/campaigns');
      return response.data.campaigns || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  // Get all campaigns for admin management
  getAdminCampaigns: async (): Promise<Campaign[]> => {
    try {
      const response = await apiClient.get('/admin/campaigns');
      return response.data.campaigns || [];
    } catch (error) {
      console.error('Error fetching admin campaigns:', error);
      throw error;
    }
  },

  // Get single campaign by ID
  getCampaignById: async (id: string): Promise<Campaign> => {
    if (isDemoMode()) {
      const campaign = demoGetCampaignById(id);
      if (!campaign) throw new Error('Campaign not found');
      return campaign;
    }
    try {
      const response = await apiClient.get(`/campaigns/${id}`);
      return response.data.campaign;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  // Create new campaign (admin only)
  createCampaign: async (campaignData: Omit<Campaign, '_id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> => {
    try {
      const response = await apiClient.post('/admin/campaigns', campaignData);
      return response.data.campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  // Update campaign (admin only)
  updateCampaign: async (id: string, campaignData: Partial<Campaign>): Promise<Campaign> => {
    try {
      const response = await apiClient.put(`/admin/campaigns/${id}`, campaignData);
      return response.data.campaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  },

  // Delete campaign (admin only)
  deleteCampaign: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/admin/campaigns/${id}`);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  },

  // Donate to campaign
  donateToCampaign: async (campaignId: string, amount: number): Promise<any> => {
    if (isDemoMode()) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return demoDonate({
        campaignId,
        amount,
        isAnonymous: false,
        paymentMethod: 'credit_card',
        donor: { id: user._id, name: user.name, email: user.email },
      });
    }
    try {
      const response = await apiClient.post(`/campaigns/${campaignId}/donate`, { amount });
      return response.data;
    } catch (error) {
      console.error('Error making donation:', error);
      throw error;
    }
  },

  // Admin-specific actions
  approveCampaign: async (id: string): Promise<Campaign> => {
    try {
      const response = await apiClient.patch(`/admin/campaigns/${id}/approve`);
      return response.data.campaign;
    } catch (error) {
      console.error('Error approving campaign:', error);
      throw error;
    }
  },

  rejectCampaign: async (id: string): Promise<Campaign> => {
    try {
      const response = await apiClient.patch(`/admin/campaigns/${id}/reject`);
      return response.data.campaign;
    } catch (error) {
      console.error('Error rejecting campaign:', error);
      throw error;
    }
  },

  toggleFeatured: async (id: string): Promise<Campaign> => {
    try {
      const response = await apiClient.patch(`/admin/campaigns/${id}/feature`);
      return response.data.campaign;
    } catch (error) {
      console.error('Error toggling featured status:', error);
      throw error;
    }
  },
};

export default campaignService;
