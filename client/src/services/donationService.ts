import axios from 'axios';
import type { Donation, PaymentIntent } from '../interfaces/index';
import { isDemoMode } from '../lib/config';
import {
  demoDonate,
  demoGetAllDonations,
  demoGetDonationStats,
  demoGetUserDonations,
} from '../lib/demoStore';

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

export const donationService = {
  // Get user's donation history
  getUserDonations: async (): Promise<Donation[]> => {
    if (isDemoMode()) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return demoGetUserDonations(user._id || '');
    }
    try {
      const response = await apiClient.get('/donations/my-donations');
      return response.data.donations || [];
    } catch (error) {
      console.error('Error fetching user donations:', error);
      throw error;
    }
  },

  // Get all donations (admin only)
  getAllDonations: async (): Promise<Donation[]> => {
    if (isDemoMode()) return demoGetAllDonations();
    try {
      const response = await apiClient.get('/admin/donations');
      return response.data.donations || [];
    } catch (error) {
      console.error('Error fetching all donations:', error);
      throw error;
    }
  },

  // Get donations for a specific campaign
  getCampaignDonations: async (campaignId: string): Promise<Donation[]> => {
    try {
      const response = await apiClient.get(`/donations/campaign/${campaignId}`);
      return response.data.donations || [];
    } catch (error) {
      console.error('Error fetching campaign donations:', error);
      throw error;
    }
  },

  // Create payment intent for donation
  createPaymentIntent: async (
    campaignId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<PaymentIntent> => {
    if (isDemoMode()) {
      return {
        id: `pi_demo_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency,
        status: 'succeeded',
        clientSecret: 'demo',
      };
    }
    try {
      const response = await apiClient.post('/donations/create-payment-intent', {
        campaignId,
        amount: Math.round(amount * 100), // Convert to cents
        currency,
      });
      return response.data.paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  // Process donation
  processDonation: async (donationData: {
    campaignId: string;
    amount: number;
    message?: string;
    isAnonymous: boolean;
    paymentMethod: string;
    paymentIntentId: string;
  }): Promise<Donation> => {
    if (isDemoMode()) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return demoDonate({
        campaignId: donationData.campaignId,
        amount: donationData.amount,
        message: donationData.message,
        isAnonymous: donationData.isAnonymous,
        paymentMethod: donationData.paymentMethod,
        donor: { id: user._id, name: user.name, email: user.email },
      });
    }
    try {
      const response = await apiClient.post('/donations/process', donationData);
      return response.data.donation;
    } catch (error) {
      console.error('Error processing donation:', error);
      throw error;
    }
  },

  // Get donation by ID
  getDonationById: async (donationId: string): Promise<Donation> => {
    try {
      const response = await apiClient.get(`/donations/${donationId}`);
      return response.data.donation;
    } catch (error) {
      console.error('Error fetching donation:', error);
      throw error;
    }
  },

  // Download receipt
  downloadReceipt: async (donationId: string): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/donations/${donationId}/receipt`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw error;
    }
  },

  // Request refund (admin only)
  requestRefund: async (
    donationId: string,
    reason: string
  ): Promise<Donation> => {
    try {
      const response = await apiClient.post(`/admin/donations/${donationId}/refund`, {
        reason,
      });
      return response.data.donation;
    } catch (error) {
      console.error('Error requesting refund:', error);
      throw error;
    }
  },

  // Get donation statistics
  getDonationStats: async (): Promise<{
    totalDonations: number;
    totalAmount: number;
    averageDonation: number;
    monthlyTotal: number;
    topCampaigns: Array<{
      campaignId: string;
      campaignTitle: string;
      totalAmount: number;
      donationCount: number;
    }>;
  }> => {
    if (isDemoMode()) return demoGetDonationStats();
    try {
      const response = await apiClient.get('/donations/stats');
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching donation stats:', error);
      throw error;
    }
  },

  // Verify payment status
  verifyPayment: async (paymentIntentId: string): Promise<{
    status: string;
    donation?: Donation;
  }> => {
    try {
      const response = await apiClient.get(`/donations/verify-payment/${paymentIntentId}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  // Send thank you email
  sendThankYouEmail: async (donationId: string): Promise<void> => {
    try {
      await apiClient.post(`/donations/${donationId}/send-thank-you`);
    } catch (error) {
      console.error('Error sending thank you email:', error);
      throw error;
    }
  },

  // Get recurring donation settings
  getRecurringDonations: async (): Promise<Array<{
    id: string;
    campaignId: string;
    campaignTitle: string;
    amount: number;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextDonationDate: Date;
    isActive: boolean;
  }>> => {
    try {
      const response = await apiClient.get('/donations/recurring');
      return response.data.recurringDonations || [];
    } catch (error) {
      console.error('Error fetching recurring donations:', error);
      throw error;
    }
  },

  // Create recurring donation
  createRecurringDonation: async (data: {
    campaignId: string;
    amount: number;
    frequency: string;
    paymentMethodId: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/donations/recurring', data);
      return response.data;
    } catch (error) {
      console.error('Error creating recurring donation:', error);
      throw error;
    }
  },

  // Cancel recurring donation
  cancelRecurringDonation: async (recurringId: string): Promise<void> => {
    try {
      await apiClient.delete(`/donations/recurring/${recurringId}`);
    } catch (error) {
      console.error('Error canceling recurring donation:', error);
      throw error;
    }
  },
};

export default donationService;
