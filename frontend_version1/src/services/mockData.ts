import { Driver, Route, RouteSegment, DeliveryRecord, Disruption, AnalyticsData } from '../types';

// FALLBACK: Keep this file as the single source for offline/demo fallback data.

// ── Helpers ──────────────────────────────────────────────────────────────────
const now = new Date();
const ts = (offsetMin = 0) => new Date(now.getTime() + offsetMin * 60000).toISOString();

// ── Drivers ───────────────────────────────────────────────────────────────────
// FALLBACK: Driver roster used when live bootstrap data is unavailable.
export const mockDrivers: Driver[] = [
  {
    id: 'driver_rajan', name: 'Rajan Kumar', status: 'EN_ROUTE',
    currentPosition: { lat: 12.9352, lng: 77.6245 },
    activeRouteId: 'route_1', vehicleType: 'car',
    avatar: 'RK', joinDate: '2022-03-15',
    totalDeliveries: 1243, onTimeRate: 94, ecoScore: 88,
    fatigueRisk: 'LOW',
    badges: ['🏆 Top Driver', '🌱 Eco Champion', '⚡ Fast Responder'],
    phone: '9876543210',
  },
  {
    id: 'driver_arjun', name: 'Arjun Sharma', status: 'EN_ROUTE',
    currentPosition: { lat: 12.9698, lng: 77.7500 },
    activeRouteId: 'route_2', vehicleType: 'bike',
    avatar: 'AS', joinDate: '2021-07-22',
    totalDeliveries: 2108, onTimeRate: 89, ecoScore: 92,
    fatigueRisk: 'MEDIUM',
    badges: ['🚀 Speed Demon', '🌱 Eco Champion'],
    phone: '9876543210',
  },
  {
    id: 'driver_priya', name: 'Priya Nair', status: 'IDLE',
    currentPosition: { lat: 12.9279, lng: 77.6271 },
    activeRouteId: null, vehicleType: 'bike',
    avatar: 'PN', joinDate: '2023-01-10',
    totalDeliveries: 567, onTimeRate: 97, ecoScore: 95,
    fatigueRisk: 'LOW',
    badges: ['⭐ Rising Star', '🎯 Precision Driver'],
    phone: '9876543210',
  },
  {
    id: 'driver_irfan', name: 'Mohammed Irfan', status: 'EN_ROUTE',
    currentPosition: { lat: 12.8456, lng: 77.6603 },
    activeRouteId: 'route_3', vehicleType: 'truck',
    avatar: 'MI', joinDate: '2020-11-05',
    totalDeliveries: 3421, onTimeRate: 82, ecoScore: 71,
    fatigueRisk: 'HIGH',
    badges: ['💪 Road Veteran', '📦 Heavy Hauler'],
    phone: '9876543210',
  },
  {
    id: 'driver_kavitha', name: 'Kavitha Reddy', status: 'COMPLETED',
    currentPosition: { lat: 12.9716, lng: 77.5946 },
    activeRouteId: null, vehicleType: 'car',
    avatar: 'KR', joinDate: '2022-09-18',
    totalDeliveries: 891, onTimeRate: 91, ecoScore: 85,
    fatigueRisk: 'LOW',
    badges: ['🏅 Reliable', '🌿 Green Mover'],
    phone: '9876543210',
  },
];

// ── Segment builder ────────────────────────────────────────────────────────────
const seg = (
  id: string, start: { lat: number; lng: number }, end: { lat: number; lng: number },
  risk: 'LOW' | 'MEDIUM' | 'HIGH', riskScore: number,
  distanceKm: number, durationMinutes: number, co2Kg: number
): RouteSegment => ({
  id, start, end,
  polyline: 'encoded_placeholder_' + id,
  decodedPath: [start, { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 }, end],
  riskLevel: risk, riskScore, distanceKm, durationMinutes, co2Kg,
});

