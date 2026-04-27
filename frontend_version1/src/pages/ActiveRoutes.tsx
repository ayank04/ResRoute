import { useRouteStore } from '../stores/routeStore';
import { Activity, MapPin, Clock, Shield } from 'lucide-react';

export default function ActiveRoutes() {
  const { routes } = useRouteStore();

  if (!routes) {
    return <div className="app-main"><div className="page-header"><h2>Loading routes...</h2></div></div>;
  }

  const activeRoutes = (routes ?? []).filter(r => r.status === 'ACTIVE');

  return (
    <div className="app-main">
      <div className="page-header">
        <h2>Active Routes</h2>
        <p style={{ color: 'var(--text-muted)' }}>Real-time monitoring of all vehicles currently in transit</p>
      </div>

      <div style={{ padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        {(activeRoutes ?? []).map(route => (
          <div key={route.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ background: 'var(--primary-glow)', padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                {(route.id ?? "").slice(0, 8)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>
                <div className="status-dot" style={{ background: 'var(--success)' }} />
                ON TRACK
              </div>
            </div>

            <div style={{ position: 'relative', paddingLeft: 20, borderLeft: '2px solid var(--border)', marginLeft: 8 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Origin</div>
                <div style={{ fontWeight: 600 }}>{route.origin}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Destination</div>
                <div style={{ fontWeight: 600 }}>{route.destination}</div>
              </div>
              <MapPin size={14} color="var(--text-dim)" style={{ position: 'absolute', left: -8, top: 0 }} />
              <MapPin size={14} color="var(--primary)" style={{ position: 'absolute', left: -8, bottom: 0 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> ETA
                </div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{route.etaMinutes || '...'} min</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={12} /> RISK
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>
                  {route.currentRiskScore !== undefined ? `${route.currentRiskScore}%` : '...%'}
                </div>
              </div>
            </div>

            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }}>View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}
