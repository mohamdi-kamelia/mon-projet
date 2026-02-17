import { useEffect, useRef, useState } from 'react';
import { WebRTCClient } from '../../../lib/webrtc/WebRTCClient';

interface UseWebRTCOptions {
  ws: WebSocket | null;
  playerId: string;
  unityId?: string;
  enabled?: boolean;
}

export function useWebRTC({ ws, playerId, unityId, enabled = true }: UseWebRTCOptions) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<WebRTCClient | null>(null);

  useEffect(() => {
    if (!ws || !playerId || !unityId) return;
    if (ws.readyState !== WebSocket.OPEN) return;

    console.log(`[WebRTC] Registering Unity ID: ${unityId} for player ${playerId}`);
    ws.send(JSON.stringify({
      type: 'register_unity_id',
      playerId,
      unityId,
    }));
  }, [ws, playerId, unityId]);

  useEffect(() => {
    if (!ws || !playerId || !enabled) return;
    const client = new WebRTCClient(ws, playerId);

    client.onStreamAdded((id, stream) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(id, stream);
        return next;
      });
    });

    client.onStreamRemoved((id) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    });

    client
      .initialize()
      .then((stream) => {
        setLocalStream(stream);
        setIsInitialized(true);
      })
      .catch((err) => {
        console.error('Failed to initialize WebRTC:', err);
        setError(err);
      });

    clientRef.current = client;

    return () => {
      client.cleanup();
    };
  }, [ws, playerId, enabled]);

  return {
    isInitialized,
    localStream,
    remoteStreams,
    error,
    client: clientRef.current,
  };
}