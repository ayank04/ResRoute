import { decode } from '@googlemaps/polyline-codec';
import { Coordinates, Route, RouteSegment, RiskLevel } from '../types';
import api from './api';

type BackendCoordinates = { lat: number; lon: number };
type BackendRouteCandidate = {
  route_id: string;
  duration_seconds: number;
  distance_meters: number;
  polyline: string;
  steps?: Array<Record<string, unknown>>;
  score?: number;
  risk_score?: number;
  stale?: boolean;
};

type BackendActiveRoute = {
  route_id: string;
  driver_id: string;
  origin: string;
  destination: string;
  origin_coords: BackendCoordinates;
  destination_coords: BackendCoordinates;
  current_route: BackendRouteCandidate;
  alternate_routes: BackendRouteCandidate[];
  status: string;
  reroute_count: number;
  disruption_log: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score < 0.4) return 'LOW';
  if (score < 0.7) return 'MEDIUM';
  return 'HIGH';
}

function toFrontendCoordinates(coord: BackendCoordinates): Coordinates {
  if (!coord) return { lat: 0, lng: 0 };
  return { lat: coord.lat ?? 0, lng: coord.lon ?? 0 };
}

function decodePolylinePath(polyline: string, fallbackStart: Coordinates, fallbackEnd: Coordinates): Coordinates[] {
  if (!polyline) {
    return [fallbackStart, fallbackEnd];
  }

  try {
    const decoded = decode(polyline) as Array<[number, number]>;
    if (!decoded || decoded.length === 0) {
      return [fallbackStart, fallbackEnd];
    }

    return decoded.map(([lat, lng]) => ({ lat, lng }));
  } catch {
    return [fallbackStart, fallbackEnd];
  }
}

function buildRouteSegments(
  routeId: string,
  candidate: BackendRouteCandidate,
  origin: Coordinates,
  destination: Coordinates,
  riskScorePercent: number,
): RouteSegment[] {
  if (!candidate) return [];
  
  const path = decodePolylinePath(candidate.polyline, origin, destination);
  const segmentRiskScore = clamp(riskScorePercent / 100, 0, 1);

  return [{
    id: `${routeId}_main`,
    start: path[0] ?? origin,
    end: path[path.length - 1] ?? destination,
    polyline: candidate.polyline || '',
    decodedPath: path,
    riskLevel: riskLevelFromScore(segmentRiskScore),
    riskScore: segmentRiskScore,
    distanceKm: (candidate.distance_meters || 0) / 1000,
    durationMinutes: Math.round((candidate.duration_seconds || 0) / 60),
    co2Kg: +((candidate.distance_meters || 0) / 1000 * 0.12).toFixed(2),
  }];
}

export function convertBackendActiveRoute(activeRoute: BackendActiveRoute): Route {
  if (!activeRoute) throw new Error("Null activeRoute");
  
  const originCoords = toFrontendCoordinates(activeRoute.origin_coords);
  const destinationCoords = toFrontendCoordinates(activeRoute.destination_coords);
  const riskScorePercent = clamp((activeRoute.current_route?.risk_score ?? 0.3) * 100, 0, 100);

  return {
    id: activeRoute.route_id,
    driverId: activeRoute.driver_id,
    origin: activeRoute.origin,
    destination: activeRoute.destination,
    originCoords,
    destinationCoords,
    segments: buildRouteSegments(
      activeRoute.route_id,
      activeRoute.current_route,
      originCoords,
      destinationCoords,
      riskScorePercent,
    ),
    currentRiskScore: Math.round(riskScorePercent),
    etaMinutes: Math.round((activeRoute.current_route?.duration_seconds || 0) / 60),
    distanceKm: +((activeRoute.current_route?.distance_meters || 0) / 1000).toFixed(2),
    rerouteCount: activeRoute.reroute_count || 0,
    status: activeRoute.status === 'COMPLETED' ? 'COMPLETED' : activeRoute.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE',
    createdAt: activeRoute.created_at,
    updatedAt: activeRoute.updated_at,
    carbonSavedKg: 0,
  };
}

export async function fetchActiveRoutes(): Promise<Route[]> {
  const { data: payload } = await api.get('/routes');
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map(p => {
      try {
        return convertBackendActiveRoute(p);
      } catch (e) {
        console.error("Skipping malformed route:", e);
        return null;
      }
    })
    .filter((r): r is Route => r !== null);
}

export function createRouteVariant(
  route: Route,
  options: {
    idSuffix?: string;
    riskDelta?: number;
    etaDelta?: number;
    carbonDelta?: number;
    rerouteCountDelta?: number;
  } = {},
): Route {
  if (!route) return {} as Route;
  
  const riskDelta = options.riskDelta ?? 0;
  const etaDelta = options.etaDelta ?? 0;
  const carbonDelta = options.carbonDelta ?? 0;
  const rerouteCountDelta = options.rerouteCountDelta ?? 0;

  return {
    ...route,
    id: options.idSuffix ? `${route.id}_${options.idSuffix}` : `${route.id}_variant`,
    segments: (route.segments || []).map((segment) => {
      if (!segment) return {} as RouteSegment;
      const nextRiskScore = clamp((segment.riskScore || 0) + (riskDelta / 100), 0, 1);
      return {
        ...segment,
        riskScore: nextRiskScore,
        riskLevel: riskLevelFromScore(nextRiskScore),
      };
    }),
    currentRiskScore: Math.round(clamp((route.currentRiskScore || 0) + riskDelta, 0, 100)),
    etaMinutes: Math.max(1, Math.round((route.etaMinutes || 0) + etaDelta)),
    distanceKm: route.distanceKm || 0,
    rerouteCount: Math.max(0, (route.rerouteCount || 0) + rerouteCountDelta),
    updatedAt: new Date().toISOString(),
    carbonSavedKg: +(Math.max(0, (route.carbonSavedKg || 0) + carbonDelta)).toFixed(2),
  };
}

export function createPredictiveRoute(route: Route): Route {
  if (!route) return {} as Route;
  return createRouteVariant(route, {
    idSuffix: 'predictive',
    riskDelta: -16,
    etaDelta: -7,
    carbonDelta: 0.4,
  });
}

export function createAutoReroute(route: Route): Route {
  if (!route) return {} as Route;
  return createRouteVariant(route, {
    idSuffix: 'auto',
    riskDelta: -12,
    etaDelta: -5,
    carbonDelta: 0.25,
    rerouteCountDelta: 1,
  });
}