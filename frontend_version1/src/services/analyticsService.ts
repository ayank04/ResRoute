import { AnalyticsData, DeliveryRecord, DisruptionType, RiskLevel, Disruption } from '../types';
import { mockAnalyticsData, mockDeliveries, mockDisruptions } from './mockData';
import api from './api';

type SummaryResponse = {
  total_routes: number;
  active_drivers: number;
  avg_delivery_time: number;
  avg_fleet_risk: number;
  disruption_count: number;
  on_time_rate: number;
};

type HistoryResponseItem = {
  route_id: string;
  timestamp: string;
  driver: string;
  status: string;
  risk_score: number;
  origin?: string;
  destination?: string;
  duration_seconds?: number;
  on_time?: boolean;
};

type DisruptionResponseItem = {
  event_id: string;
  type: string;
  severity: string;
  time: string;
  affected_route: string;
};

function toRiskLevel(score: number): RiskLevel {
  if (score < 0.4) return 'LOW';
  if (score < 0.7) return 'MEDIUM';
  return 'HIGH';
}

function toDisruptionType(value: string): DisruptionType {
  const normalized = (value || '').toUpperCase();
  if (normalized.includes('ACCIDENT')) return 'ACCIDENT';
  if (normalized.includes('WEATHER') || normalized.includes('RAIN') || normalized.includes('STORM')) return 'WEATHER';
  if (normalized.includes('TRAFFIC') || normalized.includes('RISK_THRESHOLD')) return 'TRAFFIC';
  return null;
}

export async function fetchAnalyticsSummary(): Promise<SummaryResponse> {
  const { data } = await api.get('/analytics/summary');
  return data;
}

export async function fetchAnalyticsHistoryRaw(): Promise<HistoryResponseItem[]> {
  const { data } = await api.get('/analytics/history');
  return data;
}

export async function fetchAnalyticsDisruptionsRaw(): Promise<DisruptionResponseItem[]> {
  const { data } = await api.get('/analytics/disruptions');
  return data;
}

export async function loadAnalyticsData(): Promise<AnalyticsData> {
  try {
    const [summary, history, disruptions] = await Promise.all([
      fetchAnalyticsSummary(),
      fetchAnalyticsHistoryRaw(),
      fetchAnalyticsDisruptionsRaw(),
    ]);

    const avgFleetRisk = summary.avg_fleet_risk ?? (history.length
      ? Math.round(history.reduce((acc, item) => acc + Math.round((item.risk_score || 0) * 100), 0) / history.length)
      : mockAnalyticsData.avgFleetRisk);

    const reroutesPerDriverMap: Record<string, number> = {};
    for (const item of disruptions) {
      const routeKey = item.affected_route || 'unknown';
      reroutesPerDriverMap[routeKey] = (reroutesPerDriverMap[routeKey] ?? 0) + 1;
    }

    const disruptionDistributionMap: Record<string, { count: number; totalDelayMinutes: number }> = {};
    for (const item of disruptions) {
      const disruptionType = toDisruptionType(item.type) ?? 'TRAFFIC';
      const bucket = disruptionDistributionMap[disruptionType] ?? { count: 0, totalDelayMinutes: 0 };
      bucket.count += 1;
      bucket.totalDelayMinutes += 12;
      disruptionDistributionMap[disruptionType] = bucket;
    }

    const riskTrend = history
      .slice(0, 20)
      .reverse()
      .map((item) => ({
        date: item.timestamp,
        risk: Math.round((item.risk_score || 0) * 100),
      }));

    return {
      ...mockAnalyticsData,
      avgFleetRisk,
      totalReroutesWeek: disruptions.length,
      onTimeRate: Math.round(summary.on_time_rate || mockAnalyticsData.onTimeRate),
      activeDrivers: summary.active_drivers ?? mockAnalyticsData.activeDrivers,
      riskTrend: riskTrend.length ? riskTrend : mockAnalyticsData.riskTrend,
      reroutesPerDriver: Object.entries(reroutesPerDriverMap).map(([driverName, count]) => ({ driverName, count })),
      disruptionDistribution: Object.entries(disruptionDistributionMap).map(([type, agg]) => ({
        type,
        count: agg.count,
        totalDelayMinutes: agg.totalDelayMinutes,
      })),
    };
  } catch {
    return mockAnalyticsData;
  }
}

