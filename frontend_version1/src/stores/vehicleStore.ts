import { create } from 'zustand';
import { Vehicle, DriverFeedback } from '../types';

interface VehicleStore {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  feedbacks: DriverFeedback[];
  setVehicles: (vehicles: Vehicle[]) => void;
  setSelectedVehicle: (id: string | null) => void;
  selectedVehicle: () => Vehicle | null;
  updateVehicle: (update: Partial<Vehicle> & { id: string }) => void;
  addFeedback: (vehicleId: string, note: string) => void;
  
  // Production methods
  lockVehicle: (id: string, lockedBy: string) => void;
  unlockVehicle: (id: string) => void;
  setPriority: (id: string, priority: 'critical' | 'normal' | 'low') => void;
  assignDriver: (vehicleId: string, driverId: string) => void;
}

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  selectedVehicleId: null,
  feedbacks: [],

  setVehicles: (vehicles) => {
    const normalizePosition = (v: any) => ({
      ...v,
      currentPosition: {
        lat: v.currentPosition?.lat ?? v.lat ?? v.latitude ?? 12.9716,
        lng: v.currentPosition?.lng ?? v.currentPosition?.lon ?? v.lng ?? v.longitude ?? 77.5946
      }
    });

    const validVehicles = Array.isArray(vehicles) ? vehicles.map(normalizePosition) : [];
    set({ vehicles: validVehicles });
  },

  setSelectedVehicle: (id) => set({ selectedVehicleId: id }),

  selectedVehicle: () => {
    const { vehicles, selectedVehicleId } = get();
    return vehicles.find(v => v.id === selectedVehicleId) ?? null;
  },

  updateVehicle: (update) =>
    set((s) => ({
      vehicles: s.vehicles.map(v => v.id === update.id ? { ...v, ...update } : v),
    })),

  addFeedback: (vehicleId, note) =>
    set((s) => ({
      feedbacks: [{ driverId: vehicleId, note, timestamp: new Date().toISOString() }, ...s.feedbacks],
    })),

  lockVehicle: (id, lockedBy) => 
    get().updateVehicle({ id, isLocked: true, lockedBy, lockedAt: new Date().toISOString() } as any),

  unlockVehicle: (id) => 
    get().updateVehicle({ id, isLocked: false, lockedBy: null, lockedAt: null } as any),

  setPriority: (id, priority) => 
    get().updateVehicle({ id, priority } as any),

  assignDriver: (vehicleId, driverId) => 
    get().updateVehicle({ id: vehicleId, currentDriverId: driverId } as any),
}));