// ── Routes ─────────────────────────────────────────────────────────────────────
// FALLBACK: Route dataset used by offline/demo mode.
export const mockRoutes: Route[] = [
  {
    id: 'route_1', driverId: 'driver_rajan',
    origin: 'Koramangala', destination: 'HSR Layout',
    originCoords: { lat: 12.9352, lng: 77.6245 },
    destinationCoords: { lat: 12.9116, lng: 77.6389 },
    segments: [
      seg('r1s1', { lat: 12.9352, lng: 77.6245 }, { lat: 12.9280, lng: 77.6290 }, 'LOW', 0.22, 1.2, 4, 0.18),
      seg('r1s2', { lat: 12.9280, lng: 77.6290 }, { lat: 12.9220, lng: 77.6330 }, 'LOW', 0.30, 1.5, 5, 0.22),
      seg('r1s3', { lat: 12.9220, lng: 77.6330 }, { lat: 12.9160, lng: 77.6360 }, 'MEDIUM', 0.55, 1.8, 8, 0.27),
      seg('r1s4', { lat: 12.9160, lng: 77.6360 }, { lat: 12.9116, lng: 77.6389 }, 'LOW', 0.28, 1.1, 4, 0.16),
    ],
    currentRiskScore: 35, etaMinutes: 28, distanceKm: 5.6, rerouteCount: 0,
    status: 'ACTIVE', createdAt: ts(-15), updatedAt: ts(-2), carbonSavedKg: 0,
  },
  {
    id: 'route_1_rerouted', driverId: 'driver_rajan',
    origin: 'Koramangala', destination: 'HSR Layout',
    originCoords: { lat: 12.9352, lng: 77.6245 },
    destinationCoords: { lat: 12.9116, lng: 77.6389 },
    segments: [
      seg('r1rs1', { lat: 12.9352, lng: 77.6245 }, { lat: 12.9400, lng: 77.6350 }, 'LOW', 0.20, 1.4, 4, 0.17),
      seg('r1rs2', { lat: 12.9400, lng: 77.6350 }, { lat: 12.9380, lng: 77.6450 }, 'LOW', 0.25, 1.6, 5, 0.19),
      seg('r1rs3', { lat: 12.9380, lng: 77.6450 }, { lat: 12.9250, lng: 77.6420 }, 'MEDIUM', 0.42, 2.0, 6, 0.24),
      seg('r1rs4', { lat: 12.9250, lng: 77.6420 }, { lat: 12.9116, lng: 77.6389 }, 'LOW', 0.22, 1.8, 5, 0.20),
    ],
    currentRiskScore: 41, etaMinutes: 20, distanceKm: 6.8, rerouteCount: 1,
    status: 'ACTIVE', createdAt: ts(-15), updatedAt: ts(), carbonSavedKg: 0.4,
  },
  {
    id: 'route_2', driverId: 'driver_arjun',
    origin: 'Whitefield', destination: 'Marathahalli',
    originCoords: { lat: 12.9698, lng: 77.7500 },
    destinationCoords: { lat: 12.9591, lng: 77.6974 },
    segments: [
      seg('r2s1', { lat: 12.9698, lng: 77.7500 }, { lat: 12.9680, lng: 77.7350 }, 'LOW', 0.18, 1.5, 5, 0.12),
      seg('r2s2', { lat: 12.9680, lng: 77.7350 }, { lat: 12.9640, lng: 77.7200 }, 'HIGH', 0.82, 2.2, 18, 0.31),
      seg('r2s3', { lat: 12.9640, lng: 77.7200 }, { lat: 12.9610, lng: 77.7100 }, 'HIGH', 0.76, 1.8, 14, 0.25),
      seg('r2s4', { lat: 12.9610, lng: 77.7100 }, { lat: 12.9591, lng: 77.6974 }, 'MEDIUM', 0.48, 1.2, 7, 0.17),
      seg('r2s5', { lat: 12.9591, lng: 77.6974 }, { lat: 12.9591, lng: 77.6974 }, 'LOW', 0.15, 0.3, 2, 0.04),
    ],
    currentRiskScore: 68, etaMinutes: 46, distanceKm: 7.0, rerouteCount: 1,
    status: 'ACTIVE', createdAt: ts(-30), updatedAt: ts(-5), carbonSavedKg: 0.2,
  },
  {
    id: 'route_3', driverId: 'driver_irfan',
    origin: 'Electronic City', destination: 'Bannerghatta',
    originCoords: { lat: 12.8456, lng: 77.6603 },
    destinationCoords: { lat: 12.8636, lng: 77.5988 },
    segments: [
      seg('r3s1', { lat: 12.8456, lng: 77.6603 }, { lat: 12.8500, lng: 77.6450 }, 'MEDIUM', 0.55, 2.5, 10, 0.52),
      seg('r3s2', { lat: 12.8500, lng: 77.6450 }, { lat: 12.8550, lng: 77.6300 }, 'LOW', 0.32, 2.0, 8, 0.42),
      seg('r3s3', { lat: 12.8550, lng: 77.6300 }, { lat: 12.8590, lng: 77.6150 }, 'MEDIUM', 0.50, 1.8, 9, 0.38),
      seg('r3s4', { lat: 12.8590, lng: 77.6150 }, { lat: 12.8636, lng: 77.5988 }, 'LOW', 0.28, 1.5, 7, 0.31),
    ],
    currentRiskScore: 52, etaMinutes: 34, distanceKm: 7.8, rerouteCount: 0,
    status: 'ACTIVE', createdAt: ts(-10), updatedAt: ts(-1), carbonSavedKg: 0,
  },
  {
    id: 'route_4', driverId: 'driver_kavitha',
    origin: 'MG Road', destination: 'Jayanagar',
    originCoords: { lat: 12.9716, lng: 77.5946 },
    destinationCoords: { lat: 12.9308, lng: 77.5838 },
    segments: [
      seg('r4s1', { lat: 12.9716, lng: 77.5946 }, { lat: 12.9600, lng: 77.5900 }, 'LOW', 0.20, 1.8, 6, 0.26),
      seg('r4s2', { lat: 12.9600, lng: 77.5900 }, { lat: 12.9480, lng: 77.5870 }, 'LOW', 0.25, 1.5, 5, 0.22),
      seg('r4s3', { lat: 12.9480, lng: 77.5870 }, { lat: 12.9308, lng: 77.5838 }, 'LOW', 0.22, 1.9, 6, 0.28),
    ],
    currentRiskScore: 22, etaMinutes: 17, distanceKm: 5.2, rerouteCount: 0,
    status: 'COMPLETED', createdAt: ts(-60), updatedAt: ts(-20), carbonSavedKg: 0.1,
  },
];

