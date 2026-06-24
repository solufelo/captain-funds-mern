import axios from 'axios';
import { isDemoMode } from '../lib/config';
import {
  getDemoSimulationStatus,
  startDemoSimulation,
  stopDemoSimulation,
} from '../lib/demoSimulation';
import { ensureDemoSeeded } from '../lib/demoStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const simulationService = {
  async getStatus() {
    if (isDemoMode()) return getDemoSimulationStatus();
    const response = await apiClient.get('/simulation/status');
    return response.data;
  },

  async startSimulation() {
    if (isDemoMode()) {
      startDemoSimulation();
      return { message: 'Demo simulation started' };
    }
    const response = await apiClient.post('/simulation/start');
    return response.data;
  },

  async stopSimulation() {
    if (isDemoMode()) {
      stopDemoSimulation();
      return { message: 'Demo simulation stopped' };
    }
    const response = await apiClient.post('/simulation/stop');
    return response.data;
  },

  async seedDatabase() {
    if (isDemoMode()) {
      await ensureDemoSeeded();
      return { message: 'Demo data ready' };
    }
    const response = await apiClient.post('/simulation/seed');
    return response.data;
  },

  async clearDatabase() {
    if (isDemoMode()) {
      localStorage.removeItem('cf_campaigns');
      localStorage.removeItem('cf_donations');
      await ensureDemoSeeded();
      return { message: 'Demo data reset' };
    }
    const response = await apiClient.delete('/simulation/clear');
    return response.data;
  },

  async getAnalytics() {
    if (isDemoMode()) {
      return { mode: 'demo', message: 'Analytics available in full MERN deploy' };
    }
    const response = await apiClient.get('/simulation/analytics');
    return response.data;
  },
};

export default simulationService;
