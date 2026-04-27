import { useState } from 'react';
import { X, User, Phone, Mail, FileText, Calendar, MapPin, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { createDriver } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDriverModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUIStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseExpiry: '',
    homeBase: '',
    emergency: false,
    delivery: false,
    corporate: false,
    logistics: false,
    assignNow: false,
    initialStatus: 'available'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.name) e.name = 'Name is required';
    if (!formData.phone || formData.phone.length !== 10) e.phone = '10-digit phone required';
    if (!formData.email) e.email = 'Email is required';
    if (!formData.licenseNumber) e.licenseNumber = 'License is required';
    if (!formData.licenseExpiry) e.licenseExpiry = 'Expiry date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.emergency && !formData.delivery && !formData.corporate && !formData.logistics) {
      showToast('Select at least one certification', 'error');
      return;
    }

    setLoading(true);
    try {
      // Generate unique ID based on license if not provided, otherwise random
      const driverId = `DRV-${formData.licenseNumber.replace(/\W/g, '').slice(-6).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`;
      
      await createDriver({
        id: driverId,
        name: formData.name,
        phone: formData.phone || "0000000000",
        email: formData.email,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        homeBaseAddress: formData.homeBase,
        certifiedTypes: ['emergency', 'delivery', 'corporate', 'logistics'].filter(t => (formData as any)[t]),
        status: formData.initialStatus
      });
      showToast(`Driver ${formData.name} added successfully`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast('Failed to add driver', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ width: 500, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Add New Driver</h3>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              Step {step} of 2: {step === 1 ? 'Personal Details' : 'Certification & Assignment'}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px' }}>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} className="input-icon" />
                  <input type="text" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Rahul Sharma" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} className="input-icon" />
                    <input type="text" className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="10 digits" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} className="input-icon" />
                    <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="rahul@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>License Number *</label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={16} className="input-icon" />
                    <input type="text" className={`form-input ${errors.licenseNumber ? 'error' : ''}`} placeholder="DL-XXXXXXX" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} className="input-icon" />
                    <input type="date" className={`form-input ${errors.licenseExpiry ? 'error' : ''}`} value={formData.licenseExpiry} onChange={e => setFormData({...formData, licenseExpiry: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Home Base Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} className="input-icon" />
                  <input type="text" className="form-input" placeholder="Enter address..." value={formData.homeBase} onChange={e => setFormData({...formData, homeBase: e.target.value})} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 12, display: 'block' }}>VEHICLE TYPES CERTIFIED *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {['emergency', 'delivery', 'corporate', 'logistics'].map(type => (
                    <label key={type} style={{ 
                      display: 'flex', alignItems: 'center', gap: 10, padding: 12, 
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={(formData as any)[type]} 
                        onChange={e => setFormData({...formData, [type]: e.target.checked})} 
                        style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--primary-glow)', borderRadius: 12, border: '1px solid var(--primary-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Assign Vehicle Now?</div>
                  <input 
                    type="checkbox" 
                    className="toggle" 
                    checked={formData.assignNow} 
                    onChange={e => setFormData({...formData, assignNow: e.target.checked})} 
                  />
                </div>
                {formData.assignNow && (
                  <select className="form-input" style={{ marginTop: 12, width: '100%' }}>
                    <option>Select an available vehicle...</option>
                    <option>BLR-101 (Truck)</option>
                    <option>BLR-102 (Van)</option>
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>Initial Status</label>
                <select className="form-input" value={formData.initialStatus} onChange={e => setFormData({...formData, initialStatus: e.target.value})}>
                  <option value="available">Available</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, background: 'rgba(0,0,0,0.1)' }}>
          {step === 2 && <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={loading}>Back</button>}
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }} 
            onClick={step === 1 ? handleNext : handleSubmit}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : step === 1 ? 'Continue' : 'Add Driver'}
            {step === 1 && !loading && <ChevronRight size={16} style={{ marginLeft: 8 }} />}
            {step === 2 && !loading && <CheckCircle size={16} style={{ marginLeft: 8 }} />}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .modal-content { border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5); animation: slideUp 0.3s ease-out; }
        .form-group label { display: block; font-size: 11px; font-weight: 700; color: var(--text-dim); margin-bottom: 6px; text-transform: uppercase; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-dim); }
        .form-input { padding-left: 38px !important; }
        .error-text { color: var(--danger); font-size: 10px; margin-top: 4px; display: block; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
