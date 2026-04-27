import { Clock } from 'lucide-react';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function TimeSlider({ value, onChange }: Props) {
  return (
    <div className="time-slider-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <Clock size={14} />
          <span>Predictive Horizon</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace' }}>
          +{value} min
        </span>
      </div>
      <input
        type="range" min={0} max={60} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
        <span>Now</span><span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span>
      </div>
    </div>
  );
}
