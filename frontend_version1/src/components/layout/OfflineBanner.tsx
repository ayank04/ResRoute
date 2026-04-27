import { useHealthStore } from '../../stores/healthStore';
import { AlertTriangle } from 'lucide-react';

export default function OfflineBanner() {
  const { connectionStatus } = useHealthStore();

  if (connectionStatus !== 'OFFLINE') return null;

  return (
    <div className="offline-banner">
      <AlertTriangle size={16} />
      <span>OFFLINE MODE — Showing last known data. Retrying connection...</span>
    </div>
  );
}
