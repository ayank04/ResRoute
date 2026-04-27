import { useState, useEffect, useRef } from 'react';
import { Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useRouteStore } from '../../stores/routeStore';
import { useDisruptionStore } from '../../stores/disruptionStore';
import { useUIStore } from '../../stores/uiStore';
import MapContainer from '../map/MapContainer';
import PredictiveHeatmap from '../map/PredictiveHeatmap';
import TimeSlider from '../map/TimeSlider';
import VoiceButton from '../dashboard/VoiceButton';
import ARPreviewButton from '../dashboard/ARPreviewButton';
import { Route, Vehicle, Coordinates } from '../../types';

const CENTER = { lat: 12.9352, lng: 77.6300 };

const getRiskColor = (score: number) => {
  if (score < 35) return '#00e676'; // Green
  if (score < 65) return '#ffb300'; // Amber
  return '#ff3d57'; // Red
};

const isValidLatLng = (lat: any, lng: any, lon?: any): boolean => {
  const targetLng = lng !== undefined ? lng : lon;
  return (
    lat !== undefined && targetLng !== undefined &&
    lat !== null && targetLng !== null &&
    !isNaN(Number(lat)) && !isNaN(Number(targetLng)) &&
    Number(lat) >= -90 && Number(lat) <= 90 &&
    Number(targetLng) >= -180 && Number(targetLng) <= 180
  )
}

const safeCoords = (coords: any[]): [number, number][] => {
  if (!Array.isArray(coords)) return []
  return coords.filter(c => {
    if (Array.isArray(c)) return isValidLatLng(c[0], c[1]);
    return isValidLatLng(c?.lat, c?.lng, c?.lon);
  }).map(c => {
    if (Array.isArray(c)) return [Number(c[0]), Number(c[1])];
    const lng = c.lng !== undefined ? c.lng : c.lon;
    return [Number(c.lat), Number(lng)];
  })
}


const vehicleEmoji = { bike: '🏍️', car: '🚗', truck: '🚛' };
const statusColor: Record<string, string> = { 
  on_trip: '#3b82f6', 
  EN_ROUTE: '#3b82f6', 
  available: '#10b981', 
  IDLE: '#94a3b8', 
  offline: '#64748b', 
  break: '#f59e0b',
  COMPLETED: '#10b981' 
};

// Custom Vehicle Marker Icon
const createVehicleIcon = (vehicle: Vehicle, isSelected: boolean) => {
  const color = statusColor[vehicle.status] || '#94a3b8';
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: renderToString(
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 44, height: 44,
          background: '#1e293b',
          border: `2px solid ${color}`,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          boxShadow: isSelected ? `0 0 20px ${color}aa` : `0 0 10px ${color}66`,
          transition: 'all 0.3s ease',
          animation: isSelected ? 'pulse 2s infinite' : 'none',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
        }}>
          {vehicleEmoji[vehicle.vehicleType] || '🚗'}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 14, height: 14, borderRadius: '50%',
            background: color, border: '2px solid #0f172a'
          }} />
        </div>
        <div style={{
          position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,0.9)', border: '1px solid var(--border)',
          borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700,
          color: '#fff', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)'
        }}>
          {vehicle.id}
        </div>
      </div>
    ),
    iconSize: [44, 70],
    iconAnchor: [22, 22],
  });
};

function MapController({ center }: { center: Coordinates }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom(), { animate: true, duration: 1.5 });
  }, [center.lat, center.lng, map]);
  return null;
}

