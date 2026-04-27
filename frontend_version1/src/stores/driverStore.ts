import { create } from 'zustand';
import { Driver } from '../types';

interface DriverStore {
  drivers: Driver[];
  selectedDriverId: string | null;
  feedbacks: any[];
  setDrivers: (d: Driver[]) => void;
  addDriver: (d: Driver) => void;
  updateDriver: (id: string, patch: Partial<Driver>) => void;
  removeDriver: (id: string) => void;
  selectDriver: (id: string) => void;
  setSelectedDriver: (id: string) => void; // Alias for selectDriver
  getAvailableDrivers: () => Driver[];
  addFeedback: (driverId: string, note: string) => void;
}

export const useDriverStore = create<DriverStore>((set, get) => ({
  drivers: [],
  selectedDriverId: null,
  feedbacks: [],

  setDrivers: (drivers) => set({ drivers: Array.isArray(drivers) ? drivers : [] }),
  
  addDriver: (driver) => set((s) => ({ drivers: [driver, ...s.drivers] })),
  
  updateDriver: (id, patch) => set((s) => ({
    drivers: s.drivers.map(d => d.id === id ? { ...d, ...patch } : d)
  })),
  
  removeDriver: (id) => set((s) => ({
    drivers: s.drivers.filter(d => d.id !== id)
  })),
  
  selectDriver: (id) => set({ selectedDriverId: id }),
  setSelectedDriver: (id) => set({ selectedDriverId: id }),
  
  getAvailableDrivers: () => {
    const { drivers } = get();
    return Array.isArray(drivers) ? drivers.filter(d => d.status === 'available') : [];
  },

  addFeedback: (driverId, note) => set((s) => ({
    feedbacks: [{ driverId, note, timestamp: new Date().toISOString() }, ...s.feedbacks]
  }))
}));
