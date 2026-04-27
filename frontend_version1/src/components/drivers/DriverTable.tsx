import { AlertTriangle } from 'lucide-react';
import { Driver } from '../../types';
import { useDisruptionStore } from '../../stores/disruptionStore';
import { useRouteStore } from '../../stores/routeStore';

interface Props {
  drivers: Driver[];
  onView: (d: Driver) => void;
  onAssign: (d: Driver) => void;
}

const ecoGrade = (s: number) => s >= 90 ? 'A' : s >= 75 ? 'B' : s >= 60 ? 'C' : s >= 45 ? 'D' : 'F';
const ecoColor = (s: number) => s >= 90 ? 'var(--success)' : s >= 75 ? '#34d399' : s >= 60 ? 'var(--warning)' : s >= 45 ? '#f87171' : 'var(--danger)';
const statusBadge: Record<string, string> = { 
  on_trip: 'badge-primary', 
  EN_ROUTE: 'badge-primary',
  available: 'badge-success', 
  IDLE: 'badge-medium',
  offline: 'badge-medium', 
  break: 'badge-warning',
  COMPLETED: 'badge-success' 
};
const fatigueEmoji: Record<string, string> = { LOW: '😊', MEDIUM: '😐', HIGH: '😴' };

export default function DriverTable({ drivers, onView, onAssign }: Props) {
  const routes = useRouteStore(s => s.routes);
  const disruptions = useDisruptionStore(s => s.disruptions);

  function isPredictiveAlert(driverId: string) {
    const route = routes.find(r => r.driverId === driverId && r.status === 'ACTIVE');
    if (!route) return false;

    const last = route.segments[route.segments.length - 1];
    if (!last) return false;

    return disruptions.some(d => d.isPredicted && !d.active &&
      Math.abs(d.location.lat - last.end.lat) < 0.05 &&
      Math.abs(d.location.lng - last.end.lng) < 0.05);
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Driver</th>
            <th>Status</th>
            <th>Active Route</th>
            <th>Risk</th>
            <th>ETA</th>
            <th>Reroutes Today</th>
            <th>Predictive ⚠️</th>
            <th>Eco Grade</th>
            <th>Fatigue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => {
            const route = routes.find(r => r.driverId === d.id && r.status === 'ACTIVE');
            const alert = isPredictiveAlert(d.id);
            return (
              <tr key={d.id} onClick={() => onView(d)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={d.avatar} alt={d.name} className="avatar avatar-blue" style={{ width: 32, height: 32, borderRadius: 8 }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{d.vehicleType}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${statusBadge[d.status]}`}>{d.status.replace('_', ' ')}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {route ? `${route.origin} → ${route.destination}` : '—'}
                </td>
                <td>
                  {route ? (
                    <span style={{ fontWeight: 700, color: route.currentRiskScore >= 65 ? 'var(--risk-high)' : route.currentRiskScore >= 40 ? 'var(--risk-med)' : 'var(--risk-low)' }}>
                      {route.currentRiskScore}%
                    </span>
                  ) : '—'}
                </td>
                <td style={{ fontSize: 13 }}>{route ? `${route.etaMinutes} min` : '—'}</td>
                <td style={{ textAlign: 'center' }}>{route ? route.rerouteCount : 0}</td>
                <td style={{ textAlign: 'center' }}>
                  {alert && <AlertTriangle size={16} color="var(--warning)" />}
                </td>
                <td>
                  <span style={{ fontWeight: 800, color: ecoColor(d.ecoScore), fontSize: 16 }}>{ecoGrade(d.ecoScore)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 4 }}>({d.ecoScore})</span>
                </td>
                <td style={{ fontSize: 18, textAlign: 'center' }}>
                  {fatigueEmoji[d.fatigueRisk]}
                  {d.fatigueRisk === 'HIGH' && (
                    <div style={{ fontSize: 10, color: 'var(--warning)' }}>HIGH</div>
                  )}
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onView(d)}>View</button>
                    <button className="btn btn-primary btn-sm" onClick={() => onAssign(d)}>Assign</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
