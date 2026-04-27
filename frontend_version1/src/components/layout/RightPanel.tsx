import { useState } from 'react';
import { Users, Zap, Search, Filter } from 'lucide-react';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useUIStore } from '../../stores/uiStore';
import DriverDetailPanel from '../drivers/DriverDetailPanel';

const statusColor: Record<string, string> = { 
  on_trip: '#3b82f6', 
  EN_ROUTE: '#3b82f6', 
  available: '#10b981', 
  IDLE: '#94a3b8', 
  offline: '#64748b', 
  break: '#f59e0b',
  COMPLETED: '#10b981' 
};

export default function RightPanel() {
  const { vehicles, selectedVehicleId, setSelectedVehicle } = useVehicleStore();
  const [search, setSearch] = useState('');

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  if (selectedVehicle) {
    return (
      <div className="right-panel" style={{ width: 400, borderLeft: '1px solid var(--border)', background: 'var(--card-bg)', height: '100%' }}>
        <DriverDetailPanel vehicle={selectedVehicle} onBack={() => setSelectedVehicle(null)} />
      </div>
    );
  }

  const filtered = vehicles.filter(v => 
    v.id.toLowerCase().includes(search.toLowerCase()) || 
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="right-panel" style={{ width: 400, borderLeft: '1px solid var(--border)', background: 'var(--card-bg)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--primary)" />
            Active Fleet
          </div>
          <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>{vehicles.length} LIVE</span>
        </div>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search drivers or IDs..." 
            className="form-input" 
            style={{ width: '100%', paddingLeft: 36, fontSize: 13 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)' }}>
            <Filter size={12} style={{ marginRight: 4 }} /> Filter: All
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }} className="custom-scrollbar">
        {filtered.map(v => (
          <div 
            key={v.id} 
            className={`driver-card ${selectedVehicleId === v.id ? 'active' : ''}`}
            onClick={() => setSelectedVehicle(v.id)}
            style={{ 
              padding: '12px', 
              borderRadius: 12, 
              cursor: 'pointer', 
              marginBottom: 8,
              background: selectedVehicleId === v.id ? 'var(--primary-glow)' : 'transparent',
              border: `1px solid ${selectedVehicleId === v.id ? 'var(--primary)' : 'transparent'}`,
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <img src={v.avatar || `https://i.pravatar.cc/150?u=${v.id}`} className="avatar" alt={v.name} style={{ width: 40, height: 40, borderRadius: 10 }} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: statusColor[v.status], border: '2px solid #0f172a' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>{v.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.vehicleType} · {v.status.replace('_', ' ')}</span>
                  {v.riskScore > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: v.riskScore > 65 ? 'var(--danger)' : v.riskScore > 35 ? 'var(--warning)' : 'var(--success)' }}>
                      {v.riskScore}% Risk
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', gap: 8 }}
          onClick={async () => {
            try {
              const { rerouteAll } = await import('../../services/api');
              await rerouteAll();
              useUIStore.getState().showToast('Global optimization triggered', 'success');
            } catch (err) {
              useUIStore.getState().showToast('Optimization failed', 'error');
            }
          }}
        >
          <Zap size={16} /> REROUTE ALL OPTIMALLY
        </button>
      </div>

      <style>{`
        .driver-card:hover { background: rgba(255,255,255,0.03); }
        .driver-card.active { background: var(--primary-glow); border-color: var(--primary); }
      `}</style>
    </div>
  );
}
