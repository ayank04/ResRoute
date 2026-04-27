import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAnalyticsStore } from '../../stores/analyticsStore';

const COLORS = ['#ef4444', '#f59e0b', '#06b6d4'];

export default function DisruptionPieChart() {
  const { analyticsData } = useAnalyticsStore();
  const data = analyticsData.disruptionDistribution.map((d: any) => ({
    name: d.type,
    value: d.totalDelayMinutes,
    count: d.count,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}m`} labelLine={false}>
          {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
          formatter={(value, name, props) => [`${value} min delay · ${props.payload.count} incidents`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
