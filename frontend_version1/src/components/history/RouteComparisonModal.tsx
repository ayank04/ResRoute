import { X } from 'lucide-react';
import { DeliveryRecord } from '../../types';
import MapContainer from '../map/MapContainer';
import RoutePolyline from '../map/RoutePolyline';
import { useRouteStore } from '../../stores/routeStore';
import { createAutoReroute } from '../../services/liveRouteService';

interface Props { delivery: DeliveryRecord; onClose: () => void; }

export default function RouteComparisonModal({ delivery: d, onClose }: Props) {
  const routes = useRouteStore(s => s.routes);
  const originalRoute = routes.find(r => r.driverId === d.driverId && r.rerouteCount === 0)
    ?? routes.find(r => r.driverId === d.driverId)
    ?? routes[0]
    ?? null;
  const actualRoute = routes.find(r => r.driverId === d.driverId && r.rerouteCount > 0)
    ?? (originalRoute ? createAutoReroute(originalRoute) : undefined)
    ?? originalRoute;

  if (!originalRoute || !actualRoute) {
    return null;
  }

  const center = originalRoute.originCoords;
  const delayMin = d.actualEtaMinutes - d.originalEtaMinutes;

  const metrics = [
    { metric: 'Risk Score', original: `${d.riskScoreBefore}%`, actual: `${d.riskScoreAfter}%`, delta: `${d.riskScoreAfter - d.riskScoreBefore}%` },
    { metric: 'ETA', original: `${d.originalEtaMinutes} min`, actual: `${d.actualEtaMinutes} min`, delta: `${delayMin > 0 ? '+' : ''}${delayMin} min` },
    { metric: 'Distance', original: `${originalRoute.distanceKm} km`, actual: `${actualRoute.distanceKm} km`, delta: `+${(actualRoute.distanceKm - originalRoute.distanceKm).toFixed(1)} km` },
    { metric: 'CO₂ Delta', original: '0 kg', actual: `+${d.carbonDeltaKg} kg`, delta: `+${d.carbonDeltaKg} kg` },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Route Comparison — {d.deliveryId}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{d.driverName} · {d.origin} → {d.destination}</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {/* Map side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                <span className="legend-dashed" />Original Route
              </div>
              <div style={{ height: 200, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapContainer center={center} zoom={12}>
                  <RoutePolyline route={originalRoute} dashed />
                </MapContainer>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                <span className="legend-solid" />Actual Route (Rerouted)
              </div>
              <div style={{ height: 200, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapContainer center={center} zoom={12}>
                  <RoutePolyline route={actualRoute} />
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Metrics table */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Metrics Comparison</div>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Metric', 'Original', 'Actual', 'Δ'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', background: 'var(--card-bg-2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={m.metric} style={{ borderBottom: '1px solid rgba(45,63,90,0.4)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m.metric}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{m.original}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{m.actual}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: m.delta.startsWith('-') ? 'var(--success)' : m.delta === '0%' || m.delta === '0 kg' ? 'var(--text-dim)' : 'var(--danger)' }}>{m.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* XAI full explanation */}
          <div style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--primary)' }}>🧠 Full XAI Explanation</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{d.xaiSummary}</div>
            {d.predictedDisruption && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--info)' }}>✅ Disruption was predicted by AI model before occurring.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
