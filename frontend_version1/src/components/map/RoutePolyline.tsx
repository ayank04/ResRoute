import { Polyline } from 'react-leaflet';
import { Route } from '../../types';

const riskColors: Record<string, string> = { 
  LOW: '#10b981', 
  MEDIUM: '#f59e0b', 
  HIGH: '#ef4444' 
};

interface Props {
  route: Route;
  dashed?: boolean;
  opacity?: number;
  isOld?: boolean;
  isNew?: boolean;
}

export default function RoutePolyline({ route, dashed = false, opacity = 1, isOld = false, isNew = false }: Props) {
  if (!route || !route.segments) return null;

  return (
    <>
      {route.segments.map((seg) => {
        if (!seg || !seg.decodedPath) return null;
        
        const fullPath = seg.decodedPath.map(p => {
          if (!p) return [0, 0] as [number, number];
          return [p.lat ?? 0, p.lng ?? 0] as [number, number];
        });
        
        // Dynamic slicing based on originCoords (current simulated position)
        let path = fullPath;
        if (route.originCoords) {
          const cur = route.originCoords;
          let minIdx = 0;
          let minOk = 999999;
          fullPath.forEach((p, i) => {
            const d = Math.pow(p[0] - cur.lat, 2) + Math.pow(p[1] - cur.lng, 2);
            if (d < minOk) {
              minOk = d;
              minIdx = i;
            }
          });
          path = fullPath.slice(minIdx);
        }
        
        return (
          <Polyline
            key={seg.id}
            positions={path}
            pathOptions={{
              color: isOld ? '#ef4444' : (riskColors[seg.riskLevel] || '#10b981'),
              weight: isOld ? 3 : (isNew ? 6 : 5),
              opacity: isOld ? 0.3 : (dashed ? 0.6 * opacity : 0.8 * opacity),
              dashArray: isOld ? '8, 8' : (dashed ? '10, 10' : undefined),
              className: isNew ? 'route-polyline-new' : (isOld ? 'route-polyline-old' : ''),
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        );
      })}
    </>
  );
}
