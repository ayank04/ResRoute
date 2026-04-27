import { useState } from 'react';
import { Glasses, X } from 'lucide-react';
import { useRouteStore } from '../../stores/routeStore';

export default function ARPreviewButton() {
  const [open, setOpen] = useState(false);
  const { currentRoute } = useRouteStore();
  
  const riskiest = currentRoute?.segments 
    ? [...currentRoute.segments].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0] 
    : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(167,139,250,0.2)',
          color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(167,139,250,0.3)',
        } as React.CSSProperties}
        title="AR Preview"
      >
        <Glasses size={18} />
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🥽 AR Segment Preview</h3>
              <button className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {riskiest && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--card-bg-2)', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Riskiest segment: </span>
                  <strong style={{ color: 'var(--risk-high)' }}>{riskiest.id}</strong>
                  <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>Risk score: </span>
                  <strong>{((riskiest.riskScore || 0) * 100).toFixed(0)}%</strong>
                </div>
              )}
              <div style={{
                height: 280, borderRadius: 12, background: 'linear-gradient(135deg, #0d1520, #1a2744)',
                border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', overflow: 'hidden'
              }}>
                {/* Simulated AR grid overlay */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.08,
                  backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
                <div style={{ fontSize: 48 }}>🥽</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>AR View — Simulated</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320 }}>
                  In production, this would render a live 3D street-level view of the segment using WebXR or Google Street View Embed API.
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-dim)' }}>
                  <span>📍 {riskiest?.start?.lat?.toFixed(4) || '0.0000'}, {riskiest?.start?.lng?.toFixed(4) || '0.0000'}</span>
                  <span>→</span>
                  <span>📍 {riskiest?.end?.lat?.toFixed(4) || '0.0000'}, {riskiest?.end?.lng?.toFixed(4) || '0.0000'}</span>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
                ⚠️ High-risk zone: Reduced visibility, congestion likely. Consider alternate route.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
