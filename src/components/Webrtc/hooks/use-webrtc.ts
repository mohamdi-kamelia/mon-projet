import { useEffect, useRef, useState } from 'react';
import { WebRTCClient } from '../../../lib/webrtc/WebRTCClient';
import type { Vector3 } from '@/lib/webrtc/types';

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
  
  const clientRef = useRef<WebRTCClient | null>(null);

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