import { useEffect, useRef, useState } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Vehicle } from '../../types';
import { renderToString } from 'react-dom/server';

interface Props { driver: Vehicle; onClick?: () => void; }

const vehicleEmoji: Record<string, string> = { bike: '🏍️', car: '🚗', truck: '🚛' };
const statusColor: Record<string, string> = { 
  on_trip: '#3b82f6', 
  EN_ROUTE: '#3b82f6', 
  available: '#10b981', 
  IDLE: '#94a3b8', 
  offline: '#64748b', 
  break: '#f59e0b',
  COMPLETED: '#10b981' 
};

export default function DriverMarker({ driver, onClick }: Props) {
  const [pos, setPos] = useState(driver.currentPosition);
  const prevPosRef = useRef(driver.currentPosition);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    // Only start animation if position actually changed
    if (driver.currentPosition.lat !== prevPosRef.current.lat || 
        driver.currentPosition.lng !== prevPosRef.current.lng) {
      
      const startPos = { ...prevPosRef.current };
      const endPos = { ...driver.currentPosition };
      
      // Reset animation timer for the new segment
      startTimeRef.current = undefined;

      const animate = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        
        // Animation duration set to 1900ms to match the 2000ms backend tick
        // This ensures the marker is almost always in motion
        const progress = Math.min((time - startTimeRef.current) / 1900, 1);
        
        const currentLat = startPos.lat + (endPos.lat - startPos.lat) * progress;
        const currentLng = startPos.lng + (endPos.lng - startPos.lng) * progress;
        
        setPos({ lat: currentLat, lng: currentLng });
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          prevPosRef.current = endPos;
          startTimeRef.current = undefined;
        }
      };
      
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [driver.currentPosition]);

  const icon = L.divIcon({
    className: 'custom-driver-icon',
    html: renderToString(
      <div style={{ position: 'relative' }}>
        <div style={{
          background: '#1e293b',
          border: `2px solid ${statusColor[driver.status]}`,
          borderRadius: '50%',
          width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
          boxShadow: `0 0 12px ${statusColor[driver.status]}60`,
          position: 'relative',
        }}>
          {vehicleEmoji[driver.vehicleType] || '🚗'}
          <div style={{
            position: 'absolute', bottom: '-4px', right: '-4px',
            width: '14px', height: '14px', borderRadius: '50%',
            background: statusColor[driver.status],
            border: '2px solid #0f172a',
          }} />
        </div>
        <div style={{
          background: 'rgba(15,23,42,0.92)',
          border: '1px solid #334155',
          borderRadius: '6px', padding: '3px 8px',
          fontSize: '11px', fontWeight: 600, color: '#f8fafc',
          textAlign: 'center', marginTop: '4px',
          backdropFilter: 'blur(4px)', whiteSpace: 'nowrap',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}>
          {driver.name.split(' ')[0]}
        </div>
      </div>
    ),
    iconSize: [44, 70],
    iconAnchor: [22, 35],
  });

  return (
    <Marker 
      position={[pos.lat, pos.lng]} 
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip direction="top" offset={[0, -35]} opacity={1}>
        <div style={{ padding: '2px 4px' }}>
          <strong>{driver.name}</strong><br/>
          Status: {driver.status}
        </div>
      </Tooltip>
    </Marker>
  );
}
