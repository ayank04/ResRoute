import { useRouteStore } from '../../stores/routeStore';
import { ArrowDown } from 'lucide-react';

export default function RerouteHistoryLog() {
  const { historyLog } = useRouteStore();

  return (
    <div className="sidebar-section">
      <div className="card-title">📋 Reroute History</div>
      {historyLog.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>No reroutes performed yet.</div>}
      {historyLog.slice(0, 5).map((entry, i) => (
        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(45,63,90,0.4)', fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: 'var(--text-muted)' }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {entry.reason.length > 28 ? `${entry.reason.slice(0, 28)}…` : entry.reason}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--risk-high)', fontWeight: 600 }}>{entry.oldRisk}%</span>
            <ArrowDown size={12} color="var(--success)" />
            <span style={{ color: 'var(--risk-low)', fontWeight: 600 }}>{entry.newRisk}%</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>ETA {entry.oldEta}→{entry.newEta} min</span>
          </div>
        </div>
      ))}
    </div>
  );
}
