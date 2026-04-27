import { Circle } from 'react-leaflet';
import { Disruption } from '../../types';

interface Props {
  disruptions: Disruption[];
  timeOffset: number; // 0-60 minutes slider value
  show: boolean;
}

const severityColors: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

export default function PredictiveHeatmap({ disruptions, timeOffset, show }: Props) {
  if (!show || !disruptions) return null;
  
  return (
    <>
      {disruptions.map((d) => {
        if (!d || !d.location) return null;
        
        const isPredicted = d.isPredicted;
        const baseOpacity = isPredicted ? 0.12 + (timeOffset / 60) * 0.25 : 0.18;
        const color = severityColors[d.severity] || '#f59e0b';
        
        return (
          <Circle
            key={d.id || Math.random().toString()}
            center={[d.location.lat ?? 0, d.location.lng ?? 0]}
            radius={(d.radiusMeters ?? 500) * (1 + timeOffset / 120)}
            pathOptions={{
              fillColor: color,
              fillOpacity: baseOpacity,
              color: color,
              opacity: isPredicted ? 0.3 + (timeOffset / 60) * 0.4 : 0.6,
              weight: isPredicted ? 1 : 2,
            }}
          />
        );
      })}
    </>
  );
}
