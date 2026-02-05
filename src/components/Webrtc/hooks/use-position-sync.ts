import { useEffect, useRef } from 'react';
import type { Vector3 } from '../../../lib/webrtc/types';

interface UsePositionSyncOptions {
  ws: WebSocket | null;
  playerId: string;
  getPosition: () => Vector3;
  interval?: number;
  enabled?: boolean;
}

export function usePositionSync({
  ws,
  playerId,
  getPosition,
  interval = 200,
  enabled = true,
}: UsePositionSyncOptions) {
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (!ws || !playerId || !enabled) return;

    intervalRef.current = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const position = getPosition();
        ws.send(
          JSON.stringify({
            type: 'player_update',
            playerId,
            data: { position },
          })
        );
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ws, playerId, getPosition, interval, enabled]);
}