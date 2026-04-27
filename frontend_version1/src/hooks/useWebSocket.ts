import { useContext } from 'react';
import { useWebSocketContext } from '../providers/WebSocketProvider';

/**
 * Hook to access the global WebSocket state.
 * The actual connection is managed by the WebSocketProvider at the App root.
 */
export function useWebSocket() {
  const context = useWebSocketContext();
  
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
}
