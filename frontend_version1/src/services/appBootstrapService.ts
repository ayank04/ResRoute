import { Vehicle, Disruption, Route } from '../types';
import { fetchActiveRoutes } from './liveRouteService';
import { loadDisruptionsForAnalytics } from './analyticsService';
import { mockVehicles } from '../mock/vehicles';
import { mockDisruptions } from '../mock/disruptions';
import { mockRoutes } from '../mock/routes';

function createVehicleMap(vehicles: Vehicle[]): Record<string, Vehicle> {
  const map: Record<string, Vehicle> = {};
  for (const vehicle of vehicles) {
    map[vehicle.id] = vehicle;
  }
  return map;
}

function buildVehiclesFromRoutes(routes: Route[]): Vehicle[] {
  const fallbackMap = createVehicleMap(mockVehicles);
  const vehicleIds = Array.from(new Set(routes.map(route => route.driverId))).filter(Boolean);
  const nowDate = new Date().toISOString().split('T')[0];

  if (!vehicleIds.length) {
    return mockVehicles;
  }

  return vehicleIds.map((vehicleId, index) => {
    const fallback = fallbackMap[vehicleId] ?? mockVehicles[index % mockVehicles.length];
    const route = routes.find(candidate => candidate.driverId === vehicleId);

    return {
      ...fallback,
      id: vehicleId,
      name: fallback?.name ?? `Vehicle ${index + 1}`,
      status: route?.status === 'ACTIVE' ? 'EN_ROUTE' : fallback?.status ?? 'IDLE',
      currentPosition: route?.originCoords ?? fallback?.currentPosition ?? { lat: 12.9352, lng: 77.6245 },
      activeRouteId: route?.id ?? null,
      joinDate: fallback?.joinDate ?? nowDate,
      totalDeliveries: fallback?.totalDeliveries ?? 0,
      onTimeRate: fallback?.onTimeRate ?? 90,
      ecoScore: fallback?.ecoScore ?? 80,
      fatigueRisk: fallback?.fatigueRisk ?? 'LOW',
      badges: fallback?.badges ?? [],
      avatar: fallback?.avatar ?? `D${index + 1}`,
      vehicleType: fallback?.vehicleType ?? 'car',
    };
  });
}

export async function loadInitialAppData(): Promise<{
  routes: Route[];
  vehicles: Vehicle[];
  disruptions: Disruption[];
}> {
  let routes: Route[] = mockRoutes;
  try {
    const liveRoutes = await fetchActiveRoutes();
    if (liveRoutes.length) {
      routes = liveRoutes;
    }
  } catch {
    routes = mockRoutes;
  }

  const vehicles = buildVehiclesFromRoutes(routes);

  let disruptions: Disruption[] = mockDisruptions;
  try {
    const liveDisruptions = await loadDisruptionsForAnalytics();
    disruptions = liveDisruptions.length ? liveDisruptions : mockDisruptions;
  } catch {
    disruptions = mockDisruptions;
  }

  return {
    routes,
    vehicles,
    disruptions,
  };
}
