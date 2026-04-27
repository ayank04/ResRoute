import React, { createContext, useContext, useEffect, useState } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { useRouteStore } from '../stores/routeStore';
import { useDisruptionStore } from '../stores/disruptionStore';
import { useHealthStore } from '../stores/healthStore';
import { useUIStore } from '../stores/uiStore';

// MODULE LEVEL — outside React, never recreated
let socket: WebSocket | null = null;
let reconnectTimer: any = null;
let reconnectAttempts = 0;
let isIntentionalClose = false;
const MAX_RECONNECT_ATTEMPTS = 5;
const BACKOFF = [500, 1000, 2000, 4000, 8000];

const WS_URL = (import.meta as any).env.VITE_WS_URL || 'ws://localhost:8000/ws';
const WS_TOKEN = (import.meta as any).env.VITE_WS_TOKEN || 'resroute-default-token-2026';

function connect(
  wsUrl: string,
  onStatus: (s: 'connecting' | 'connected' | 'offline') => void,
  onMessage: (msg: any) => void
) {
  // Guard: never create if already open or connecting
  if (socket?.readyState === WebSocket.OPEN || 
      socket?.readyState === WebSocket.CONNECTING) return;

  // Clear any pending reconnect
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

  isIntentionalClose = false;
  onStatus('connecting');

  console.log(`[WS] Connecting to ${wsUrl}...`);
  const wsUrlWithToken = `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}token=${WS_TOKEN}`;
  socket = new WebSocket(wsUrlWithToken);

  socket.onopen = () => {
    console.log('[WS] Connected');
    reconnectAttempts = 0;
    onStatus('connected');
    useHealthStore.getState().setConnectionStatus('LIVE');
    socket?.send(JSON.stringify({ type: 'sync', lastEventId: null }));
  };

  socket.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch (err) { console.error('[WS] Parse error', err); }
  };

  socket.onerror = () => {
    // Error always followed by onclose — handle in onclose only
  };

  socket.onclose = (event) => {
    if (event.code === 1008) {
      console.error('[WS] Connection rejected: Authentication failure (Check VITE_WS_TOKEN)');
    }
    if (isIntentionalClose) {
      console.log('[WS] Intentional close');
      return;
    }

    reconnectAttempts++;
    console.log(`[WS] Connection closed. Attempting reconnect ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WS] Max reconnect attempts reached');
      onStatus('offline');
      return;
    }

    const delay = BACKOFF[Math.min(reconnectAttempts - 1, BACKOFF.length - 1)];
    reconnectTimer = setTimeout(() => 
      connect(wsUrl, onStatus, onMessage), delay);
  };
}

function disconnect() {
  isIntentionalClose = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  socket?.close();
  socket = null;
}

interface WebSocketContextType {
  status: 'connecting' | 'connected' | 'offline';
}

const WebSocketContext = createContext<WebSocketContextType>({ status: 'offline' });

export const useWebSocketContext = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const { showToast } = useUIStore();

  useEffect(() => {
    const wsUrl = (import.meta as any).env.VITE_WS_URL || 'ws://localhost:8000/ws';
    
    connect(wsUrl, setStatus, handleMessage);
    
    return () => disconnect();
  }, []); // EMPTY DEPS — never re-run

  function handleMessage(msg: any) {
    switch(msg.type) {
      case 'vehicle_update':
        useVehicleStore.getState().updateVehicle({ id: msg.payload.id, ...msg.payload });
        break;
      case 'risk_update':
        useVehicleStore.getState().updateVehicle({
          id: msg.payload.vehicleId,
          riskScore: msg.payload.riskScore,
          riskTrend: msg.payload.trend
        });
        break;
      case 'reroute_event':
        useRouteStore.getState().addReroute(msg.payload.newRoute || msg.payload);
        showToast(`${msg.payload.vehicleId || 'Vehicle'} rerouted — risk reduced`, 'success');
        break;
      case 'disruption_detected':
        useDisruptionStore.getState().addDisruption(msg.payload);
        showToast(`Disruption: ${msg.payload.title}`, 'error');
        break;
      case 'driver_report':
        useDisruptionStore.getState().addDriverReport(msg.payload);
        break;
      case 'need_help':
        showToast(`NEED HELP: ${msg.payload.vehicleId} — ${msg.payload.driverId}`, 'error');
        break;
      case 'circuit_breaker_change':
        useHealthStore.getState().updateBreaker(msg.payload);
        break;
      case 'sync_complete':
        console.log('[WS] Sync complete');
        break;
    }
  }

  return (
    <WebSocketContext.Provider value={{ status }}>
      {children}
    </WebSocketContext.Provider>
  );
};
