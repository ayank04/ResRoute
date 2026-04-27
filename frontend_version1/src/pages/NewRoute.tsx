import { useState, useEffect } from 'react';
import { MapPin, Calendar, Truck, ArrowRight, Save, Loader2, CheckCircle } from 'lucide-react';
import { useVehicleStore } from '../stores/vehicleStore';
import { useDriverStore } from '../stores/driverStore';
import { useUIStore } from '../stores/uiStore';
import { createRoute } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function NewRoute() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { vehicles } = useVehicleStore();
  const { drivers } = useDriverStore();
  const { showToast } = useUIStore();

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    origin: '',
    destination: '',
    scheduledStart: new Date().toISOString().slice(0, 16)
  });

  const availableVehicles = vehicles.filter(v => !v.currentRouteId);
  const availableDrivers = drivers.filter(d => d.status === 'available');

  const validateStep = () => {
    if (step === 1) {
      if (!formData.vehicleId || !formData.driverId) {
        showToast('Please select both a vehicle and a driver', 'warning');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.origin || !formData.destination) {
        showToast('Origin and Destination are required', 'warning');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 3) setStep(s => s + 1);
      else handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createRoute({
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        origin: formData.origin,
        destination: formData.destination,
        status: 'ACTIVE'
      });
      showToast('Route created and simulation started', 'success');
      navigate('/');
    } catch (err) {
      showToast('Failed to create route', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main">
      <div className="page-header">
        <h2>Plan New Route</h2>
        <p style={{ color: 'var(--text-muted)' }}>Configure and optimize a new delivery or transit path</p>
      </div>

      <div style={{ padding: '0 40px', maxWidth: 800 }}>
        <div className="card glass">
          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ 
                flex: 1, 
                height: 4, 
                borderRadius: 2, 
                background: s <= step ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.3s'
              }} />
            ))}
          </div>

          {step === 1 && (
            <div className="animate-in">
              <h3 style={{ marginBottom: 20 }}>Select Vehicle & Driver</h3>
              <div style={{ display: 'grid', gap: 20 }}>
                <div className="form-group">
                  <label className="label-sm">VEHICLE</label>
                  <select 
                    className="form-input" 
                    value={formData.vehicleId} 
                    onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                    style={{ width: '100%', paddingLeft: 12 }}
                  >
                    <option value="">Select an available vehicle...</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.id} ({v.model})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label-sm">DRIVER</label>
                  <select 
                    className="form-input" 
                    value={formData.driverId} 
                    onChange={e => setFormData({...formData, driverId: e.target.value})}
                    style={{ width: '100%', paddingLeft: 12 }}
                  >
                    <option value="">Select an available driver...</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in">
              <h3 style={{ marginBottom: 20 }}>Set Route Locations</h3>
              <div style={{ display: 'grid', gap: 20 }}>
                <div className="form-group">
                  <label className="label-sm">ORIGIN</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} className="input-icon" />
                    <input 
                      className="form-input"
                      placeholder="e.g. Electronic City, Bengaluru" 
                      value={formData.origin}
                      onChange={e => setFormData({...formData, origin: e.target.value})}
                      style={{ width: '100%', paddingLeft: 40 }} 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label-sm">DESTINATION</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} className="input-icon" style={{ color: 'var(--primary)' }} />
                    <input 
                      className="form-input"
                      placeholder="e.g. Whitefield, Bengaluru" 
                      value={formData.destination}
                      onChange={e => setFormData({...formData, destination: e.target.value})}
                      style={{ width: '100%', paddingLeft: 40 }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in">
              <h3 style={{ marginBottom: 20 }}>Schedule & Finalize</h3>
              <div style={{ display: 'grid', gap: 20 }}>
                <div className="form-group">
                  <label className="label-sm">START TIME</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} className="input-icon" />
                    <input 
                      type="datetime-local"
                      className="form-input"
                      value={formData.scheduledStart}
                      onChange={e => setFormData({...formData, scheduledStart: e.target.value})}
                      style={{ width: '100%', paddingLeft: 40 }} 
                    />
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Summary</div>
                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    <strong>Vehicle:</strong> {formData.vehicleId}<br/>
                    <strong>Driver:</strong> {drivers.find(d => d.id === formData.driverId)?.name}<br/>
                    <strong>From:</strong> {formData.origin}<br/>
                    <strong>To:</strong> {formData.destination}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 40 }}>
            {step > 1 && <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} disabled={loading}>Back</button>}
            <button 
              className="btn btn-primary" 
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                  {step === 3 ? 'Confirm & Start' : 'Next Step'} 
                  {step < 3 ? <ArrowRight size={16} style={{ marginLeft: 8 }} /> : <CheckCircle size={16} style={{ marginLeft: 8 }} />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .label-sm { display: block; font-size: 11px; font-weight: 700; color: var(--text-dim); margin-bottom: 8px; text-transform: uppercase; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-dim); }
        .animate-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
