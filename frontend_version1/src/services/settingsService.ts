import { Settings } from '../types';

const API_BASE = (((import.meta as ImportMeta & { env: Record<string, string | undefined> }).env.VITE_API_BASE_URL) ?? 'http://localhost:8000').replace(/\/$/, '');

export const defaultSettings: Settings = {
  riskThreshold: 0.65,
  weights: { time: 30, cost: 20, risk: 35, carbon: 15 },
  apiMode: 'live',
  demoAnimationSpeed: 1,
  xaiLevel: 'detailed',
  forecastHorizonMinutes: 30,
  autoPreemptEnabled: false,
  vehicleFuelTypes: [
    { vehicleId: 'driver_rajan', fuelType: 'petrol', co2PerKm: 0.21 },
    { vehicleId: 'driver_arjun', fuelType: 'electric', co2PerKm: 0.04 },
    { vehicleId: 'driver_priya', fuelType: 'electric', co2PerKm: 0.04 },
    { vehicleId: 'driver_irfan', fuelType: 'diesel', co2PerKm: 0.27 },
    { vehicleId: 'driver_kavitha', fuelType: 'cng', co2PerKm: 0.14 },
  ],
};

export async function fetchSettings(): Promise<Settings | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings`);
    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as Partial<Settings>;
    if (!payload || Object.keys(payload).length === 0) {
      return null;
    }

    return {
      ...defaultSettings,
      ...payload,
      weights: {
        ...defaultSettings.weights,
        ...(payload.weights ?? {}),
      },
      vehicleFuelTypes: payload.vehicleFuelTypes?.length ? payload.vehicleFuelTypes : defaultSettings.vehicleFuelTypes,
    };
  } catch {
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return response.ok;
  } catch {
    return false;
  }
}