// ── Predictive reroute suggestion for Rajan ────────────────────────────────────
// FALLBACK: Demo predictive route sample.
export const predictiveRouteForRajan: Route = {
  id: 'route_1_predictive', driverId: 'driver_rajan',
  origin: 'Koramangala', destination: 'HSR Layout via Indiranagar',
  originCoords: { lat: 12.9352, lng: 77.6245 },
  destinationCoords: { lat: 12.9116, lng: 77.6389 },
  segments: [
    seg('r1ps1', { lat: 12.9352, lng: 77.6245 }, { lat: 12.9716, lng: 77.6412 }, 'LOW', 0.18, 2.0, 6, 0.20),
    seg('r1ps2', { lat: 12.9716, lng: 77.6412 }, { lat: 12.9650, lng: 77.6500 }, 'LOW', 0.22, 1.5, 5, 0.15),
    seg('r1ps3', { lat: 12.9650, lng: 77.6500 }, { lat: 12.9400, lng: 77.6480 }, 'MEDIUM', 0.38, 2.5, 7, 0.25),
    seg('r1ps4', { lat: 12.9400, lng: 77.6480 }, { lat: 12.9116, lng: 77.6389 }, 'LOW', 0.20, 2.0, 6, 0.18),
  ],
  currentRiskScore: 41, etaMinutes: 20, distanceKm: 8.0, rerouteCount: 0,
  status: 'ACTIVE', createdAt: ts(), updatedAt: ts(), carbonSavedKg: 0.4,
};

