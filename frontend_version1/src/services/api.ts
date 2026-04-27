import axios from 'axios';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — log every call
api.interceptors.request.use((req: any) => {
  req.meta = { startTime: Date.now() };
  return req;
});

// Response interceptor — log timing, handle errors
api.interceptors.response.use(
  (res: any) => {
    const ms = Date.now() - res.config.meta.startTime;
    console.log(`[API] ${res.config.method?.toUpperCase()} ${res.config.url} | ${ms}ms`);
    return res;
  },
  (err) => {
    console.error(`[API] Error: ${err.config?.url} | ${err.message}`);
    return Promise.reject(err);
  }
);

// Health — short timeout, never blocks
const healthApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000
});

// --- SYSTEM ---
export const fetchHealth = () => 
  healthApi.get('/health/').then(r => r.data).catch(() => ({ status: 'unknown' }));

// --- VEHICLES ---
export const fetchVehicles = () => 
  api.get('/vehicles/').then(r => r.data);

export const createVehicle = (data: any) =>
  api.post('/vehicles/', data).then(r => r.data);

export const assignDriver = (vehicleId: string, driverId: string) =>
  api.post(`/vehicles/${vehicleId}/assign`, { driverId }).then(r => r.data);

export const lockVehicle = (vehicleId: string, body: { lockedBy: string; reason: string }) =>
  api.post(`/vehicles/${vehicleId}/lock`, body).then(r => r.data);

export const unlockVehicle = (vehicleId: string) =>
  api.post(`/vehicles/${vehicleId}/unlock`).then(r => r.data);

export const setPriority = (vehicleId: string, priority: string) =>
  api.post(`/vehicles/${vehicleId}/priority`, { priority }).then(r => r.data);

// --- DRIVERS ---
export const fetchDrivers = () => 
  api.get('/drivers/').then(r => r.data);

export const createDriver = (data: any) =>
  api.post('/drivers/', data).then(r => r.data);

export const updateDriverStatus = (driverId: string, status: string) =>
  api.post(`/drivers/${driverId}/status`, { status }).then(r => r.data);

// --- ROUTES ---
export const fetchActiveRoutes = () => 
  api.get('/routes/active').then(r => r.data);

export const createRoute = (data: any) =>
  api.post('/routes/', data).then(r => r.data);

export const rerouteVehicle = (vehicleId: string, reason?: string) =>
  api.post('/routes/reroute', { vehicleId, reason }).then(r => r.data);

export const rerouteAll = (reason?: string) =>
  api.post('/routes/reroute/all', { reason }).then(r => r.data);

// --- DISRUPTIONS ---
export const fetchDisruptions = () => 
  api.get('/disruptions/').then(r => r.data);

export const dismissDisruption = (id: string) =>
  api.post(`/disruptions/${id}/dismiss`).then(r => r.data);

export const resolveDisruption = (id: string) =>
  api.post(`/disruptions/${id}/resolve`).then(r => r.data);

// --- ANALYTICS (/api/v1 prefix) ---
export const fetchCO2Analytics = () =>
  api.get('/api/v1/analytics/co2').then(r => r.data);

export const fetchRiskAnalytics = () =>
  api.get('/api/v1/analytics/risk').then(r => r.data);

export const fetchDecisionAnalytics = () =>
  api.get('/api/v1/analytics/decisions').then(r => r.data);

export const fetchFleetAnalytics = () =>
  api.get('/api/v1/analytics/fleet').then(r => r.data);

// --- DRIVER REPORTS (/api/v1 prefix) ---
export const fetchDriverReports = () =>
  api.get('/api/v1/driver-reports/').then(r => r.data);

export const postDriverReport = (body: object) =>
  api.post('/api/v1/driver-reports/', body).then(r => r.data);

// --- PUBLIC TRACKING ---
export const fetchTrackingInfo = (token: string) =>
  api.get(`/api/v1/delivery/${token}/live`).then(r => r.data);

export default api;
