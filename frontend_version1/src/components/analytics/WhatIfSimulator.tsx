import { useState } from 'react';
import { Zap } from 'lucide-react';

interface SimResult { carbon: string; cost: string; time: string; }

export default function WhatIfSimulator() {
  const [scenario, setScenario] = useState('Add 5 electric bikes in Koramangala');
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);

  function simulate() {
    setLoading(true);
    setTimeout(() => {
      // Mock logic
      const lower = scenario.toLowerCase();
      const bikes = lower.includes('electric') ? true : false;
      setResult({
        carbon: bikes ? '−18.4 kg/month' : '−6.2 kg/month',
        cost: bikes ? '−₹3,200/month' : '−₹800/month',
        time: bikes ? '−2.1 min avg ETA' : '−0.8 min avg ETA',
      });
      setLoading(false);
    }, 900);
  }

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        Enter a fleet change scenario and see predicted impact.
      </div>
      <div className="form-group">
        <label className="form-label">Scenario</label>
        <input
          className="form-input"
          value={scenario}
          onChange={e => setScenario(e.target.value)}
          placeholder="e.g. Add 5 electric bikes in Koramangala"
        />
      </div>
      <button className="btn btn-primary btn-sm" onClick={simulate} disabled={loading}>
        <Zap size={13} /> {loading ? 'Simulating…' : 'Simulate'}
      </button>

      {result && (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'CO₂ Impact', value: result.carbon, color: 'var(--success)' },
            { label: 'Cost Impact', value: result.cost, color: 'var(--primary)' },
            { label: 'ETA Impact', value: result.time, color: 'var(--warning)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
