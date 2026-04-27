import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Leaf, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { useRouteStore } from '../../stores/routeStore';
import { useUIStore } from '../../stores/uiStore';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { rerouteVehicle } from '../../services/api';
import XAIExplainPopup from './XAIExplainPopup';

function getRiskClass(score: number) {
  if (score < 40) return 'risk-low';
  if (score < 65) return 'risk-medium';
  return 'risk-high';
}
function getRiskFill(score: number) {
  if (score < 40) return 'risk-fill-low';
  if (score < 65) return 'risk-fill-medium';
  return 'risk-fill-high';
}

export default function RiskTwinCard() {
  const { currentRoute, predictiveRouteSuggestion, reroute } = useRouteStore();
  const { showToast } = useUIStore();
  const { updateCarbonSaved, incrementReroutes } = useAnalyticsStore();
  const [showXAI, setShowXAI] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!currentRoute) return null;

  const risk = currentRoute.currentRiskScore;
  const hasPreemptive = !!predictiveRouteSuggestion;

  async function handleAcceptReroute() {
    setLoading(true);
    try {
      const newRoute = await rerouteVehicle(currentRoute!.driverId);
      
      // Dispatch event for map animation
      const event = new CustomEvent('reroute_event', { 
        detail: { oldRoute: currentRoute, newRoute } 
      });
      window.dispatchEvent(event);

      reroute(newRoute, 'Pre-emptive reroute accepted by dispatcher');
      updateCarbonSaved(newRoute.carbonSavedKg);
      incrementReroutes();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reroute vehicle', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="card" style={{ margin: 0, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)' }}>
        <div className="card-title" style={{ marginBottom: 16 }}>🧠 Risk Twin</div>

        {hasPreemptive && (
          <div className="alert-banner alert-warning" style={{ marginBottom: 12 }}>
            <AlertTriangle size={16} />
            <span style={{ fontSize: 12 }}>Pre-emptive reroute ready — traffic in 25 min</span>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Risk</span>
            <span className={`${getRiskClass(risk)}`} style={{ fontSize: 22, fontWeight: 800 }}>{Math.round(risk)}%</span>
          </div>
          <div className="risk-meter">
            <div className={`risk-fill ${getRiskFill(risk)}`} style={{ width: `${risk}%` }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />ETA</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{currentRoute.etaMinutes} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>min</span></div>
            {hasPreemptive && <div style={{ fontSize: 11, color: 'var(--success)' }}>→ {predictiveRouteSuggestion!.etaMinutes} min</div>}
          </div>
          <div style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}><Leaf size={11} style={{ display: 'inline', marginRight: 4 }} />CO₂ Saved</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{currentRoute.carbonSavedKg} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>kg</span></div>
            {hasPreemptive && <div style={{ fontSize: 11, color: 'var(--success)' }}>→ +{predictiveRouteSuggestion!.carbonSavedKg} kg</div>}
          </div>
        </div>

        {hasPreemptive && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>💡 Suggestion via Indiranagar</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Risk: {risk}% → <strong style={{ color: 'var(--success)' }}>{predictiveRouteSuggestion!.currentRiskScore}%</strong> &nbsp;|&nbsp; 
              ETA: {predictiveRouteSuggestion!.etaMinutes - currentRoute.etaMinutes} min
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {hasPreemptive && (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAcceptReroute} disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {loading ? 'Processing...' : 'Accept'}
            </button>
          )}
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowXAI(true)}>
            <ChevronRight size={15} /> Explain
          </button>
        </div>

        {currentRoute.rerouteCount > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
            Rerouted {currentRoute.rerouteCount}× this trip · {currentRoute.distanceKm.toFixed(1)} km
          </div>
        )}
      </div>

      {showXAI && <XAIExplainPopup onClose={() => setShowXAI(false)} />}
    </>
  );
}
