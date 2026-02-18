import { LocalVideo } from './LocalVideo';
import { RemoteVideo } from './RemoteVideo';

interface VideoOverlayProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  getPlayerDistance: (playerId: string) => number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
  ws?: WebSocket | null;
  // ✅ État mic/cam pour LocalVideo
  micEnabled?: boolean;
  camEnabled?: boolean;
}

export function VideoOverlay({
  localStream,
  remoteStreams,
  getPlayerDistance,
  maxVisible = 8,
  ws,
  micEnabled = true,
  camEnabled = true,
}: VideoOverlayProps) {
  const remoteArray = Array.from(remoteStreams.entries()).slice(0, maxVisible);

  if (remoteArray.length === 0) return null;

  return (
    <div className="flex flex-row-reverse gap-2.5">
      {localStream && (
        <LocalVideo
          stream={localStream}
          micEnabled={micEnabled}
          camEnabled={camEnabled}
        />
      )}

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