import { useEffect } from 'react';
import { useWebRTC } from './hooks/use-webrtc';
import { useProximityAudio } from './hooks/use-proximity-audio';
import type { Vector3 } from '../../lib/webrtc/types';
import { VideoOverlay } from './VideoOverlay';

interface WebrtcProps {
  ws: WebSocket | null;
  playerId: string;
  getPlayerPosition: () => Vector3;
  getPlayerDistance: (playerId: string) => number;
  videoPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enabled?: boolean;
  // ✅ Callback pour exposer le localStream au parent (Footer)
  onLocalStream?: (stream: MediaStream | null) => void;
}

export function Webrtc({
  ws,
  playerId,
  getPlayerDistance,
  videoPosition = 'top-right',
  enabled = true,
  onLocalStream,
}: WebrtcProps) {
  const { localStream, remoteStreams, isInitialized, error } = useWebRTC({
    ws,
    playerId,
    enabled,
  });

  useEffect(() => {
    onLocalStream?.(localStream);
  }, [localStream, onLocalStream]);

  useProximityAudio({
    remoteStreams,
    getPlayerDistance,
    enabled: enabled && isInitialized,
  });

  if (error) {
    console.error('WebRTC Error:', error);
    return null;
  }

  if (!isInitialized) return null;

  return (
    <VideoOverlay
      localStream={localStream}
      remoteStreams={remoteStreams}
      getPlayerDistance={getPlayerDistance}
      position={videoPosition}
    />
  );
}