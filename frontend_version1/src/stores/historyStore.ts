import { create } from 'zustand';
import { DeliveryRecord } from '../types';
import { mockDeliveries } from '../services/mockData';
import { loadHistoryDeliveries } from '../services/analyticsService';

interface HistoryFilters {
  driverId: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  reroutedOnly: boolean;
  predictedOnly: boolean;
}

interface HistoryStore {
  deliveries: DeliveryRecord[];
  filters: HistoryFilters;
  selectedDelivery: DeliveryRecord | null;
  setDeliveries: (d: DeliveryRecord[]) => void;
  fetchDeliveries: () => Promise<void>;
  setFilters: (f: Partial<HistoryFilters>) => void;
  setSelectedDelivery: (d: DeliveryRecord | null) => void;
  filteredDeliveries: () => DeliveryRecord[];
  exportCSV: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  deliveries: mockDeliveries,
  filters: { driverId: null, dateStart: null, dateEnd: null, reroutedOnly: false, predictedOnly: false },
  selectedDelivery: null,

  setDeliveries: (d) => set({ deliveries: d }),
  fetchDeliveries: async () => {
    const liveDeliveries = await loadHistoryDeliveries();
    set({ deliveries: liveDeliveries.length ? liveDeliveries : mockDeliveries });
  },

  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setSelectedDelivery: (d) => set({ selectedDelivery: d }),

  filteredDeliveries: () => {
    const { deliveries, filters } = get();
    return deliveries.filter(d => {
      if (filters.driverId && d.driverId !== filters.driverId) return false;
      if (filters.reroutedOnly && !d.wasRerouted) return false;
      if (filters.predictedOnly && !d.predictedDisruption) return false;
      return true;
    });
  },

  exportCSV: () => {
    const rows = get().filteredDeliveries();
    const header = 'Delivery ID,Driver,Origin,Destination,Date,Original ETA,Actual ETA,Risk Before,Risk After,Rerouted,Predicted,Accepted,Carbon Delta,XAI Summary';
    const lines = rows.map(r =>
      `${r.deliveryId},${r.driverName},${r.origin},${r.destination},${r.dateTime},${r.originalEtaMinutes},${r.actualEtaMinutes},${r.riskScoreBefore},${r.riskScoreAfter},${r.wasRerouted},${r.predictedDisruption},${r.driverAcceptedReroute},"${r.carbonDeltaKg}","${r.xaiSummary.replace(/"/g, '""')}"`
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'resilientroute_history.csv';
    a.click(); URL.revokeObjectURL(url);
  },
}));