// ── Disruptions ────────────────────────────────────────────────────────────────
// FALLBACK: Disruption stream used when live analytics endpoint is unavailable.
export const mockDisruptions: Disruption[] = [
  { id: 'd1', type: 'ACCIDENT', severity: 'HIGH', location: { lat: 12.9172, lng: 77.6228 }, radiusMeters: 500, estimatedDelayMinutes: 18, active: true, createdAt: ts(-5), expiresAt: ts(55), isPredicted: false },
  { id: 'd2', type: 'TRAFFIC', severity: 'HIGH', location: { lat: 12.9177, lng: 77.6408 }, radiusMeters: 800, estimatedDelayMinutes: 22, active: true, createdAt: ts(-10), expiresAt: ts(50), isPredicted: false },
  { id: 'd3', type: 'WEATHER', severity: 'MEDIUM', location: { lat: 12.9698, lng: 77.7500 }, radiusMeters: 1200, estimatedDelayMinutes: 10, active: true, createdAt: ts(-20), expiresAt: ts(40), isPredicted: false },
  { id: 'd4', type: 'TRAFFIC', severity: 'MEDIUM', location: { lat: 12.8456, lng: 77.6603 }, radiusMeters: 600, estimatedDelayMinutes: 14, active: true, createdAt: ts(-8), expiresAt: ts(52), isPredicted: false },
  { id: 'd5', type: 'ACCIDENT', severity: 'HIGH', location: { lat: 12.9308, lng: 77.6830 }, radiusMeters: 400, estimatedDelayMinutes: 25, active: true, createdAt: ts(-3), expiresAt: ts(57), isPredicted: false },
  // Predicted disruptions
  { id: 'd6', type: 'TRAFFIC', severity: 'HIGH', location: { lat: 12.9177, lng: 77.6408 }, radiusMeters: 1000, estimatedDelayMinutes: 25, active: false, createdAt: ts(25), expiresAt: ts(85), isPredicted: true },
  { id: 'd7', type: 'WEATHER', severity: 'MEDIUM', location: { lat: 12.9698, lng: 77.7200 }, radiusMeters: 1500, estimatedDelayMinutes: 12, active: false, createdAt: ts(15), expiresAt: ts(75), isPredicted: true },
  { id: 'd8', type: 'ACCIDENT', severity: 'HIGH', location: { lat: 12.8550, lng: 77.6200 }, radiusMeters: 300, estimatedDelayMinutes: 20, active: false, createdAt: ts(20), expiresAt: ts(80), isPredicted: true },
  { id: 'd9', type: 'TRAFFIC', severity: 'LOW', location: { lat: 12.9716, lng: 77.5946 }, radiusMeters: 700, estimatedDelayMinutes: 8, active: false, createdAt: ts(30), expiresAt: ts(90), isPredicted: true },
  // Future disruption (20 min from now)
  { id: 'd10', type: 'TRAFFIC', severity: 'HIGH', location: { lat: 12.9177, lng: 77.6408 }, radiusMeters: 900, estimatedDelayMinutes: 20, active: false, createdAt: ts(20), expiresAt: ts(80), isPredicted: true },
  { id: 'd11', type: 'WEATHER', severity: 'HIGH', location: { lat: 12.9350, lng: 77.6900 }, radiusMeters: 2000, estimatedDelayMinutes: 30, active: true, createdAt: ts(-15), expiresAt: ts(45), isPredicted: false },
  { id: 'd12', type: 'ACCIDENT', severity: 'MEDIUM', location: { lat: 12.9000, lng: 77.5800 }, radiusMeters: 350, estimatedDelayMinutes: 12, active: true, createdAt: ts(-7), expiresAt: ts(53), isPredicted: false },
  { id: 'd13', type: 'TRAFFIC', severity: 'MEDIUM', location: { lat: 12.8700, lng: 77.7100 }, radiusMeters: 800, estimatedDelayMinutes: 15, active: true, createdAt: ts(-12), expiresAt: ts(48), isPredicted: false },
  { id: 'd14', type: 'WEATHER', severity: 'LOW', location: { lat: 12.9500, lng: 77.6100 }, radiusMeters: 1800, estimatedDelayMinutes: 5, active: true, createdAt: ts(-20), expiresAt: ts(40), isPredicted: false },
  { id: 'd15', type: 'ACCIDENT', severity: 'HIGH', location: { lat: 12.9100, lng: 77.7300 }, radiusMeters: 450, estimatedDelayMinutes: 28, active: false, createdAt: ts(10), expiresAt: ts(70), isPredicted: true },
  { id: 'd16', type: 'TRAFFIC', severity: 'HIGH', location: { lat: 12.8900, lng: 77.6400 }, radiusMeters: 1100, estimatedDelayMinutes: 22, active: false, createdAt: ts(35), expiresAt: ts(95), isPredicted: true },
  { id: 'd17', type: 'WEATHER', severity: 'MEDIUM', location: { lat: 12.9600, lng: 77.5700 }, radiusMeters: 1600, estimatedDelayMinutes: 10, active: true, createdAt: ts(-18), expiresAt: ts(42), isPredicted: false },
  { id: 'd18', type: 'ACCIDENT', severity: 'LOW', location: { lat: 12.9800, lng: 77.6300 }, radiusMeters: 250, estimatedDelayMinutes: 7, active: true, createdAt: ts(-4), expiresAt: ts(56), isPredicted: false },
  { id: 'd19', type: 'TRAFFIC', severity: 'MEDIUM', location: { lat: 12.8300, lng: 77.6800 }, radiusMeters: 900, estimatedDelayMinutes: 18, active: false, createdAt: ts(45), expiresAt: ts(105), isPredicted: true },
  { id: 'd20', type: 'WEATHER', severity: 'HIGH', location: { lat: 12.9400, lng: 77.7000 }, radiusMeters: 2500, estimatedDelayMinutes: 35, active: false, createdAt: ts(60), expiresAt: ts(120), isPredicted: true },
];

