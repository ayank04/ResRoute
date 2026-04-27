import { create } from 'zustand';

interface HealthStore {
  status: 'ok' | 'degraded' | 'critical' | 'unknown';
  connectionStatus: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
  services: Record<string, { state: string, failures: number }>;
  aiModules: Record<string, string>;
  activeRoutes: number;
  uptimeSeconds: number;
  setHealth: (h: any) => void;
  setConnectionStatus: (s: 'LIVE' | 'RECONNECTING' | 'OFFLINE') => void;
  updateBreaker: (b: { service: string, state: string, failures: number }) => void;
}

export const useHealthStore = create<HealthStore>((set) => ({
  status: 'unknown',
  connectionStatus: 'OFFLINE',
  services: {},
  aiModules: {},
  activeRoutes: 0,
  uptimeSeconds: 0,

  setHealth: (h) => set((s) => ({
    status: h.status || 'unknown',
    services: h.services || s.services,
    aiModules: h.aiModules || s.aiModules,
    activeRoutes: h.active_routes || s.activeRoutes,
    uptimeSeconds: h.uptime_seconds || s.uptimeSeconds,
  })),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  updateBreaker: (b) => set((s) => ({
    services: {
      ...s.services,
      [b.service]: { state: b.state, failures: b.failures }
    }
  }))
}));
