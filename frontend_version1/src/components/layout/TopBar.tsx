import { useHealthStore } from '../../stores/healthStore';
import { useWebSocketContext } from '../../providers/WebSocketProvider';
import { Wifi, WifiOff, Activity } from 'lucide-react';

export default function TopBar() {
  const { status: wsStatus } = useWebSocketContext();
  const { status: healthStatus, uptimeSeconds } = useHealthStore();

  const wsConfig = {
    connected: { color: '#10b981', label: 'LIVE', icon: Wifi, bg: 'rgba(16,185,129,0.1)' },
    connecting: { color: '#f59e0b', label: 'RECONNECTING', icon: Wifi, bg: 'rgba(245,158,11,0.1)' },
    offline: { color: '#ef4444', label: 'OFFLINE', icon: WifiOff, bg: 'rgba(239,68,68,0.1)' },
  };

  const { color, label, icon: Icon, bg } = wsConfig[wsStatus] || wsConfig.offline;

  const healthLabels = {
    ok: { text: 'NOMINAL', color: '#10b981' },
    degraded: { text: 'DEGRADED', color: '#f59e0b' },
    critical: { text: 'CRITICAL', color: '#ef4444' },
    unknown: { text: 'UNKNOWN', color: 'var(--text-muted)' }
  };

  const health = healthLabels[healthStatus] || healthLabels.unknown;

  return (
    <div className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div 
          style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '4px 10px', borderRadius: 20, background: bg,
            border: `1px solid ${color}33`
          }}
        >
          <div className="status-dot" style={{ background: color, margin: 0, width: 6, height: 6 }} />
          <span style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: '0.05em' }}>{label}</span>
          <Icon size={12} color={color} />
        </div>
      </div>
      
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>SYSTEM HEALTH</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={10} color={health.color} />
            <span style={{ fontSize: 11, fontWeight: 700, color: health.color }}>{health.text}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>UPTIME</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text)' }}>
            {Math.floor(uptimeSeconds / 3600)}h {Math.floor((uptimeSeconds % 3600) / 60)}m
          </span>
        </div>
      </div>
    </div>
  );
}
