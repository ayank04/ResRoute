import { create } from 'zustand';
import { fetchFleetAnalytics } from '../services/api';

interface AnalyticsStore {
  analyticsData: any;
  co2Summary: any;
  riskHistory: Record<string, number[]>;
  decisions: any[];
  dateRange: { start: string, end: string };
  hasFailed: boolean;
  lastAttempt: number;
  fetchAnalytics: () => Promise<void>;
  setDateRange: (range: { start: string, end: string }) => void;
  incrementReroutes: () => void;
  updateCarbonSaved: (amount: number) => void;
}

let fetchAttempted = false;

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  analyticsData: {
    avgFleetRisk: 0,
    totalReroutesWeek: 0,
    onTimeRate: 0,
    activeDrivers: 0,
    carbonSavedMonthKg: 0,
    predictiveAccuracy: 0,
    trustIndex: 0,
    riskTrend: [],
    reroutesPerDriver: [],
    disruptionDistribution: [],
    carbonHeatmapData: []
  },
  co2Summary: { daily: 0, weekly: 0, monthly: 0, saved: 0 },
  riskHistory: {},
  decisions: [],
  dateRange: { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
  hasFailed: false,
  lastAttempt: 0,

  setDateRange: (range) => set({ dateRange: range }),

  incrementReroutes: () => set((s) => ({
    analyticsData: {
      ...s.analyticsData,
      totalReroutesWeek: (s.analyticsData.totalReroutesWeek || 0) + 1
    }
  })),

  updateCarbonSaved: (amount) => set((s) => ({
    analyticsData: {
      ...s.analyticsData,
      carbonSavedMonthKg: (s.analyticsData.carbonSavedMonthKg || 0) + amount
    }
  })),

  fetchAnalytics: async () => {
    const { hasFailed, lastAttempt } = get();
    const now = Date.now();
    
    if (hasFailed && now - lastAttempt < 60000) {
      return;
    }

    if (fetchAttempted && !hasFailed) return;
    fetchAttempted = true;

    set({ lastAttempt: now });

    try {
      const data = await fetchFleetAnalytics();
      set({ 
        analyticsData: data,
        co2Summary: data.co2Summary || get().co2Summary,
        hasFailed: false 
      });
    } catch (e) {
      console.warn('[Analytics] Fetch failed — using defaults');
      set({ 
        hasFailed: true,
        // Keep existing analyticsData defaults
      });
    }
  }
}));
