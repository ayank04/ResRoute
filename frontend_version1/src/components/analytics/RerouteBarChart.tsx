import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { useAnalyticsStore } from '../../stores/analyticsStore';

const COLORS = ['#3b82f6', '#a78bfa', '#10b981', '#f59e0b', '#ef4444'];

export default function RerouteBarChart() {
  const { analyticsData } = useAnalyticsStore();
  const data = analyticsData.reroutesPerDriver.map((d: any) => ({ ...d, name: d.driverName.split(' ')[0] }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,63,90,0.5)" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Reroutes">
          {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
