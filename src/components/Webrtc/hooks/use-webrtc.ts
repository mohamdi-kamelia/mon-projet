import { useEffect, useRef, useState, useCallback } from 'react';
import { WebRTCClient } from '../../../lib/webrtc/WebRTCClient';

interface UseWebRTCOptions {
  ws: WebSocket | null;
  playerId: string;
  enabled?: boolean;
}

export function useWebRTC({ ws, playerId, enabled = true }: UseWebRTCOptions) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [error, setError] = useState<Error | null>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<string>(''); // ✅ exposé

  const clientRef = useRef<WebRTCClient | null>(null);
  const initializingRef = useRef(false);
  const pendingMessagesRef = useRef<MessageEvent[]>([]);

  const initializeOnDemand = useCallback(async () => {
    if (initializingRef.current || clientRef.current) return;
    if (!ws || !playerId) return;

    initializingRef.current = true;
    console.log('[WebRTC] Initialisation caméra/micro (première proximité)');

    const client = new WebRTCClient(ws, playerId);

    client.onStreamAdded((id, stream) => {
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.set(id, stream);
        return next;
      });
    });

    client.onStreamRemoved((id) => {
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    });

    try {
      const stream = await client.initialize();
      setLocalStream(stream);
      setIsInitialized(true);
      clientRef.current = client;

      console.log(`[WebRTC] Replay de ${pendingMessagesRef.current.length} messages en attente`);
      pendingMessagesRef.current.forEach(event => {
        client.replayMessage(event);
      });
      pendingMessagesRef.current = [];

      console.log('[WebRTC] ✅ Prêt');
    } catch (err: any) {
      console.error('[WebRTC] Échec initialisation:', err);
      setError(err);
    } finally {
      initializingRef.current = false;
    }
  }, [ws, playerId]);

  useEffect(() => {
    if (!ws || !playerId || !enabled) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'webrtc_connect') {
          // ✅ Stocke le targetPlayerId dès la connexion
          const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          if (data?.targetPlayerID) {
            setTargetPlayerId(data.targetPlayerID);
          }

          if (!clientRef.current) {
            pendingMessagesRef.current.push(event);
            initializeOnDemand();
          }
        } else if (msg.type === 'webrtc_disconnect') {
          // ✅ Reset targetPlayerId à la déconnexion
          setTargetPlayerId('');
        } else if (
          msg.type === 'webrtc_offer' ||
          msg.type === 'webrtc_answer' ||
          msg.type === 'webrtc_ice'
        ) {
          if (!clientRef.current && initializingRef.current) {
            pendingMessagesRef.current.push(event);
          }
        }
      } catch {}
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, playerId, enabled, initializeOnDemand]);

  useEffect(() => {
    return () => {
      clientRef.current?.cleanup();
      clientRef.current = null;
      initializingRef.current = false;
      pendingMessagesRef.current = [];
    };
  }, []);

  return {
    isInitialized,
    localStream,
    remoteStreams,
    error,
    targetPlayerId, 
    client: clientRef.current,
  };
}