export default function DashboardMap() {
  const [timeOffset, setTimeOffset] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  const vehicles = useVehicleStore(s => s.vehicles) ?? [];
  const routes = useRouteStore(s => s.routes) ?? [];
  const disruptions = useDisruptionStore(s => s.disruptions) ?? [];
  const { selectedVehicleId, setSelectedVehicle } = useVehicleStore();

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const mapCenter = selectedVehicle?.currentPosition ?? CENTER;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer center={mapCenter} zoom={13}>
        <MapController center={mapCenter} />
        
        {/* Draw Routes */}
        {routes
          .filter(r => r.status === 'ACTIVE' && 
            isValidLatLng(r.originCoords?.lat, r.originCoords?.lng, r.originCoords?.lon) && 
            isValidLatLng(r.destinationCoords?.lat, r.destinationCoords?.lng, r.destinationCoords?.lon))
          .map(route => {
            const isSelected = route.driverId === selectedVehicleId;
            const riskColor = getRiskColor(route.currentRiskScore);
            const opacity = selectedVehicleId ? (isSelected ? 1 : 0.2) : 0.85;
            const weight = isSelected ? 6 : 4;
            
            return (
              <div key={route.id}>
                {/* Route Polyline */}
                <Polyline
                  positions={safeCoords([route.originCoords, route.destinationCoords])}
                  pathOptions={{
                    color: riskColor,
                    weight: weight,
                    opacity: opacity,
                    dashArray: route.rerouteCount > 0 ? '6 6' : '8 4',
                  }}
                />
                  
                {/* Origin Marker */}
                {isValidLatLng(route.originCoords?.lat, route.originCoords?.lng, route.originCoords?.lon) && (
                  <Marker 
                    position={[route.originCoords.lat, route.originCoords.lng !== undefined ? route.originCoords.lng : (route.originCoords as any).lon]}
                    icon={L.divIcon({
                      html: `<div style="width:10px;height:10px;background:#00e676;border-radius:50%;border:2px solid #fff;box-shadow:0 0 5px rgba(0,0,0,0.5)"></div>`,
                      className: 'origin-marker',
                      iconSize: [10, 10]
                    })}
                  >
                    <Tooltip>Origin: {route.origin}</Tooltip>
                  </Marker>
                )}
  
                {/* Destination Marker */}
                {isValidLatLng(route.destinationCoords?.lat, route.destinationCoords?.lng, route.destinationCoords?.lon) && (
                  <Marker 
                    position={[route.destinationCoords.lat, route.destinationCoords.lng !== undefined ? route.destinationCoords.lng : (route.destinationCoords as any).lon]}
                    icon={L.divIcon({
                      html: `<div style="font-size:18px">🏁</div>`,
                      className: 'dest-marker',
                      iconSize: [20, 20],
                      iconAnchor: [10, 20]
                    })}
                  >
                    <Tooltip direction="top" opacity={1}>
                      <div style={{ padding: '2px 4px' }}>
                        <strong>Destination</strong><br/>
                        {route.destination}
                      </div>
                    </Tooltip>
                  </Marker>
                )}
  
                {/* Waypoints */}
                {route.segments && Array.isArray(route.segments) && route.segments
                  .flatMap(s => [s?.start, s?.end])
                  .filter(wp => isValidLatLng(wp?.lat, wp?.lng))
                  .map((wp, i) => (
                    <Marker 
                      key={`${route.id}-wp-${i}`}
                      position={[wp.lat, wp.lng]}
                      icon={L.divIcon({
                        html: `<div style="width:4px;height:4px;background:#fff;border-radius:50%;opacity:0.6"></div>`,
                        className: 'wp-marker',
                        iconSize: [4, 4]
                      })}
                    />
                  ))}
              </div>
            );
          })}
  
        {/* Draw Vehicle Markers and Remaining Lines */}
        {vehicles
          .filter(v => v.status !== 'COMPLETED' && isValidLatLng(v.currentPosition?.lat, v.currentPosition?.lng, v.currentPosition?.lon))
          .map(v => {
            const isSelected = v.id === selectedVehicleId;
            const route = routes.find(r => r.driverId === v.id && r.status === 'ACTIVE');
            const riskColor = route ? getRiskColor(route.currentRiskScore) : '#94a3b8';
            const opacity = selectedVehicleId ? (isSelected ? 1 : 0.2) : 1;
  
            return (
              <div key={v.id}>
                {/* Dashed Line to Destination */}
                {route && isValidLatLng(route.destinationCoords?.lat, route.destinationCoords?.lng, route.destinationCoords?.lon) && (
                  <Polyline
                    positions={safeCoords([v.currentPosition, route.destinationCoords])}
                    pathOptions={{
                      color: riskColor,
                      weight: 2,
                      opacity: opacity * 0.6,
                      dashArray: '5 5',
                    }}
                  />
                )}
    
                {isValidLatLng(v.currentPosition?.lat, v.currentPosition?.lng, v.currentPosition?.lon) && (
                  <Marker 
                    position={[v.currentPosition.lat, v.currentPosition.lng !== undefined ? v.currentPosition.lng : (v.currentPosition as any).lon]} 
                    icon={createVehicleIcon(v, isSelected)}
                    eventHandlers={{ click: () => setSelectedVehicle(v.id) }}
                    opacity={opacity}
                  />
                )}
              </div>
            );
          })}
  
        <PredictiveHeatmap disruptions={disruptions} timeOffset={timeOffset} show={showHeatmap} />
      </MapContainer>

      {/* Overlays */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
        <button
          onClick={() => setShowHeatmap(v => !v)}
          className="btn btn-sm"
          style={{ background: showHeatmap ? 'rgba(239,68,68,0.2)' : 'rgba(15,23,42,0.85)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}
        >
          🔥 {showHeatmap ? 'Hide' : 'Show'} Heatmap
        </button>
      </div>

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(15,23,42,0.88)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 11, backdropFilter: 'blur(8px)' }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>ROUTE RISK</div>
        {[['LOW', '#00e676'], ['MEDIUM', '#ffb300'], ['HIGH', '#ff3d57']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 20, height: 3, background: c, borderRadius: 2 }} />
            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
          </div>
        ))}
      </div>

      <TimeSlider value={timeOffset} onChange={setTimeOffset} />

      <div className="floating-controls">
        <VoiceButton />
        <ARPreviewButton />
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1.1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
          100% { transform: scale(1.1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  );
}
