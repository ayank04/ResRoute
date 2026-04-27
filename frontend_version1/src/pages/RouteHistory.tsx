import { useEffect } from 'react';
import { useHistoryStore } from '../stores/historyStore';
import { useDriverStore } from '../stores/driverStore';
import HistoryTable from '../components/history/HistoryTable';
import RouteComparisonModal from '../components/history/RouteComparisonModal';
import { Download, Filter } from 'lucide-react';

export default function RouteHistory() {
  const { filters, setFilters, filteredDeliveries, exportCSV, setSelectedDelivery, selectedDelivery, fetchDeliveries } = useHistoryStore();
  const drivers = useDriverStore(s => s.drivers);
  const deliveries = filteredDeliveries();

  useEffect(() => {
    void fetchDeliveries();
  }, [fetchDeliveries]);

  const totalDeliveries = deliveries.length;
  const avgDelay = deliveries.length ? Math.round(deliveries.reduce((a, d) => a + (d.actualEtaMinutes - d.originalEtaMinutes), 0) / deliveries.length) : 0;
  const rerouteSuccess = deliveries.filter(d => d.wasRerouted && d.driverAcceptedReroute).length;
  const carbonTotal = deliveries.reduce((a, d) => a + d.carbonDeltaKg, 0);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Route History</h2>
            <p>Audit trail, XAI summaries, and delivery analytics</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '16px 28px' }}>
        {[
          { label: 'Total Deliveries', val: totalDeliveries, color: 'var(--primary)' },
          { label: 'Avg Delay', val: `${avgDelay > 0 ? '+' : ''}${avgDelay} min`, color: avgDelay > 0 ? 'var(--danger)' : 'var(--success)' },
          { label: 'Reroute Accepted', val: rerouteSuccess, color: 'var(--success)' },
          { label: 'Total CO₂ Saved', val: `${carbonTotal.toFixed(2)} kg`, color: 'var(--success)' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: '0 28px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={14} color="var(--text-dim)" />
        <select className="form-input form-select" style={{ width: 180 }} value={filters.driverId ?? ''} onChange={e => setFilters({ driverId: e.target.value || null })}>
          <option value="">All Drivers</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.reroutedOnly} onChange={e => setFilters({ reroutedOnly: e.target.checked })} />
          Rerouted Only
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.predictedOnly} onChange={e => setFilters({ predictedOnly: e.target.checked })} />
          Predicted Disruption Only
        </label>
        <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ driverId: null, reroutedOnly: false, predictedOnly: false })}>
          Clear Filters
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 'auto' }}>
          Showing {deliveries.length} records
        </span>
      </div>

      {/* Table */}
      <div style={{ padding: '0 28px 20px' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <HistoryTable deliveries={deliveries} onRowClick={setSelectedDelivery} />
        </div>
      </div>

      {/* Learning Dashboard */}
      <div style={{ padding: '0 28px 28px' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>📚 Learning Dashboard</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Top 3 Reroute Reasons</div>
              {['Silk Board traffic congestion', 'Accident on ORR', 'Rain – reduced visibility'].map((r, i) => (
                <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid rgba(45,63,90,0.4)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{i + 1}.</span> {r}
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Most Avoided Segments</div>
              {['Silk Board Junction', 'Marathahalli Bridge', 'Hosur Road Phase 1'].map((s, i) => (
                <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid rgba(45,63,90,0.4)', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{i + 1}.</span> {s}
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--card-bg-2)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Driver Feedback Trends</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>92%</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>rated reroutes as helpful</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>4.3 ★</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>avg route quality rating</div>
            </div>
          </div>
        </div>
      </div>

      {selectedDelivery && (
        <RouteComparisonModal delivery={selectedDelivery} onClose={() => setSelectedDelivery(null)} />
      )}
    </div>
  );
}
