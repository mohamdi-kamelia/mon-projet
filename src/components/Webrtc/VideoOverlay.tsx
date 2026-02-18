import { LocalVideo } from './LocalVideo';
import { RemoteVideo } from './RemoteVideo';

interface VideoOverlayProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  getPlayerDistance: (playerId: string) => number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
  // ✅ WebSocket passé aux RemoteVideo pour l'état mic/cam
  ws?: WebSocket | null;
}

export function VideoOverlay({
  localStream,
  remoteStreams,
  getPlayerDistance,
  maxVisible = 8,
  ws,
}: VideoOverlayProps) {
  const remoteArray = Array.from(remoteStreams.entries()).slice(0, maxVisible);

  if (remoteArray.length === 0) return null;

  return (
    <div className="flex flex-row-reverse gap-2.5">
      {localStream && <LocalVideo stream={localStream} />}

      {remoteArray.map(([playerId, stream]) => (
        <RemoteVideo
          key={playerId}
          playerId={playerId}
          stream={stream}
          distance={getPlayerDistance(playerId)}
          ws={ws}
        />
      ))}
    </div>
  );
}