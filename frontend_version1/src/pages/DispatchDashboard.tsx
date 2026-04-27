import DashboardMap from '../components/dashboard/DashboardMap';
import RightPanel from '../components/layout/RightPanel';

export default function DispatchDashboard() {
  return (
    <div className="dashboard-layout" style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <div className="dashboard-map" style={{ flex: 1, position: 'relative' }}>
        <DashboardMap />
      </div>
      <RightPanel />
    </div>
  );
}
