import { useState } from 'react';
import { X, Truck, Search, Check, Loader2 } from 'lucide-react';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useUIStore } from '../../stores/uiStore';
import { assignDriver } from '../../services/api';
import { Driver } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
  onSuccess: () => void;
}

export default function AssignVehicleModal({ isOpen, onClose, driver, onSuccess }: Props) {
  const { vehicles } = useVehicleStore();
  const { showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !driver) return null;

  const availableVehicles = vehicles.filter(v => 
    !v.currentDriverId && 
    (v.id.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAssign = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await assignDriver(selectedId, driver.id);
      showToast(`Vehicle ${selectedId} assigned to ${driver.name}`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast('Failed to assign vehicle', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ width: 450, padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Assign Vehicle</h3>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Assigning to {driver.name}</div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              placeholder="Search available vehicles..." 
              className="form-input" 
              style={{ width: '100%', paddingLeft: 36, fontSize: 13 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }} className="custom-scrollbar">
            {availableVehicles.length > 0 ? availableVehicles.map(v => (
              <div 
                key={v.id} 
                className={`vehicle-pick-card ${selectedId === v.id ? 'active' : ''}`}
                onClick={() => setSelectedId(v.id)}
                style={{
                  padding: 12, borderRadius: 10, border: `1px solid ${selectedId === v.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedId === v.id ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s'
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 }}>
                  <Truck size={18} color={selectedId === v.id ? 'var(--primary)' : 'var(--text-dim)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{v.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{v.model} · <span style={{ textTransform: 'uppercase' }}>{v.vehicleType}</span></div>
                </div>
                {selectedId === v.id && <Check size={18} color="var(--primary)" />}
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: 13 }}>
                No unassigned vehicles found
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 2 }} 
            onClick={handleAssign}
            disabled={!selectedId || loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Assignment'}
          </button>
        </div>
      </div>

      <style>{`
        .vehicle-pick-card:hover { border-color: var(--primary-border); background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
