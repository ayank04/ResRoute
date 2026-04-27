import { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down';
}

export default function KPICard({ label, value, sub, color = 'blue', icon, trend }: Props) {
  return (
    <div className={`kpi-card ${color}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value">{value}</div>
        </div>
        {icon && (
          <div style={{ 
            fontSize: '24px', 
            background: 'hsla(210, 40%, 98%, 0.05)', 
            padding: '10px', 
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            {icon}
          </div>
        )}
      </div>
      {sub && (
        <div className="kpi-sub" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          marginTop: 8,
          fontSize: '11px',
          fontWeight: 600,
          opacity: 0.8
        }}>
          {trend && (
            <span style={{ 
              color: trend === 'up' ? 'var(--success)' : 'var(--danger)',
              background: trend === 'up' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px'
            }}>
              {trend === 'up' ? '▲' : '▼'}
            </span>
          )}
          <span style={{ color: 'var(--text-dim)' }}>{sub}</span>
        </div>
      )}
    </div>
  );
}
