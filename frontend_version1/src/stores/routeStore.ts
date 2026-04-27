import { create } from 'zustand';
import { Route, RerouteHistoryEntry } from '../types';

interface RouteStore {
  routes: Route[];
  currentRoute: Route | null;
  originalSegments: Route['segments'];
  historyLog: RerouteHistoryEntry[];
  predictiveRouteSuggestion: Route | null;
  setRoutes: (routes: Route[]) => void;
  setRoute: (route: Route) => void;
  reroute: (newRoute: Route, reason?: string) => void;
  addReroute: (route: Route) => void;
  clearPredictive: () => void;
  resetRoute: () => void;
  setPredictiveSuggestion: (route: Route | null) => void;
}

function upsertRoute(routes: Route[], route: Route): Route[] {
  if (!Array.isArray(routes)) return [route];
  const index = routes.findIndex((candidate) => candidate.id === route.id);
  if (index === -1) {
    return [route, ...routes];
  }

  const next = routes.slice();
  next[index] = route;
  return next;
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  routes: [],
  currentRoute: null,
  originalSegments: [],
  historyLog: [],
  predictiveRouteSuggestion: null,

  setRoutes: (routes) => set({ routes: Array.isArray(routes) ? routes : [] }),

  setRoute: (route) => set((state) => ({
    routes: upsertRoute(state.routes, route),
    currentRoute: route,
    originalSegments: route.segments || [],
    historyLog: [],
  })),

  reroute: (newRoute, reason = 'Disruption detected') => {
    const old = get().currentRoute;
    const entry: RerouteHistoryEntry = {
      timestamp: new Date().toISOString(),
      oldRisk: old?.currentRiskScore ?? 0,
      newRisk: newRoute.currentRiskScore,
      oldEta: old?.etaMinutes ?? 0,
      newEta: newRoute.etaMinutes,
      reason,
    };
    set((s) => ({
      routes: upsertRoute(s.routes, newRoute),
      currentRoute: { ...newRoute, rerouteCount: (old?.rerouteCount ?? 0) + 1 },
      historyLog: [entry, ...s.historyLog],
      predictiveRouteSuggestion: null,
    }));
  },

  addReroute: (route) => {
    if (!route) return;
    set((s) => ({
      routes: upsertRoute(s.routes, route),
      currentRoute: s.currentRoute?.id === route.id ? route : s.currentRoute,
    }));
  },

  clearPredictive: () => set({ predictiveRouteSuggestion: null }),

  resetRoute: () => set({ currentRoute: null, originalSegments: [], historyLog: [], predictiveRouteSuggestion: null }),

  setPredictiveSuggestion: (route) => set({ predictiveRouteSuggestion: route }),
}));
