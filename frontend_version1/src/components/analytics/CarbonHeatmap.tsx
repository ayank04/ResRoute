import { useState } from 'react';
import { useAnalyticsStore } from '../../stores/analyticsStore';

function intensityToColor(v: number): string {
  // 0 = green, 1 = red via HSL
  const hue = Math.round((1 - v) * 120);
  return `hsl(${hue}, 70%, 35%)`;
}
function intensityToText(v: number): string {
  if (v < 0.25) return '#6ee7b7';
  if (v < 0.5) return '#fcd34d';
  return '#fca5a5';
}

export default function CarbonHeatmap() {
  const { analyticsData } = useAnalyticsStore();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div>
      <div className="carbon-grid">
        {analyticsData.carbonHeatmapData.map((zone: any) => (
          <div
            key={zone.zoneName}
            className="carbon-cell"
            style={{ background: intensityToColor(zone.co2Intensity), position: 'relative' }}
            onMouseEnter={() => setHovered(zone.zoneName)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="carbon-cell-name" style={{ color: '#fff', opacity: 0.8, fontSize: 10 }}>
              {zone.zoneName.split(' ')[0]}
            </div>
            <div className="carbon-cell-val" style={{ color: intensityToText(zone.co2Intensity), fontSize: 15 }}>
              {zone.co2Intensity.toFixed(2)}
            </div>
            <div style={{ fontSize: 9, color: '#ffffff80' }}>kg/km</div>
            {hovered === zone.zoneName && (
              <div style={{
                position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 6,
                padding: '6px 10px', fontSize: 11, whiteSpace: 'nowrap', zIndex: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}>
                <strong>{zone.zoneName}</strong><br />
                CO₂: {zone.co2Intensity} kg/km
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 11, color: 'var(--text-dim)' }}>
        <span>Low CO₂</span>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, hsl(120,70%,35%), hsl(60,70%,35%), hsl(0,70%,35%))' }} />
        <span>High CO₂</span>
      </div>
    </div>
  );
}
