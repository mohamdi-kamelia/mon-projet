import { useWebRTC } from './hooks/use-webrtc';
import { usePositionSync } from './hooks/use-position-sync';
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
}

export function Webrtc({
  ws,
  playerId,
  getPlayerPosition,
  getPlayerDistance,
  videoPosition = 'top-right',
  enabled = true,
}: WebrtcProps) {
  const { localStream, remoteStreams, isInitialized, error } = useWebRTC({
    ws,
    playerId,
    enabled,
  });

  usePositionSync({
    ws,
    playerId,
    getPosition: getPlayerPosition,
    enabled: enabled && isInitialized,
  });

  useProximityAudio({
    remoteStreams,
    getPlayerDistance,
    enabled: enabled && isInitialized,
  });

  if (error) {
    console.error('WebRTC Error:', error);
    return null;
  }

  if (!isInitialized) {
    return null;
  }

  return (
    <VideoOverlay
      localStream={localStream}
      remoteStreams={remoteStreams}
      getPlayerDistance={getPlayerDistance}
      position={videoPosition}
    />
  );
}