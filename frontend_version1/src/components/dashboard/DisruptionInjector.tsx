import { Zap, CloudRain, Car, Clock, Plus, Trash2 } from 'lucide-react';
import { useDisruptionStore } from '../../stores/disruptionStore';
import { useRouteStore } from '../../stores/routeStore';
import { useUIStore } from '../../stores/uiStore';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { Disruption } from '../../types';
import { createAutoReroute } from '../../services/liveRouteService';

let idCounter = 100;
const mkId = () => `inj_${idCounter++}`;
const ts = (offsetMin = 0) => new Date(Date.now() + offsetMin * 60000).toISOString();

export default function DisruptionInjector() {
  const { addDisruption, clearAll } = useDisruptionStore();
  const { currentRoute, routes, reroute } = useRouteStore();
  const { showToast } = useUIStore();
  const { incrementReroutes } = useAnalyticsStore();

  function inject(d: Disruption, label: string) {
    addDisruption(d);
    const baseRoute = currentRoute ?? routes[0] ?? null;
    if (!baseRoute) {
      showToast(`🚨 ${label} injected — no active route to reroute`, 'warning', 5000);
      return;
    }

    const altRoute = createAutoReroute(baseRoute);
    reroute(altRoute, `${label} detected — auto-rerouted`);
    incrementReroutes();
    showToast(`🚨 ${label} injected — rerouting... Risk reduced from ${baseRoute.currentRiskScore}% to ${altRoute.currentRiskScore}%`, 'warning', 5000);
  }

  const accidents: Disruption = { id: mkId(), type: 'ACCIDENT', severity: 'HIGH', location: { lat: 12.9116, lng: 77.6389 }, radiusMeters: 400, estimatedDelayMinutes: 20, active: true, createdAt: ts(), expiresAt: ts(60), isPredicted: false };
  const traffic: Disruption = { id: mkId(), type: 'TRAFFIC', severity: 'HIGH', location: { lat: 12.9177, lng: 77.6408 }, radiusMeters: 900, estimatedDelayMinutes: 25, active: true, createdAt: ts(), expiresAt: ts(60), isPredicted: false };
  const rain: Disruption = { id: mkId(), type: 'WEATHER', severity: 'MEDIUM', location: { lat: 12.9352, lng: 77.6245 }, radiusMeters: 1500, estimatedDelayMinutes: 12, active: true, createdAt: ts(), expiresAt: ts(60), isPredicted: false };
  const future: Disruption = { id: mkId(), type: 'TRAFFIC', severity: 'HIGH', location: { lat: 12.9177, lng: 77.6408 }, radiusMeters: 900, estimatedDelayMinutes: 20, active: false, createdAt: ts(20), expiresAt: ts(80), isPredicted: true };

  return (
    <div style={{ marginTop: 8 }}>
      <div className="card-title" style={{ marginBottom: 10 }}>⚡ Disruption Injector</div>
      <div className="injector-grid">
        <button className="btn btn-danger btn-sm" onClick={() => inject({ ...accidents, id: mkId() }, 'Accident near HSR')}>
          <Car size={13} /> Accident
        </button>
        <button className="btn btn-warning btn-sm" onClick={() => inject({ ...traffic, id: mkId() }, 'Traffic at Silk Board')}>
          <Zap size={13} /> Traffic
        </button>
        <button className="btn btn-sm" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--info)', border: '1px solid rgba(6,182,212,0.3)' }} onClick={() => inject({ ...rain, id: mkId() }, 'Rain on ORR')}>
          <CloudRain size={13} /> Rain
        </button>
        <button className="btn btn-sm" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }} onClick={() => { addDisruption({ ...future, id: mkId() }); showToast('🔮 Future disruption predicted in 20 min — pre-emptive routing active', 'info'); }}>
          <Clock size={13} /> +20 min
        </button>
      </div>
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={() => { clearAll(); showToast('All disruptions cleared', 'success'); }}>
        <Trash2 size={13} /> Clear All Disruptions
      </button>
    </div>
  );
}
