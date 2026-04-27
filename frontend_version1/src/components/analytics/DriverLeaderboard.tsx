import { useDriverStore } from '../../stores/driverStore';

function resilienceScore(d: { onTimeRate: number; ecoScore: number; fatigueRisk: string }) {
  const fatigue = d.fatigueRisk === 'LOW' ? 1 : d.fatigueRisk === 'MEDIUM' ? 0.6 : 0.2;
  return Math.round((d.onTimeRate * 0.5 + d.ecoScore * 0.3 + fatigue * 100 * 0.2));
}

const rankStyle = ['gold', 'silver', 'bronze'];

export default function DriverLeaderboard() {
  const drivers = useDriverStore(s => s.drivers);
  const sorted = [...drivers].sort((a, b) => resilienceScore(b) - resilienceScore(a));

  return (
    <div>
      {sorted.map((d, i) => {
        const score = resilienceScore(d);
        return (
          <div key={d.id} className="leaderboard-row">
            <div className={`leaderboard-rank ${rankStyle[i] ?? ''}`}>#{i + 1}</div>
            <div className={`avatar avatar-blue`} style={{ fontSize: 12 }}>{d.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', gap: 8 }}>
                <span>🎯 {d.onTimeRate}%</span>
                <span>🌱 {d.ecoScore}</span>
                <span>{d.fatigueRisk === 'LOW' ? '😊' : d.fatigueRisk === 'MEDIUM' ? '😐' : '😴'}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                {d.badges.slice(0, 2).map((b, j) => (
                  <span key={j} style={{ fontSize: 10, background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 8 }}>{b}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{score}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Resilience</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