// ── Delivery History ───────────────────────────────────────────────────────────
const drivers = ['driver_rajan', 'driver_arjun', 'driver_priya', 'driver_irfan', 'driver_kavitha'];
const driverNames: Record<string, string> = {
  driver_rajan: 'Rajan Kumar', driver_arjun: 'Arjun Sharma',
  driver_priya: 'Priya Nair', driver_irfan: 'Mohammed Irfan', driver_kavitha: 'Kavitha Reddy',
};
const zones = ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Jayanagar', 'MG Road', 'Bannerghatta', 'Marathahalli', 'Electronic City', 'Yelahanka'];
const dtypes: ('ACCIDENT' | 'TRAFFIC' | 'WEATHER' | null)[] = ['ACCIDENT', 'TRAFFIC', 'WEATHER', null, null, null];

const xaiSummaries = [
  'Reroute suggested via Indiranagar to avoid traffic at Silk Board junction, saving 8 min and 0.4 kg CO₂.',
  'Original route blocked by accident near HSR flyover; alternate route via BTM reduced risk from 72% to 44%.',
  'Rain predicted on Outer Ring Road in 15 min; AI pre-routed via inner roads, maintaining ETA within 3 min.',
  'Traffic congestion on Marathahalli bridge expected to worsen; reroute via Bellandur saved 12 min.',
  'Driver accepted AI reroute that avoided peak-hour gridlock on ORR, improving on-time probability to 91%.',
  'No disruption detected; route completed on original path with optimal fuel efficiency.',
  'Construction near Electronic City Phase 1 caused 20-min delay; no predictive data available at dispatch time.',
  'Pre-emptive reroute activated based on historical traffic pattern data for Friday evening on Hosur Road.',
  'Accident on Bannerghatta Road required emergency reroute; driver accepted and arrived 5 min early via Kanakapura.',
  'Route optimized for carbon reduction using EV lane priority on Outer Ring Road stretch.',
];

