import { useState } from 'react';
import { X, Route } from 'lucide-react';
import { Driver } from '../../types';
import { useUIStore } from '../../stores/uiStore';

interface Props { driver: Driver; onClose: () => void; }

export default function AssignRouteModal({ driver, onClose }: Props) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [ecoMode, setEcoMode] = useState(false);
  const { showToast } = useUIStore();

  const eta = origin && destination ? (ecoMode ? 32 : 24) : null;
  const carbon = origin && destination ? (ecoMode ? 0.18 : 0.31) : null;
  const risk = origin && destination ? (ecoMode ? 28 : 44) : null;

  function handleAssign() {
    if (!origin || !destination) return;
    showToast(`✅ Route assigned to ${driver.name}: ${origin} → ${destination} (${ecoMode ? 'Eco' : 'Fast'} mode)`, 'success');
    onClose();
  }

  const zones = ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Jayanagar', 'MG Road', 'Bannerghatta', 'Marathahalli', 'Electronic City', 'Yelahanka'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Route — {driver.name}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Origin</label>
            <select className="form-input form-select" value={origin} onChange={e => setOrigin(e.target.value)}>
              <option value="">Select origin…</option>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Destination</label>
            <select className="form-input form-select" value={destination} onChange={e => setDestination(e.target.value)}>
              <option value="">Select destination…</option>
              {zones.filter(z => z !== origin).map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className={`btn btn-sm ${!ecoMode ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setEcoMode(false)}>⚡ Fastest</button>
            <button className={`btn btn-sm ${ecoMode ? 'btn-success' : 'btn-ghost'}`} onClick={() => setEcoMode(true)}>🌱 Eco Mode</button>
          </div>

          {/* Map preview placeholder with risk overlay hint */}
          <div style={{ height: 140, background: 'linear-gradient(135deg, #0d1520, #1a2744)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            {origin && destination ? (
              <div style={{ textAlign: 'center' }}>
                <Route size={24} color="var(--primary)" />
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{origin} → {destination}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  {ecoMode ? '🌱 Eco route via low-emission roads' : '⚡ Fastest route (Outer Ring Road)'}
                </div>
                {risk !== null && (
                  <div style={{ fontSize: 11, marginTop: 4, color: risk < 40 ? 'var(--success)' : risk < 65 ? 'var(--warning)' : 'var(--danger)' }}>
                    Predicted risk: {risk}%
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Select origin & destination to preview</div>
            )}
          </div>

          {/* Estimates */}
          {eta !== null && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { l: 'Est. ETA', v: `${eta} min` },
                { l: 'CO₂ Emission', v: `${carbon} kg` },
                { l: 'Risk Score', v: `${risk}%` },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAssign} disabled={!origin || !destination}>
              Assign Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
