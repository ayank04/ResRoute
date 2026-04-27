import { useState } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { useDriverStore } from '../stores/driverStore';
import { useUIStore } from '../stores/uiStore';
import { Truck, Users, Search, Filter, MoreVertical, Plus, Star, MapPin, Phone } from 'lucide-react';
import AddDriverModal from '../components/drivers/AddDriverModal';
import AssignVehicleModal from '../components/drivers/AssignVehicleModal';
import { Driver } from '../types';

export default function FleetManagement() {
  const { vehicles, updateVehicle } = useVehicleStore();
  const { drivers } = useDriverStore();
  const { showToast } = useUIStore();
  
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('drivers');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState<Driver | null>(null);

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.id.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || v.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || d.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleUnassign = (vehicleId: string) => {
    updateVehicle({ id: vehicleId, currentDriverId: null });
    showToast(`Driver unassigned from ${vehicleId}`, 'info');
  };

  return (
    <div className="page-container" style={{ padding: '32px 40px' }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Fleet Management</h2>
            <p style={{ color: 'var(--text-dim)', margin: '4px 0 0 0' }}>Monitor and manage all Bengalurru-wide fleet assets</p>
          </div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button 
              className={`tab-btn ${activeTab === 'vehicles' ? 'active' : ''}`} 
              onClick={() => setActiveTab('vehicles')}
            >
              <Truck size={14} /> Vehicles
            </button>
            <button 
              className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`} 
              onClick={() => setActiveTab('drivers')}
            >
              <Users size={14} /> Drivers
            </button>
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            className="form-input" 
            style={{ width: '100%', paddingLeft: 40 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Filter size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <select className="form-input" style={{ paddingLeft: 40 }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              {activeTab === 'vehicles' ? (
                <>
                  <option value="EN_ROUTE">En Route</option>
                  <option value="IDLE">Idle</option>
                  <option value="COMPLETED">Completed</option>
                </>
              ) : (
                <>
                  <option value="available">Available</option>
                  <option value="on_trip">On Trip</option>
                  <option value="offline">Offline</option>
                  <option value="break">Break</option>
                </>
              )}
            </select>
          </div>
          {activeTab === 'drivers' && (
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} /> Add Driver
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
            {activeTab === 'vehicles' ? (
              <tr>
                <th className="th">ID / TYPE</th>
                <th className="th">MODEL</th>
                <th className="th">STATUS</th>
                <th className="th">CURRENT DRIVER</th>
                <th className="th">RISK</th>
                <th className="th" style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            ) : (
              <tr>
                <th className="th">DRIVER</th>
                <th className="th">CONTACT</th>
                <th className="th">STATUS</th>
                <th className="th">VEHICLE / ROUTE</th>
                <th className="th">RATING</th>
                <th className="th" style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            )}
          </thead>
          <tbody>
            {activeTab === 'vehicles' ? (
              filteredVehicles.map(v => (
                <tr key={v.id} className="tr">
                  <td className="td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="icon-box"><Truck size={18} color="var(--primary)" /></div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{v.id}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{v.vehicleType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td">{v.model}</td>
                  <td className="td">
                    <span className={`badge-status ${v.status}`}>{v.status.replace('_', ' ')}</span>
                  </td>
                  <td className="td">{v.name || 'Unassigned'}</td>
                  <td className="td">
                    <span style={{ color: v.riskScore > 65 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{v.riskScore}%</span>
                  </td>
                  <td className="td" style={{ textAlign: 'right' }}>
                    <button className="btn-icon"><MoreVertical size={16} /></button>
                  </td>
                </tr>
              ))
            ) : (
              filteredDrivers.map(d => (
                <tr key={d.id} className="tr">
                  <td className="td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={d.avatar} className="avatar" style={{ width: 36, height: 36 }} alt={d.name} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{d.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{d.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} /> {d.phone || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="td">
                    <span className={`badge-status ${d.status}`}>{d.status.replace('_', ' ')}</span>
                  </td>
                  <td className="td">
                    {d.currentVehicleId ? (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{d.currentVehicleId}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{d.activeRouteId ? 'On Active Route' : 'Ready to Start'}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>None Assigned</span>
                    )}
                  </td>
                  <td className="td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} fill="#fbbf24" color="#fbbf24" />
                      <span style={{ fontWeight: 600 }}>{d.rating || '4.8'}</span>
                    </div>
                  </td>
                  <td className="td" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {d.currentVehicleId ? (
                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleUnassign(d.currentVehicleId!)}>Unassign</button>
                      ) : (
                        <button className="btn btn-sm btn-primary" onClick={() => setAssigningDriver(d)}>Assign</button>
                      )}
                      <button className="btn-icon"><MoreVertical size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddDriverModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {}} 
      />

      <AssignVehicleModal 
        isOpen={!!assigningDriver} 
        onClose={() => setAssigningDriver(null)} 
        driver={assigningDriver} 
        onSuccess={() => {}} 
      />

      <style>{`
        .tab-btn { padding: 8px 16px; border-radius: 8px; border: none; background: none; color: var(--text-dim); font-size: 13, fontWeight: 600; cursor: pointer; display: flex; align-items: center; gap: 8; transition: all 0.2s; }
        .tab-btn.active { background: var(--primary); color: #fff; box-shadow: var(--shadow-glow); }
        .th { padding: 16px 24px; text-align: left; font-size: 11px; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
        .td { padding: 16px 24px; border-bottom: 1px solid var(--border); font-size: 14px; }
        .tr:hover { background: rgba(255,255,255,0.01); }
        .icon-box { background: var(--primary-glow); padding: 8px; borderRadius: 10px; }
        .btn-icon { background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 4px; borderRadius: 4px; }
        .btn-icon:hover { background: rgba(255,255,255,0.05); color: #fff; }
        
        .badge-status { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        .badge-status.EN_ROUTE, .badge-status.on_trip { background: rgba(59,130,246,0.1); color: #3b82f6; }
        .badge-status.available, .badge-status.COMPLETED { background: rgba(16,185,129,0.1); color: #10b981; }
        .badge-status.offline { background: rgba(100,116,139,0.1); color: #64748b; }
        .badge-status.break { background: rgba(245,158,11,0.1); color: #f59e0b; }
        .badge-status.IDLE { background: rgba(148,163,184,0.1); color: #94a3b8; }
      `}</style>
    </div>
  );
}
