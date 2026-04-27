import { useEffect } from 'react';
import KPICard from '../components/analytics/KPICard';
import RiskTrendChart from '../components/analytics/RiskTrendChart';
import RerouteBarChart from '../components/analytics/RerouteBarChart';
import DisruptionPieChart from '../components/analytics/DisruptionPieChart';
import DriverLeaderboard from '../components/analytics/DriverLeaderboard';
import CarbonHeatmap from '../components/analytics/CarbonHeatmap';
import WhatIfSimulator from '../components/analytics/WhatIfSimulator';
import { useAnalyticsStore } from '../stores/analyticsStore';

export default function FleetAnalytics() {
  const { analyticsData, dateRange, setDateRange, fetchAnalytics } = useAnalyticsStore();
  const a = analyticsData;

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>Fleet Analytics</h2>
            <p>Insights, sustainability metrics & predictive performance</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="date" className="form-input" style={{ width: 140 }} value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
            <span style={{ color: 'var(--text-dim)' }}>–</span>
            <input type="date" className="form-input" style={{ width: 140 }} value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <KPICard label="Avg Fleet Risk" value={`${a.avgFleetRisk}%`} sub="Fleet-wide risk score" color="red" icon="⚡" trend={a.avgFleetRisk > 50 ? 'up' : 'down'} />
        <KPICard label="Reroutes This Week" value={a.totalReroutesWeek} sub="Optimal path adjustments" color="yellow" icon="🔀" />
        <KPICard label="On-Time Rate" value={`${a.onTimeRate}%`} sub="Performance vs SLA" color="green" icon="✅" trend="up" />
        <KPICard label="Active Drivers" value={a.activeDrivers} sub="Live on-road fleet" color="blue" icon="👤" />
        <KPICard label="Carbon Saved" value={`${a.carbonSavedMonthKg} kg`} sub="Sustainability impact" color="green" icon="🌱" trend="up" />
        <KPICard label="Predictive Accuracy" value={`${a.predictiveAccuracy}%`} sub="AI model confidence" color="purple" icon="🎯" trend="up" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card chart-full">
          <h3>Risk Trend — Historical vs Predicted</h3>
          <RiskTrendChart />
        </div>
        <div className="chart-card">
          <h3>Reroutes Per Driver</h3>
          <RerouteBarChart />
        </div>
        <div className="chart-card">
          <h3>Disruption Distribution (by Delay Minutes)</h3>
          <DisruptionPieChart />
        </div>
        <div className="chart-card chart-full">
          <h3>🏆 Driver Leaderboard — Resilience Score</h3>
          <DriverLeaderboard />
        </div>
        <div className="chart-card chart-full">
          <h3>🌍 Carbon Heatmap — Bengaluru Zones</h3>
          <CarbonHeatmap />
        </div>
        <div className="chart-card chart-full">
          <h3>🔬 What-If Fleet Simulator</h3>
          <WhatIfSimulator />
        </div>
      </div>

      {/* Learning section */}
      <div className="section-pad">
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>📚 Learning Insights — This Week</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { icon: '🚦', title: 'Top Reroute Reason', val: 'Silk Board traffic (11 times)' },
              { icon: '🗺️', title: 'Most Avoided Segment', val: 'ORR Marathahalli Bridge' },
              { icon: '💬', title: 'Driver Feedback Trend', val: '92% rated reroutes as helpful' },
            ].map(({ icon, title, val }) => (
              <div key={title} style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: '14px' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
