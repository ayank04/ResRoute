import { X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSettingsStore } from '../../stores/settingsStore';
import { useRouteStore } from '../../stores/routeStore';

const weights_data_colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'];

export default function XAIExplainPopup({ onClose }: { onClose: () => void }) {
  const { settings } = useSettingsStore();
  const { currentRoute } = useRouteStore();
  const w = settings.weights;

  const weightData = [
    { name: 'Time', value: w.time, fill: '#3b82f6' },
    { name: 'Cost', value: w.cost, fill: '#f59e0b' },
    { name: 'Risk', value: w.risk, fill: '#ef4444' },
    { name: 'Carbon', value: w.carbon, fill: '#10b981' },
  ];

  const bulletPoints = [
    '🚦 Traffic build-up predicted near Silk Board junction in 25 min (confidence: 87%)',
    '⏱️ Current route delay: +15 min. Alternative via Indiranagar adds only 2 km.',
    '✅ Reroute reduces risk score from 78% → 41% by bypassing congestion zone.',
    '🌿 Alternative route saves 0.4 kg CO₂ due to smoother traffic flow and shorter idle time.',
    '💰 Estimated cost impact: −₹12 in fuel savings on rerouted path.',
    `📊 Route selected based on weights: Time (${w.time}%), Risk (${w.risk}%), Carbon (${w.carbon}%), Cost (${w.cost}%).`,
  ];

  const detailed = [
    '🔍 Historical data (last 30 days): Silk Board sees 72% congestion probability on weekday evenings.',
    '📡 Live sensor data: 3 incidents reported in 15 km radius in the last hour.',
    '🤖 Model: Gradient Boosted Risk Estimator v2.1, trained on 180,000 Bengaluru delivery records.',
  ];

  const full = [
    '📈 Feature importances: Time-of-day (0.34), Historical incidents (0.28), Weather (0.18), Road grade (0.12), Driver fatigue (0.08).',
    '🎯 Prediction interval: Risk 41% [34%–52%] at 95% confidence.',
    '🔄 Counterfactual: Without reroute, 89% chance of exceeding 65% risk threshold.',
  ];

  const level = settings.xaiLevel;
  const points = level === 'simple' ? bulletPoints.slice(0, 3) : level === 'detailed' ? [...bulletPoints, ...detailed] : [...bulletPoints, ...detailed, ...full];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🧠 XAI Route Explanation</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>Level:</span>
            <span style={{ background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
              {settings.xaiLevel.toUpperCase()}
            </span>
            {currentRoute && <span style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>Route #{currentRoute.id}</span>}
          </div>

          <div style={{ marginBottom: 20 }}>
            {points.map((p, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, lineHeight: 1.5 }}>{p}</div>
            ))}
          </div>

          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>OBJECTIVE WEIGHT CONTRIBUTIONS</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weightData} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} width={50} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {weightData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
