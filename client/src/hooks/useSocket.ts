import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { message, notification } from 'antd';
import userStore from '../store/users-store';
import { isDemoMode } from '../lib/config';
import {
  getDemoSimulationStatus,
  startDemoSimulation,
  stopDemoSimulation,
} from '../lib/demoSimulation';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinCampaign: (campaignId: string) => void;
  leaveCampaign: (campaignId: string) => void;
  emitDonation: (donationData: any) => void;
  emitCampaignUpdate: (campaignData: any) => void;
  requestLiveStats: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  getSimulationStatus: () => void;
}

const demo = isDemoMode();

export const useSocket = (): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(demo);
  const { currentUser } = userStore();

  useEffect(() => {
    if (demo) return;

    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        autoConnect: true,
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        setIsConnected(true);
        if (currentUser?._id) socket.emit('join-user-room', currentUser._id);
        if (currentUser?.isAdmin) socket.emit('join-admin-room');
      });

      socket.on('disconnect', () => setIsConnected(false));

      socket.on('campaign-updated', (data) => {
        window.dispatchEvent(new CustomEvent('campaign-updated', { detail: data }));
      });

      socket.on('new-campaign', (data) => {
        notification.success({
          message: 'New Campaign!',
          description: data.campaign?.title || 'Campaign created',
          placement: 'topRight',
        });
        window.dispatchEvent(new CustomEvent('new-campaign', { detail: data }));
      });

      socket.on('new-donation', (data) => {
        if (currentUser?.isAdmin) {
          notification.success({
            message: 'New Donation!',
            description: `$${data.amount} donated to ${data.campaignTitle}`,
            placement: 'topRight',
          });
        }
        window.dispatchEvent(new CustomEvent('new-donation', { detail: data }));
      });

      socket.on('live-stats-update', (data) => {
        window.dispatchEvent(new CustomEvent('live-stats-update', { detail: data }));
      });

      socket.on('user-status-update', (data) => {
        window.dispatchEvent(new CustomEvent('user-status-update', { detail: data }));
      });

      socket.on('account-status-changed', (data) => {
        if (data.isActive) message.success(data.message);
        else message.error(data.message);
      });

      socket.on('connect_error', () => setIsConnected(false));
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [currentUser]);

  if (demo) {
    return {
      socket: null,
      isConnected: true,
      joinCampaign: () => {},
      leaveCampaign: () => {},
      emitDonation: () => {},
      emitCampaignUpdate: () => {},
      requestLiveStats: () => {
        window.dispatchEvent(
          new CustomEvent('live-stats-update', {
            detail: {
              totalCampaigns: 3,
              totalDonations: 42,
              totalAmountRaised: 12450,
              activeCampaigns: 3,
              averageDonation: 75,
            },
          }),
        );
      },
      startSimulation: () => startDemoSimulation(),
      stopSimulation: () => stopDemoSimulation(),
      getSimulationStatus: () => {
        console.log('Demo simulation status:', getDemoSimulationStatus());
      },
    };
  }

  const joinCampaign = (campaignId: string) => {
    socketRef.current?.emit('join-campaign', campaignId);
  };

  const leaveCampaign = (campaignId: string) => {
    socketRef.current?.emit('leave-campaign', campaignId);
  };

  const emitDonation = (donationData: any) => {
    socketRef.current?.emit('donation-made', donationData);
  };

  const emitCampaignUpdate = (campaignData: any) => {
    socketRef.current?.emit('campaign-status-changed', campaignData);
  };

  const requestLiveStats = () => {
    socketRef.current?.emit('request-live-stats');
  };

  const startSimulation = () => {
    socketRef.current?.emit('start-simulation');
  };

  const stopSimulation = () => {
    socketRef.current?.emit('stop-simulation');
  };

  const getSimulationStatus = () => {
    socketRef.current?.emit('get-simulation-status');
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinCampaign,
    leaveCampaign,
    emitDonation,
    emitCampaignUpdate,
    requestLiveStats,
    startSimulation,
    stopSimulation,
    getSimulationStatus,
  };
};

export default useSocket;
