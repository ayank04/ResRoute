import { useState } from 'react';
import { useDriverStore } from '../stores/driverStore';
import { Driver } from '../types';
import DriverTable from '../components/drivers/DriverTable';
import DriverDetailsModal from '../components/drivers/DriverDetailsModal';
import AssignRouteModal from '../components/drivers/AssignRouteModal';

export default function DriversManagement() {
  const drivers = useDriverStore(s => s.drivers);
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);
  const [assignDriver, setAssignDriver] = useState<Driver | null>(null);

  const highFatigue = drivers.filter(d => d.fatigueRisk === 'HIGH');

  return (
    <div>
      <div className="page-header">
        <h2>Driver Hub</h2>
        <p>Fleet status, performance, fatigue monitoring & route assignment</p>
      </div>

      {/* Fatigue banner */}
      {highFatigue.length > 0 && (
        <div style={{ padding: '0 28px', marginTop: 16 }}>
          {highFatigue.map(d => (
            <div key={d.id} className="alert-banner alert-warning" style={{ marginBottom: 8 }}>
              😴 <strong>{d.name}</strong> — Fatigue risk HIGH. Consider lighter route assignment or scheduled break.
            </div>
          ))}
        </div>
      )}

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, padding: '16px 28px' }}>
        {[
          { label: 'Total Drivers', val: drivers.length, color: 'var(--primary)' },
          { label: 'En Route', val: drivers.filter(d => d.status === 'EN_ROUTE').length, color: 'var(--success)' },
          { label: 'Idle', val: drivers.filter(d => d.status === 'IDLE').length, color: 'var(--text-muted)' },
          { label: 'Completed', val: drivers.filter(d => d.status === 'COMPLETED').length, color: 'var(--warning)' },
          { label: 'High Fatigue', val: highFatigue.length, color: 'var(--danger)' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 28px 28px' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <DriverTable
            drivers={drivers}
            onView={setViewDriver}
            onAssign={setAssignDriver}
          />
        </div>
      </div>

      {viewDriver && <DriverDetailsModal driver={viewDriver} onClose={() => setViewDriver(null)} />}
      {assignDriver && <AssignRouteModal driver={assignDriver} onClose={() => setAssignDriver(null)} />}
    </div>
  );
}
