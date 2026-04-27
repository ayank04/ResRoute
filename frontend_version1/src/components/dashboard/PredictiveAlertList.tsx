import { Clock } from 'lucide-react';
import { useDisruptionStore } from '../../stores/disruptionStore';

const sev: Record<string, string> = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const typeIcon: Record<string, string> = { ACCIDENT: '🚗', TRAFFIC: '🚦', WEATHER: '🌧️' };

export default function PredictiveAlertList() {
  const disruptions = useDisruptionStore(s => s.disruptions) || [];
  const predicted = (disruptions || []).filter(d => d?.isPredicted).slice(0, 5);
  const active = (disruptions || []).filter(d => d && !d.isPredicted).slice(0, 5);

  return (
    <div className="sidebar-section">
      <div className="card-title">🔮 Predictive Alerts</div>
      {predicted.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No predicted disruptions</div>}
      {predicted.map((d, i) => (
        <div key={d.id || `pred-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(45,63,90,0.4)', fontSize: 12 }}>
          <span style={{ fontSize: 16 }}>{typeIcon[d.type] || '⚠️'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{d.type}</div>
            <div style={{ color: 'var(--text-dim)' }}>
              <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
              In {Math.round((new Date(d.createdAt).getTime() - Date.now()) / 60000)} min · +{d.estimatedDelayMinutes} min delay
            </div>
          </div>
          <span className={`badge ${sev[d.severity] || 'badge-medium'}`}>{d.severity}</span>
        </div>
      ))}

      {active.length > 0 && (
        <>
          <div className="card-title" style={{ marginTop: 14 }}>⚠️ Active Disruptions</div>
          {active.map((d, i) => (
            <div key={d.id || `active-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(45,63,90,0.4)', fontSize: 12 }}>
              <span style={{ fontSize: 16 }}>{typeIcon[d.type] || '⚠️'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{d.type}</div>
                <div style={{ color: 'var(--text-dim)' }}>+{d.estimatedDelayMinutes} min · r={d.radiusMeters}m</div>
              </div>
              <span className={`badge ${sev[d.severity] || 'badge-medium'}`}>{d.severity}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
