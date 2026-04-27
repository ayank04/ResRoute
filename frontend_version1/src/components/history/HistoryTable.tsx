import { DeliveryRecord } from '../../types';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

interface Props {
  deliveries: DeliveryRecord[];
  onRowClick: (d: DeliveryRecord) => void;
}

function delay(r: DeliveryRecord) { return r.actualEtaMinutes - r.originalEtaMinutes; }
const dBadge = (d: boolean) => d
  ? <span className="badge badge-success"><CheckCircle size={10} /> Yes</span>
  : <span className="badge badge-medium">No</span>;
const aBadge = (v: boolean | null) =>
  v === null ? <span style={{ color: 'var(--text-dim)' }}>—</span>
  : v ? <CheckCircle size={14} color="var(--success)" /> : <XCircle size={14} color="var(--danger)" />;

export default function HistoryTable({ deliveries, onRowClick }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Delivery ID</th>
            <th>Driver</th>
            <th>Route</th>
            <th>Date</th>
            <th>Orig ETA</th>
            <th>Actual ETA</th>
            <th>Delay</th>
            <th>Risk Before→After</th>
            <th>Rerouted?</th>
            <th>Predicted?</th>
            <th>Accepted?</th>
            <th>CO₂ Δ</th>
            <th>XAI Summary</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map(r => {
            const d = delay(r);
            return (
              <tr key={r.id} onClick={() => onRowClick(r)}>
                <td><span className="mono" style={{ fontSize: 12, color: 'var(--primary)' }}>{r.deliveryId}</span></td>
                <td style={{ fontSize: 13 }}>{r.driverName}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.origin} → {r.destination}</td>
                <td style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                  {new Date(r.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td style={{ textAlign: 'center' }}>{r.originalEtaMinutes}m</td>
                <td style={{ textAlign: 'center' }}>{r.actualEtaMinutes}m</td>
                <td style={{ textAlign: 'center', fontWeight: 600, color: d > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {d > 0 ? `+${d}` : d}m
                </td>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--risk-high)' }}>{r.riskScoreBefore}%</span>
                  <span style={{ color: 'var(--text-dim)' }}> → </span>
                  <span style={{ color: 'var(--risk-low)' }}>{r.riskScoreAfter}%</span>
                </td>
                <td>{dBadge(r.wasRerouted)}</td>
                <td style={{ textAlign: 'center' }}>
                  {r.predictedDisruption ? <CheckCircle size={14} color="var(--primary)" /> : <MinusCircle size={14} color="var(--text-dim)" />}
                </td>
                <td style={{ textAlign: 'center' }}>{aBadge(r.driverAcceptedReroute)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: r.carbonDeltaKg > 0 ? 'var(--success)' : 'var(--text-dim)' }}>
                  {r.carbonDeltaKg > 0 ? `+${r.carbonDeltaKg}` : r.carbonDeltaKg} kg
                </td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--text-muted)' }} title={r.xaiSummary}>
                  {r.xaiSummary}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
