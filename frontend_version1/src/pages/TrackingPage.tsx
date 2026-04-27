import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Truck, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchTrackingInfo } from '../services/api';
import { useUIStore } from '../stores/uiStore';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const truckIcon = L.divIcon({
  html: `<div style="background: var(--primary); padding: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px var(--primary);">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
         </div>`,
  className: 'custom-truck-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

// Component to handle map center updates
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function TrackingPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useUIStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchTrackingInfo(token!);
        setData(res);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'This tracking link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates via WebSocket (simulated polling here for simplicity, 
    // but in a real app we'd use the existing WebSocketProvider if we refactored it for public use)
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff' }}>
        <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        <p style={{ marginTop: 20, color: 'var(--text-dim)' }}>Connecting to Live Satellite Feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff', padding: 40, textAlign: 'center' }}>
        <div style={{ background: 'rgba(239,68,68,0.1)', padding: 24, borderRadius: '50%', marginBottom: 24 }}>
          <AlertCircle size={48} color="var(--danger)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Link Inactive</h2>
        <p style={{ color: 'var(--text-dim)', maxWidth: 400, lineHeight: 1.6 }}>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 32 }} onClick={() => window.location.href = '/'}>Back to Home</button>
      </div>
    );
  }

  const pos: [number, number] = [data.currentPosition.lat, data.currentPosition.lng];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: 'rgba(10,10,12,0.95)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--primary)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>R</div>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Live Tracking</h1>
        </div>
        <div className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontSize: 10 }}>
          <ShieldCheck size={12} style={{ marginRight: 4 }} /> SECURE LINK
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={pos} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <Marker position={pos} icon={truckIcon}>
            <Popup>
              <strong>{data.driverName}</strong><br/>
              Status: {data.status}
            </Popup>
          </Marker>
          <MapController center={pos} />
        </MapContainer>
      </div>

      {/* Info Card */}
      <div style={{ padding: '24px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', zIndex: 1001 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div className="badge" style={{ marginBottom: 8, background: 'var(--primary-glow)', color: 'var(--primary)' }}>{data.status.replace('_', ' ')}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{data.driverName} is on the way</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{data.etaMinutes}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>MINUTES ETA</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
            <div style={{ width: 2, flex: 1, background: 'var(--border)', borderStyle: 'dashed' }} />
            <MapPin size={16} color="var(--danger)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>DESTINATION</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{data.destination}</div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Delivery Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{Math.max(15, 100 - Math.round(data.distanceKm * 5))}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(15, 100 - Math.round(data.distanceKm * 5))}%`, background: 'linear-gradient(90deg, var(--primary), #8b5cf6)', borderRadius: 4, boxShadow: 'var(--shadow-glow)' }} />
          </div>
        </div>
      </div>

      <style>{`
        .leaflet-container { background: #0a0a0c !important; }
        .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .custom-truck-icon { background: none !important; border: none !important; }
      `}</style>
    </div>
  );
}
