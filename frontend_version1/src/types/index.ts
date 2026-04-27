// ============================================================
// ResilientRoute – All TypeScript Interfaces
// ============================================================

export interface Coordinates {
  lat: number;
  lng: number;
  lon?: number;
}

export type DriverStatus = 'available' | 'on_trip' | 'offline' | 'break' | 'EN_ROUTE' | 'IDLE' | 'COMPLETED';
export type VehicleType = 'bike' | 'car' | 'truck';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type FatigueRisk = 'LOW' | 'MEDIUM' | 'HIGH';
export type DisruptionType = 'ACCIDENT' | 'TRAFFIC' | 'WEATHER' | null;
export type XAILevel = 'simple' | 'detailed' | 'full';

export interface Driver {
  id: string;
  name: string;
  status: DriverStatus;
  currentPosition: Coordinates;
  activeRouteId: string | null;
  vehicleType: VehicleType;
  avatar: string;
  joinDate: string;
  totalDeliveries: number;
  onTimeRate: number;
  ecoScore: number;
  fatigueRisk: FatigueRisk;
  badges: string[];
  phone: string;
  email?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  homeBaseAddress?: string;
  certifiedTypes?: string[];
  currentVehicleId?: string | null;
  rating?: number;
  totalDistanceKm?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  vehicleType: VehicleType;
  status: DriverStatus;
  priority: 'critical' | 'normal' | 'low';
  isEmergency: boolean;
  isLocked: boolean;
  lockedBy?: string | null;
  lockedAt?: string | null;
  currentDriverId?: string | null;
  currentRouteId?: string | null;
  currentPosition: Coordinates;
  riskScore: number;
  riskTrend?: 'rising' | 'falling' | 'stable';
  model: string;
  licensePlate: string;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'cng';
  ecoScore: number;
  // Shared fields to prevent crashes in bootstrap/management
  avatar?: string;
  joinDate?: string;
  totalDeliveries?: number;
  onTimeRate?: number;
  fatigueRisk?: FatigueRisk;
  badges?: string[];
}

export interface RouteSegment {
  id: string;
  start: Coordinates;
  end: Coordinates;
  polyline: string;            // Encoded polyline string
  decodedPath: Coordinates[];  // Pre-decoded for map rendering
  riskLevel: RiskLevel;
  riskScore: number;           // 0-1
  distanceKm: number;
  durationMinutes: number;
  co2Kg: number;
}

export interface Route {
  id: string;
  driverId: string;
  origin: string;
  destination: string;
  originCoords: Coordinates;
  destinationCoords: Coordinates;
  segments: RouteSegment[];
  currentRiskScore: number;    // 0-100
  etaMinutes: number;
  distanceKm: number;
  rerouteCount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  carbonSavedKg: number;       // Delta from original route
}

export interface DeliveryRecord {
  id: string;
  deliveryId: string;
  driverId: string;
  driverName: string;
  origin: string;
  destination: string;
  dateTime: string;
  originalEtaMinutes: number;
  actualEtaMinutes: number;
  riskScoreBefore: number;
  riskScoreAfter: number;
  wasRerouted: boolean;
  disruptionType: DisruptionType;
  rerouteCount: number;
  predictedDisruption: boolean;
  driverAcceptedReroute: boolean | null;
  carbonDeltaKg: number;
  xaiSummary: string;
}

export interface Disruption {
  id: string;
  type: 'ACCIDENT' | 'TRAFFIC' | 'WEATHER';
  severity: RiskLevel;
  location: Coordinates;
  radiusMeters: number;
  estimatedDelayMinutes: number;
  active: boolean;
  createdAt: string;
  expiresAt: string;
  isPredicted: boolean;
}

export interface RiskTrendPoint {
  date: string;
  risk: number;
  predicted?: number;
}

export interface ReroutePerDriver {
  driverName: string;
  count: number;
}

export interface DisruptionDistributionItem {
  type: string;
  count: number;
  totalDelayMinutes: number;
}

export interface CarbonHeatmapZone {
  zoneName: string;
  co2Intensity: number;
}

export interface AnalyticsData {
  avgFleetRisk: number;
  totalReroutesWeek: number;
  onTimeRate: number;
  activeDrivers: number;
  carbonSavedMonthKg: number;
  predictiveAccuracy: number;
  trustIndex: number;
  riskTrend: RiskTrendPoint[];
  reroutesPerDriver: ReroutePerDriver[];
  disruptionDistribution: DisruptionDistributionItem[];
  carbonHeatmapData: CarbonHeatmapZone[];
}

export interface VehicleFuelType {
  vehicleId: string;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'cng';
  co2PerKm: number;
}

export interface ObjectiveWeights {
  time: number;
  cost: number;
  risk: number;
  carbon: number;
}

export interface Settings {
  riskThreshold: number;
  weights: ObjectiveWeights;
  apiMode: 'mock' | 'live';
  demoAnimationSpeed: number;
  xaiLevel: XAILevel;
  forecastHorizonMinutes: number;
  autoPreemptEnabled: boolean;
  vehicleFuelTypes: VehicleFuelType[];
}

export interface RerouteHistoryEntry {
  timestamp: string;
  oldRisk: number;
  newRisk: number;
  oldEta: number;
  newEta: number;
  reason: string;
}

export interface DriverFeedback {
  driverId: string;
  note: string;
  timestamp: string;
}

// API and WebSocket Types

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  latency_ms: number;
  circuit_breaker: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  last_sync: string;
}
