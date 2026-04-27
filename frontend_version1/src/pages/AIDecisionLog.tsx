import { useState } from 'react';
import { FileText, ChevronRight, AlertTriangle, Zap, CheckCircle } from 'lucide-react';

export default function AIDecisionLog() {
  const [decisions] = useState([
    { id: '1', timestamp: '2026-04-26T10:15:00Z', vehicle: 'BLR-001', action: 'reroute', riskBefore: 78, riskAfter: 32, factor: 'Traffic', reason: 'Accident detected on ORR', overridden: false },
    { id: '2', timestamp: '2026-04-26T10:12:00Z', vehicle: 'BLR-005', action: 'early_warning', riskBefore: 45, riskAfter: null, factor: 'Weather', reason: 'Rising risk due to rain', overridden: false },
  ]);

  return (
    <div className="app-main">
      <div className="page-header">
        <h2>AI Decision Log</h2>
        <p style={{ color: 'var(--text-muted)' }}>Transparent audit trail of all autonomous routing actions</p>
      </div>

      <div style={{ padding: '0 40px' }}>
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'hsla(0,0%,100%,0.02)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-dim)' }}>TIMESTAMP</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-dim)' }}>VEHICLE</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-dim)' }}>ACTION</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-dim)' }}>RISK DELTA</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-dim)' }}>PRIMARY FACTOR</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 12, color: 'var(--text-dim)' }}>OVERRIDE</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(d.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{d.vehicle}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {d.action === 'reroute' ? <Zap size={14} color="var(--primary)" /> : <AlertTriangle size={14} color="var(--warning)" />}
                      <span style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>{d.action.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--danger)' }}>{d.riskBefore}%</span>
                      <ChevronRight size={12} color="var(--text-dim)" />
                      <span style={{ color: 'var(--success)' }}>{d.riskAfter || '--'}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 13 }}>{d.factor}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    {d.overridden ? <AlertTriangle size={16} color="var(--danger)" /> : <CheckCircle size={16} color="var(--success)" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
