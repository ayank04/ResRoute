import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import OfflineBanner from './components/layout/OfflineBanner';
import Toast from './components/layout/Toast';

import DispatchDashboard from './pages/DispatchDashboard';
import FleetAnalytics from './pages/FleetAnalytics';
import FleetManagement from './pages/FleetManagement';
import RouteHistory from './pages/RouteHistory';
import Settings from './pages/Settings';
import AIDecisionLog from './pages/AIDecisionLog';
import ActiveRoutes from './pages/ActiveRoutes';

import { useVehicleStore } from './stores/vehicleStore';
import { useDisruptionStore } from './stores/disruptionStore';
import { useRouteStore } from './stores/routeStore';
import { useHealthStore } from './stores/healthStore';
import { useAnalyticsStore } from './stores/analyticsStore';
import { useDriverStore } from './stores/driverStore';

import { 
  fetchVehicles, 
  fetchActiveRoutes, 
  fetchDisruptions, 
  fetchHealth, 
  fetchDrivers 
} from './services/api';

import { WebSocketProvider } from './providers/WebSocketProvider';
import { mockVehicles } from './mock/vehicles';
import { mockRoutes } from './mock/routes';
import { mockDisruptions } from './mock/disruptions';
import { mockDrivers } from './mock/drivers';

function AppInit() {
  const vehicleStore = useVehicleStore();
  const routeStore = useRouteStore();
  const disruptionStore = useDisruptionStore();
  const driverStore = useDriverStore();
  const { setHealth } = useHealthStore();
  const fetchAnalytics = useAnalyticsStore(s => s.fetchAnalytics);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    // 1. Health check — completely independent, non-blocking
    const checkHealth = async () => {
      const h = await fetchHealth();
      setHealth(h);
      if (h.status === 'ok' || h.status === 'healthy') {
        useHealthStore.getState().setConnectionStatus('LIVE');
      }
    };
    checkHealth();
    const healthInterval = setInterval(checkHealth, 30000);

    // 2. Load all data in parallel — never block on any single failure
    const loadData = async () => {
      const [vehiclesRes, routesRes, disruptionsRes, driversRes] = 
        await Promise.allSettled([
          fetchVehicles(),
          fetchActiveRoutes(),
          fetchDisruptions(),
          fetchDrivers()
        ]);

      // Each result: use real data if fulfilled and non-empty, mock otherwise
      vehicleStore.setVehicles(
        (vehiclesRes.status === 'fulfilled' && (vehiclesRes.value as any[]).length > 0) 
          ? vehiclesRes.value : mockVehicles
      );
      routeStore.setRoutes(
        (routesRes.status === 'fulfilled' && (routesRes.value as any[]).length > 0)
          ? routesRes.value : mockRoutes
      );
      disruptionStore.setDisruptions(
        disruptionsRes.status === 'fulfilled' ? disruptionsRes.value : mockDisruptions
      );
      driverStore.setDrivers(
        (driversRes.status === 'fulfilled' && (driversRes.value as any[]).length > 0)
          ? driversRes.value : mockDrivers
      );

      // Show offline banner only if ALL real fetches failed
      const allFailed = [vehiclesRes, routesRes, disruptionsRes, driversRes]
        .every(r => r.status === 'rejected');
      setIsOfflineMode(allFailed);
    };
    
    loadData();
    void fetchAnalytics();

    return () => clearInterval(healthInterval);
  }, []);

  return null;
}

import TrackingPage from './pages/TrackingPage';

export default function App() {
  return (
    <WebSocketProvider>
      <AppInit />
      <Routes>
        {/* Public Tracking Route (Standalone) */}
        <Route path="/track/:token" element={<TrackingPage />} />

        {/* Protected Dispatcher Routes */}
        <Route path="*" element={
          <div className="app-layout">
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TopBar />
              <OfflineBanner />
              <main className="app-main">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DispatchDashboard />} />
                  <Route path="/routes" element={<ActiveRoutes />} />
                  <Route path="/drivers" element={<FleetManagement />} />
                  <Route path="/vehicles" element={<FleetManagement />} />
                  <Route path="/decisions" element={<AIDecisionLog />} />
                  <Route path="/analytics" element={<FleetAnalytics />} />
                  <Route path="/history" element={<RouteHistory />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
            <Toast />
          </div>
        } />
      </Routes>
    </WebSocketProvider>
  );
}
