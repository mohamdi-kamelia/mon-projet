import { useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useProximity(ws: WebSocket | null) {
  const { user } = useAuth();
  const lastConnectedUnityIdRef = useRef<string>('');
  const joinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastJoinTargetRef = useRef<string>('');

  const handleJoinWebRTC = useCallback((targetPlayerId: string) => {
    console.log('Unity: JoinWebRTCStream ->', targetPlayerId);
    if (!targetPlayerId) return;

    if (joinDebounceRef.current && lastJoinTargetRef.current === targetPlayerId) {
      console.log('[WebRTC] JoinWebRTC dupliqué ignoré pour', targetPlayerId);
      return;
    }

    lastJoinTargetRef.current = targetPlayerId;
    lastConnectedUnityIdRef.current = targetPlayerId;

    if (joinDebounceRef.current) clearTimeout(joinDebounceRef.current);
    joinDebounceRef.current = setTimeout(() => {
      joinDebounceRef.current = null;
      lastJoinTargetRef.current = '';
    }, 500);

    if (ws && ws.readyState === WebSocket.OPEN && user) {
      ws.send(JSON.stringify({
        type: 'proximity_connect',
        playerId: user.id.toString(),
        targetPlayerId,
        distance: 4.0,
      }));
    }
  }, [ws, user]);

  const handleLeaveWebRTC = useCallback((targetPlayerId: string) => {
    const target = targetPlayerId || lastConnectedUnityIdRef.current;
    console.log('Unity: LeaveWebRTCStream ->', target);
    lastConnectedUnityIdRef.current = '';
    lastJoinTargetRef.current = '';

    if (joinDebounceRef.current) {
      clearTimeout(joinDebounceRef.current);
      joinDebounceRef.current = null;
    }

    if (ws && ws.readyState === WebSocket.OPEN && user && target) {
      ws.send(JSON.stringify({
        type: 'proximity_disconnect',
        playerId: user.id.toString(),
        targetPlayerId: target,
        distance: 10.0,
      }));
    }
  }, [ws, user]);

  return { handleJoinWebRTC, handleLeaveWebRTC };
}