export async function loadHistoryDeliveries(): Promise<DeliveryRecord[]> {
  try {
    const [history, disruptions] = await Promise.all([
      fetchAnalyticsHistoryRaw(),
      fetchAnalyticsDisruptionsRaw(),
    ]);

    const disruptionsByRoute: Record<string, DisruptionResponseItem[]> = {};
    for (const event of disruptions) {
      const routeId = event.affected_route || 'unknown';
      disruptionsByRoute[routeId] = disruptionsByRoute[routeId] ?? [];
      disruptionsByRoute[routeId].push(event);
    }

    if (!history.length) {
      return mockDeliveries;
    }

    return history.map((item, index) => {
      const routeEvents = disruptionsByRoute[item.route_id] ?? [];
      const routeRisk = Math.round((item.risk_score || 0) * 100);
      const rerouteCount = routeEvents.length;
      const wasRerouted = rerouteCount > 0;
      const originalEtaMinutes = Math.max(1, Math.round((item.duration_seconds || 0) / 60) + (wasRerouted ? 8 : 3));
      const actualEtaMinutes = Math.max(1, Math.round((item.duration_seconds || 0) / 60) || originalEtaMinutes - (wasRerouted ? 4 : 0));

      return {
        id: `history_${item.route_id}_${index}`,
        deliveryId: `DEL-${item.route_id.slice(0, 8).toUpperCase()}`,
        driverId: item.driver,
        driverName: item.driver,
        origin: item.origin || 'Unknown Origin',
        destination: item.destination || 'Unknown Destination',
        dateTime: item.timestamp,
        originalEtaMinutes,
        actualEtaMinutes,
        riskScoreBefore: Math.min(100, routeRisk + 8),
        riskScoreAfter: routeRisk,
        wasRerouted,
        disruptionType: routeEvents.length ? (toDisruptionType(routeEvents[0].type) ?? 'TRAFFIC') : null,
        rerouteCount,
        predictedDisruption: false,
        driverAcceptedReroute: wasRerouted ? true : null,
        carbonDeltaKg: wasRerouted ? +(0.18 + rerouteCount * 0.06).toFixed(2) : 0,
        xaiSummary: wasRerouted
          ? `Reroute triggered by ${routeEvents[0].type.toLowerCase()} event severity ${routeEvents[0].severity.toLowerCase()}.`
          : `Completed route with status ${item.status}.`,
      };
    });
  } catch {
    return mockDeliveries;
  }
}

export async function loadDisruptionsForAnalytics(): Promise<Disruption[]> {
  try {
    const events = await fetchAnalyticsDisruptionsRaw();
    if (!events.length) {
      return mockDisruptions;
    }

    return events.map((event, index) => {
      const severity = event.severity.toUpperCase();
      const safeSeverity: RiskLevel = severity === 'HIGH' || severity === 'CRITICAL'
        ? 'HIGH'
        : severity === 'LOW'
          ? 'LOW'
          : 'MEDIUM';

      return {
        id: event.event_id || `dis_${index}`,
        type: (toDisruptionType(event.type) ?? 'TRAFFIC') as 'ACCIDENT' | 'TRAFFIC' | 'WEATHER',
        severity: safeSeverity,
        location: { lat: 12.9352, lng: 77.6245 },
        radiusMeters: 500,
        estimatedDelayMinutes: 12,
        active: true,
        createdAt: event.time,
        expiresAt: event.time,
        isPredicted: false,
      };
    });
  } catch {
    return mockDisruptions;
  }
}