// FALLBACK: Delivery history records for offline/demo history views.
export const mockDeliveries: DeliveryRecord[] = Array.from({ length: 30 }, (_, i) => {
  const driverId = drivers[i % 5];
  const origin = zones[i % 10];
  const destination = zones[(i + 3) % 10];
  const wasRerouted = i % 3 !== 0;
  const predictedDisruption = i % 4 === 0;
  const dtype = dtypes[i % dtypes.length];
  const origEta = 20 + (i % 20);
  const delay = wasRerouted ? -(2 + (i % 8)) : (3 + (i % 15));
  return {
    id: `del_${String(i + 1).padStart(3, '0')}`,
    deliveryId: `DEL-BLR-${2024100 + i}`,
    driverId,
    driverName: driverNames[driverId],
    origin, destination,
    dateTime: new Date(now.getTime() - (i * 3 + 1) * 3600000).toISOString(),
    originalEtaMinutes: origEta,
    actualEtaMinutes: origEta + delay,
    riskScoreBefore: 30 + (i * 7) % 50,
    riskScoreAfter: wasRerouted ? 25 + (i * 5) % 30 : 30 + (i * 7) % 50,
    wasRerouted,
    disruptionType: wasRerouted ? dtype : null,
    rerouteCount: wasRerouted ? 1 + (i % 3) : 0,
    predictedDisruption,
    driverAcceptedReroute: wasRerouted ? (i % 5 !== 1) : null,
    carbonDeltaKg: wasRerouted ? +(0.1 + (i % 8) * 0.08).toFixed(2) : 0,
    xaiSummary: xaiSummaries[i % xaiSummaries.length],
  };
});

// ── Analytics ──────────────────────────────────────────────────────────────────
// FALLBACK: Analytics snapshot for initial rendering and offline mode.
export const mockAnalyticsData: AnalyticsData = {
  avgFleetRisk: 47,
  totalReroutesWeek: 34,
  onTimeRate: 91,
  activeDrivers: 3,
  carbonSavedMonthKg: 127.4,
  predictiveAccuracy: 84,
  trustIndex: 78,
  riskTrend: [
    { date: '2024-10-20', risk: 52, predicted: 54 },
    { date: '2024-10-21', risk: 48, predicted: 50 },
    { date: '2024-10-22', risk: 61, predicted: 58 },
    { date: '2024-10-23', risk: 44, predicted: 46 },
    { date: '2024-10-24', risk: 39, predicted: 41 },
    { date: '2024-10-25', risk: 55, predicted: 53 },
    { date: '2024-10-26', risk: 47, predicted: 49 },
    { date: '2024-10-26T12:00', risk: 47, predicted: 62 },
    { date: '2024-10-26T14:00', risk: 47, predicted: 58 },
  ],
  reroutesPerDriver: [
    { driverName: 'Rajan Kumar', count: 8 },
    { driverName: 'Arjun Sharma', count: 12 },
    { driverName: 'Priya Nair', count: 4 },
    { driverName: 'Mohammed Irfan', count: 6 },
    { driverName: 'Kavitha Reddy', count: 4 },
  ],
  disruptionDistribution: [
    { type: 'ACCIDENT', count: 12, totalDelayMinutes: 284 },
    { type: 'TRAFFIC', count: 18, totalDelayMinutes: 412 },
    { type: 'WEATHER', count: 7, totalDelayMinutes: 156 },
  ],
  carbonHeatmapData: [
    { zoneName: 'Koramangala', co2Intensity: 0.28 },
    { zoneName: 'HSR Layout', co2Intensity: 0.35 },
    { zoneName: 'Indiranagar', co2Intensity: 0.22 },
    { zoneName: 'Whitefield', co2Intensity: 0.61 },
    { zoneName: 'Jayanagar', co2Intensity: 0.18 },
    { zoneName: 'MG Road', co2Intensity: 0.72 },
    { zoneName: 'Bannerghatta', co2Intensity: 0.45 },
    { zoneName: 'Marathahalli', co2Intensity: 0.58 },
    { zoneName: 'Electronic City', co2Intensity: 0.41 },
    { zoneName: 'Yelahanka', co2Intensity: 0.15 },
  ],
};

// ── Vehicle Fuel Types ─────────────────────────────────────────────────────────
// FALLBACK: Default vehicle fuel metadata.
export const mockVehicleFuelTypes = [
  { vehicleId: 'driver_rajan', fuelType: 'petrol' as const, co2PerKm: 0.21 },
  { vehicleId: 'driver_arjun', fuelType: 'electric' as const, co2PerKm: 0.04 },
  { vehicleId: 'driver_priya', fuelType: 'electric' as const, co2PerKm: 0.04 },
  { vehicleId: 'driver_irfan', fuelType: 'diesel' as const, co2PerKm: 0.27 },
  { vehicleId: 'driver_kavitha', fuelType: 'cng' as const, co2PerKm: 0.14 },
];
