import { useState } from 'react';
import { X } from 'lucide-react';
import { Driver } from '../../types';
import { useDriverStore } from '../../stores/driverStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

interface Props { driver: Driver; onClose: () => void; }

const perfData = [
  { day: 'Mon', risk: 42, onTime: 95, carbon: 0.22 },
  { day: 'Tue', risk: 38, onTime: 100, carbon: 0.18 },
  { day: 'Wed', risk: 55, onTime: 88, carbon: 0.31 },
  { day: 'Thu', risk: 48, onTime: 92, carbon: 0.24 },
  { day: 'Fri', risk: 61, onTime: 85, carbon: 0.28 },
  { day: 'Sat', risk: 35, onTime: 97, carbon: 0.19 },
  { day: 'Sun', risk: 30, onTime: 100, carbon: 0.15 },
];

const COLORS = ['#10b981', '#ef4444'];

export default function DriverDetailsModal({ driver, onClose }: Props) {
  const { addFeedback, feedbacks } = useDriverStore();
  const [note, setNote] = useState('');
  const driverFeedbacks = feedbacks.filter(f => f.driverId === driver.id);
  const acceptedPct = 75;

  function submitFeedback() {
    if (!note.trim()) return;
    addFeedback(driver.id, note.trim());
    setNote('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar avatar-blue" style={{ width: 44, height: 44, fontSize: 14 }}>{driver.avatar}</div>
            <div>
              <h3>{driver.name}</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{driver.vehicleType.toUpperCase()} · Since {driver.joinDate}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {driver.fatigueRisk === 'HIGH' && (
            <div className="alert-banner alert-warning" style={{ marginBottom: 16 }}>
              😴 Fatigue risk HIGH — consider lighter route assignment or break
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Deliveries', val: driver.totalDeliveries },
              { label: 'On-Time', val: `${driver.onTimeRate}%` },
              { label: 'Eco Score', val: driver.ecoScore },
              { label: 'Fatigue', val: driver.fatigueRisk },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Mini performance chart */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Performance (7-day)</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={perfData}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} hide />
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} dot={false} name="Risk%" />
                <Line type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={2} dot={false} name="OnTime%" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Badges */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Badges</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {driver.badges.map((b, i) => (
                <span key={i} style={{ background: 'var(--card-bg-2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 20, fontSize: 12 }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Acceptance donut */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16 }}>
            <PieChart width={80} height={80}>
              <Pie data={[{ value: acceptedPct }, { value: 100 - acceptedPct }]} innerRadius={25} outerRadius={38} dataKey="value" startAngle={90} endAngle={450}>
                <Cell fill="#10b981" /><Cell fill="#1e293b" />
              </Pie>
            </PieChart>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{acceptedPct}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reroute Acceptance Rate</div>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Dispatcher Notes</div>
            {driverFeedbacks.map((f, i) => (
              <div key={i} style={{ fontSize: 12, padding: '6px 10px', background: 'var(--card-bg-2)', borderRadius: 6, marginBottom: 6, color: 'var(--text-muted)' }}>
                {f.note} <span style={{ float: 'right', color: 'var(--text-dim)', fontSize: 10 }}>{new Date(f.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="form-input" placeholder="Add a note…" value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitFeedback()} />
              <button className="btn btn-primary btn-sm" onClick={submitFeedback}>Log</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
