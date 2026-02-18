import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'api/ws';

export function useWebSocket() {
  const { user } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    let websocket: WebSocket;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      websocket = new WebSocket(WS_URL);

      websocket.onopen = () => {
        console.log('WebSocket connecte');
        websocket.send(JSON.stringify({
          type: 'join',
          playerId: user.id.toString(),
        }));
        setWs(websocket);
      };

      websocket.onclose = () => {
        console.log('WebSocket deconnecte - reconnexion dans 3s...');
        setWs(null);
        if (!cancelled) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      websocket?.close();
    };
  }, [user]);

  return ws;
}