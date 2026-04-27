import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea, ResponsiveContainer } from 'recharts';
import { useAnalyticsStore } from '../../stores/analyticsStore';

export default function RiskTrendChart() {
  const { analyticsData } = useAnalyticsStore();
  const data = analyticsData.riskTrend;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,63,90,0.5)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v.length > 10 ? v.slice(5, 10) : v.slice(5)} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
        <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceArea x1="2024-10-26T12:00" x2="2024-10-26T14:00" fill="rgba(167,139,250,0.08)" label={{ value: 'Predicted', fontSize: 10, fill: '#a78bfa' }} />
        <Line type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Historical Risk" />
        <Line type="monotone" dataKey="predicted" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} name="Predicted Risk" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
