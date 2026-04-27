import { 
  ArrowLeft, Star, Clock, MapPin, Navigation, 
  TrendingUp, TrendingDown, Minus, ShieldAlert,
  Zap, Lock, Unlock, AlertCircle, History, Info, Settings
} from 'lucide-react';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useRouteStore } from '../../stores/routeStore';
import { useDriverStore } from '../../stores/driverStore';
import { useUIStore } from '../../stores/uiStore';
import { Vehicle, Driver, Route } from '../../types';
import { 
  lockVehicle, 
  unlockVehicle, 
  setPriority, 
  rerouteVehicle 
} from '../../services/api';

interface Props {
  vehicle: Vehicle;
  onBack: () => void;
}

const statusColor: Record<string, string> = { 
  on_trip: '#3b82f6', 
  EN_ROUTE: '#3b82f6', 
  available: '#10b981', 
  IDLE: '#94a3b8', 
  offline: '#64748b', 
  break: '#f59e0b',
  COMPLETED: '#10b981' 
};

export default function DriverDetailPanel({ vehicle, onBack }: Props) {
  const routes = useRouteStore(s => s.routes);
  const drivers = useDriverStore(s => s.drivers);
  const { showToast } = useUIStore();
  const { updateVehicle } = useVehicleStore();

  const driver = drivers.find(d => d.id === vehicle.currentDriverId) || 
                 drivers.find(d => d.name === vehicle.name); // Fallback
  
  const route = routes.find(r => r.driverId === vehicle.id && r.status === 'ACTIVE');

  const riskColor = vehicle.riskScore < 35 ? '#00e676' : 
                    vehicle.riskScore < 65 ? '#ffb300' : '#ff3d57';

  const progress = route ? Math.min(Math.round((route.rerouteCount + 1) * 15), 100) : 0; // Simulated progress

  const handleToggleLock = async () => {
    try {
      if (vehicle.isLocked) {
        await unlockVehicle(vehicle.id);
      } else {
        await lockVehicle(vehicle.id, { lockedBy: 'Dispatcher', reason: 'Security Protocol' });
      }
      updateVehicle({ id: vehicle.id, isLocked: !vehicle.isLocked });
      showToast(`Vehicle ${vehicle.id} ${!vehicle.isLocked ? 'locked' : 'unlocked'}`, 'info');
    } catch (err) {
      showToast('Failed to update vehicle lock status', 'error');
    }
  };

  const handlePriorityChange = async (priority: string) => {
    try {
      await setPriority(vehicle.id, priority);
      updateVehicle({ id: vehicle.id, priority: priority as any });
      showToast(`Priority set to ${priority}`, 'success');
    } catch (err) {
      showToast('Failed to set priority', 'error');
    }
  };

  const handleForceReroute = async () => {
    try {
      await rerouteVehicle(vehicle.id, 'Manual override by dispatcher');
      showToast('Reroute requested', 'success');
    } catch (err) {
      showToast('Reroute request failed', 'error');
    }
  };

  return (
    <div className="driver-detail-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <button onClick={onBack} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 0, marginBottom: 16, color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={16} /> All Drivers
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={vehicle.avatar || `https://i.pravatar.cc/150?u=${vehicle.id}`} className="avatar avatar-lg" alt={vehicle.name} style={{ width: 56, height: 56, borderRadius: 12, border: `2px solid ${statusColor[vehicle.status]}` }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{vehicle.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{vehicle.id} · {vehicle.licensePlate}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= (driver?.rating || 4) ? '#fbbf24' : 'none'} color="#fbbf24" />)}
              </div>
            </div>
          </div>
          <span className="badge" style={{ background: `${statusColor[vehicle.status]}20`, color: statusColor[vehicle.status], border: `1px solid ${statusColor[vehicle.status]}44` }}>
            {vehicle.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="custom-scrollbar">
        {/* Current Trip */}
        <section className="detail-section">
          <div className="section-title"><Navigation size={14} /> CURRENT TRIP</div>
          {route ? (
            <div className="card-glass" style={{ padding: 16, marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} color="var(--success)" />
                  <div style={{ width: 2, flex: 1, background: 'var(--border)', borderStyle: 'dashed' }} />
                  <MapPin size={14} color="var(--danger)" />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Origin</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{route.origin}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Destination</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{route.destination}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Route Progress</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{progress}%</span>
                </div>
                <div className="progress-bg" style={{ height: 6, borderRadius: 3 }}>
                  <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--primary)', height: '100%', borderRadius: 3, boxShadow: 'var(--shadow-glow)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>ETA</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{route.etaMinutes} mins</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>REMAINING</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{(route.distanceKm * (1 - progress/100)).toFixed(1)} km</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 12, marginTop: 12 }}>
              No active trip for this vehicle
            </div>
          )}
        </section>

        {/* Risk Analysis */}
        <section className="detail-section" style={{ marginTop: 24 }}>
          <div className="section-title"><ShieldAlert size={14} /> RISK ANALYSIS</div>
          <div className="card-glass" style={{ padding: 16, marginTop: 12, borderLeft: `4px solid ${riskColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: riskColor }}>{vehicle.riskScore}%</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Current Risk Score</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: vehicle.riskTrend === 'rising' ? 'var(--danger)' : 'var(--success)' }}>
                  {vehicle.riskTrend === 'rising' ? <TrendingUp size={12} /> : vehicle.riskTrend === 'falling' ? <TrendingDown size={12} /> : <Minus size={12} />}
                  <span style={{ marginLeft: 4 }}>{vehicle.riskTrend || 'stable'}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 8 }}>Primary factor: <span style={{ color: '#fff' }}>Traffic Density</span></div>
              </div>
            </div>
            
            {/* Sparkline Placeholder */}
            <div style={{ height: 40, marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {[30, 35, 32, 40, 45, 42, 38, 35].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: riskColor, opacity: 0.3 + (i * 0.1), borderRadius: '2px 2px 0 0' }} />
              ))}
            </div>

            <div style={{ marginTop: 16, padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, display: 'flex', gap: 8 }}>
              <Info size={14} style={{ flexShrink: 0 }} />
              <div>AI Reasoning: High congestion detected at Koramangala 80ft Rd intersection. Reroute suggested to avoid 12m delay.</div>
            </div>
          </div>
        </section>

        {/* Vehicle Info */}
        <section className="detail-section" style={{ marginTop: 24 }}>
          <div className="section-title"><Zap size={14} /> VEHICLE & IMPACT</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div className="card-glass" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>MODEL</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{vehicle.model}</div>
            </div>
            <div className="card-glass" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>FUEL TYPE</div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{vehicle.fuelType}</div>
            </div>
            <div className="card-glass" style={{ padding: 12, gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>CO₂ SAVED THIS TRIP</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>{route?.carbonSavedKg || 0} kg</div>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.1)', padding: 8, borderRadius: 8 }}>
                  🌱
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="detail-section" style={{ marginTop: 24 }}>
          <div className="section-title"><Settings size={14} /> ACTIONS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <button className="btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'none' }} onClick={handleForceReroute}>
              Force Reroute
            </button>
            <button className={`btn ${vehicle.isLocked ? 'btn-primary' : ''}`} onClick={handleToggleLock}>
              {vehicle.isLocked ? <Lock size={14} /> : <Unlock size={14} />} {vehicle.isLocked ? 'Unlock' : 'Lock'}
            </button>
            <div style={{ gridColumn: 'span 2' }}>
              <select 
                className="form-input" 
                style={{ width: '100%', fontSize: 12 }}
                value={vehicle.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
              >
                <option value="normal">Set Priority: Normal</option>
                <option value="critical">Critical</option>
                <option value="low">Low</option>
              </select>
            </div>
            <button className="btn btn-ghost" style={{ gridColumn: 'span 2', background: 'rgba(239,68,68,0.05)', color: 'var(--danger)' }}>
              Mark as Emergency
            </button>
          </div>
        </section>

        {/* Activity */}
        <section className="detail-section" style={{ marginTop: 24, marginBottom: 20 }}>
          <div className="section-title"><History size={14} /> RECENT ACTIVITY</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { time: '2m ago', event: 'Risk updated to 35% (Traffic)', type: 'risk' },
              { time: '15m ago', event: 'Rerouted via 100ft Rd', type: 'route' },
              { time: '42m ago', event: 'Trip started from Koramangala', type: 'system' }
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                <div style={{ color: 'var(--text-dim)', width: 45, flexShrink: 0 }}>{e.time}</div>
                <div style={{ color: 'var(--text)' }}>{e.event}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .detail-section { margin-bottom: 12px; }
        .section-title { font-size: 10px; font-weight: 800; color: var(--text-dim); display: flex; alignItems: center; gap: 6; letter-spacing: 0.05em; }
        .card-glass { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; }
        .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
      `}</style>
    </div>
  );
}
