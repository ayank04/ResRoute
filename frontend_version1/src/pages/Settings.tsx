import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { RotateCcw } from 'lucide-react';

export default function Settings() {
  const {
    settings,
    isLoading,
    syncStatus,
    initialize,
    persistSettings,
    updateThreshold,
    updateWeights,
    updateSetting,
    resetToDefaults,
  } = useSettingsStore();
  const { showToast } = useUIStore();
  const w = settings.weights;
  const totalWeight = w.time + w.cost + w.risk + w.carbon;

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Preview metrics update as weights change
  const previewEta = Math.round(20 + (100 - w.time) * 0.15);
  const previewRisk = Math.round(15 + (100 - w.risk) * 0.5);
  const previewCarbon = +(0.1 + (100 - w.carbon) * 0.003).toFixed(2);

  function handleWeightChange(key: keyof typeof w, val: number) {
    updateWeights({ [key]: val });
  }

  const weightConfig = [
    { key: 'time' as const, label: 'Time', color: '#3b82f6', emoji: '⏱️' },
    { key: 'cost' as const, label: 'Cost', color: '#f59e0b', emoji: '💰' },
    { key: 'risk' as const, label: 'Risk', color: '#ef4444', emoji: '⚡' },
    { key: 'carbon' as const, label: 'Carbon', color: '#10b981', emoji: '🌱' },
  ];

  async function handleSaveSettings() {
    const ok = await persistSettings();
    showToast(ok ? 'Settings saved' : 'Failed to save settings', ok ? 'success' : 'error');
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Settings</h2>
            <p>AI customization, objective weights & vehicle configuration</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { void handleSaveSettings(); }}>
              Save Settings
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { resetToDefaults(); showToast('Settings reset to defaults', 'info'); }}>
              <RotateCcw size={14} /> Reset to Defaults
            </button>
          </div>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-dim)' }}>
          {isLoading ? 'Loading settings...' : `Sync status: ${syncStatus}`}
        </div>
      </div>

      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Objective Weights */}
        <div className="card">
          <div className="card-title">🎯 Objective Weights</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
            Total: <span style={{ fontWeight: 700, color: totalWeight === 100 ? 'var(--success)' : 'var(--danger)' }}>{totalWeight}%</span>
            {totalWeight !== 100 && <span style={{ color: 'var(--danger)' }}> (must equal 100)</span>}
          </div>
          <div className="weight-slider-group">
            {weightConfig.map(({ key, label, color, emoji }) => (
              <div key={key} className="weight-row">
                <div className="weight-label">{emoji} {label}</div>
                <div className="weight-bar">
                  <input
                    type="range" min={5} max={70} value={w[key]}
                    onChange={e => handleWeightChange(key, Number(e.target.value))}
                    style={{ width: '100%', accentColor: color }}
                  />
                </div>
                <div className="weight-value" style={{ color }}>{w[key]}%</div>
              </div>
            ))}
          </div>

          {/* Live Preview */}
          <div style={{ marginTop: 20, padding: '14px', background: 'var(--card-bg-2)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>LIVE ROUTE PREVIEW</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Est. ETA', val: `${previewEta} min`, color: 'var(--primary)' },
                { label: 'Risk Score', val: `${previewRisk}%`, color: previewRisk < 40 ? 'var(--success)' : previewRisk < 65 ? 'var(--warning)' : 'var(--danger)' },
                { label: 'CO₂', val: `${previewCarbon} kg`, color: 'var(--success)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk & XAI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-title">⚠️ Risk Threshold</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>Reroute suggested when risk exceeds:</span>
              <span style={{ fontWeight: 700, color: 'var(--warning)', fontFamily: 'JetBrains Mono, monospace' }}>{settings.riskThreshold.toFixed(2)}</span>
            </div>
            <input type="range" min={0.1} max={0.95} step={0.05} value={settings.riskThreshold}
              onChange={e => updateThreshold(Number(e.target.value))} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
              <span>0.1 (aggressive)</span><span>0.95 (conservative)</span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🧠 XAI Explanation Level</div>
            <select className="form-input form-select" value={settings.xaiLevel}
              onChange={e => updateSetting('xaiLevel', e.target.value as 'simple' | 'detailed' | 'full')}>
              <option value="simple">Simple — Key bullet points only</option>
              <option value="detailed">Detailed — Includes model reasoning</option>
              <option value="full">Full — Feature importances + counterfactuals</option>
            </select>
          </div>

          <div className="card">
            <div className="card-title">🔮 Predictive Model Settings</div>
            <div className="form-group">
              <label className="form-label">Forecast Horizon</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span>Predict disruptions up to:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace' }}>{settings.forecastHorizonMinutes} min</span>
              </div>
              <input type="range" min={15} max={60} step={15} value={settings.forecastHorizonMinutes}
                onChange={e => updateSetting('forecastHorizonMinutes', Number(e.target.value))} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                <span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 8 }}>
              <div style={{ position: 'relative', width: 40, height: 22 }}>
                <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }}
                  checked={settings.autoPreemptEnabled}
                  onChange={e => updateSetting('autoPreemptEnabled', e.target.checked)} />
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 11,
                  background: settings.autoPreemptEnabled ? 'var(--primary)' : 'var(--border)',
                  transition: '0.2s', cursor: 'pointer',
                }} onClick={() => updateSetting('autoPreemptEnabled', !settings.autoPreemptEnabled)}>
                  <div style={{
                    position: 'absolute', top: 3, left: settings.autoPreemptEnabled ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: '0.2s',
                  }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Auto pre-empt when confidence &gt; 80%</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>When off, dispatcher must approve</div>
              </div>
            </label>
          </div>
        </div>

        {/* Vehicle Fuel Types */}
        <div className="card chart-full" style={{ gridColumn: '1 / -1' }}>
          <div className="card-title">🚗 Carbon Tracking — Vehicle Fuel Types</div>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                {['Driver / Vehicle', 'Fuel Type', 'CO₂ per km (kg)'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settings.vehicleFuelTypes.map((vf, i) => {
                const driverName = ['Rajan Kumar', 'Arjun Sharma', 'Priya Nair', 'Mohammed Irfan', 'Kavitha Reddy'][i] ?? vf.vehicleId;
                return (
                  <tr key={vf.vehicleId} style={{ borderBottom: '1px solid rgba(45,63,90,0.4)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{driverName}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <select className="form-input form-select" style={{ width: 140 }}
                        value={vf.fuelType}
                        onChange={e => {
                          const updated = settings.vehicleFuelTypes.map((v, j) => j === i ? { ...v, fuelType: e.target.value as typeof v.fuelType } : v);
                          updateSetting('vehicleFuelTypes', updated);
                        }}>
                        <option value="petrol">⛽ Petrol</option>
                        <option value="diesel">🛢️ Diesel</option>
                        <option value="electric">⚡ Electric</option>
                        <option value="cng">🌿 CNG</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <input type="number" className="form-input" style={{ width: 100 }} min={0} max={1} step={0.01}
                        value={vf.co2PerKm}
                        onChange={e => {
                          const updated = settings.vehicleFuelTypes.map((v, j) => j === i ? { ...v, co2PerKm: Number(e.target.value) } : v);
                          updateSetting('vehicleFuelTypes', updated);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Demo Mode */}
        <div className="card chart-full" style={{ gridColumn: '1 / -1' }}>
          <div className="card-title">🎬 Demo Mode</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div className="form-label">Animation Speed</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="range" min={0.5} max={3} step={0.5} value={settings.demoAnimationSpeed}
                  onChange={e => updateSetting('demoAnimationSpeed', Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace', minWidth: 30 }}>{settings.demoAnimationSpeed}×</span>
              </div>
            </div>
            <div>
              <div className="form-label">API Mode</div>
              <select className="form-input form-select" value={settings.apiMode}
                onChange={e => updateSetting('apiMode', e.target.value as 'mock' | 'live')}>
                <option value="mock">🎭 Mock Data (Demo)</option>
                <option value="live">🔴 Live API</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
