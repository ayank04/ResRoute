import { create } from 'zustand';
import { Disruption } from '../types';

interface DisruptionStore {
  disruptions: Disruption[];
  driverReports: any[];
  setDisruptions: (disruptions: Disruption[]) => void;
  addDisruption: (d: Disruption) => void;
  addDriverReport: (report: any) => void;
  removeDisruption: (id: string) => void;
  clearAll: () => void;
}

export const useDisruptionStore = create<DisruptionStore>((set) => ({
  disruptions: [],
  driverReports: [],
  setDisruptions: (disruptions) => set({ disruptions: Array.isArray(disruptions) ? disruptions : [] }),
  addDisruption: (d) => set((s) => ({ disruptions: [d, ...s.disruptions] })),
  addDriverReport: (report) => set((s) => ({ driverReports: [report, ...s.driverReports] })),
  removeDisruption: (id) => set((s) => ({ disruptions: s.disruptions.filter(d => d.id !== id) })),
  clearAll: () => set({ disruptions: [], driverReports: [] }),
}));

export const getActiveAlertCount = (disruptions: Disruption[]) => {
  if (!Array.isArray(disruptions)) return 0;
  return disruptions.filter(d => 
    d.active && (d.severity === 'HIGH' || d.severity === 'MEDIUM') // Adjusted to match RiskLevel types
  ).length;
};
