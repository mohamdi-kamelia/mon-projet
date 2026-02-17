import { LocalVideo } from './LocalVideo';
import { RemoteVideo } from './RemoteVideo';

interface VideoOverlayProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  getPlayerDistance: (playerId: string) => number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

export function VideoOverlay({
  localStream,
  remoteStreams,
  getPlayerDistance,
  maxVisible = 8,
}: VideoOverlayProps) {
  const remoteArray = Array.from(remoteStreams.entries()).slice(0, maxVisible);

  return (
    <div className="flex flex-col gap-2.5 max-h-[calc(100vh-80px)] overflow-y-auto">
      {localStream && <LocalVideo stream={localStream} />}
      {remoteArray.map(([playerId, stream]) => (
        <RemoteVideo
          key={playerId}
          playerId={playerId}
          stream={stream}
          distance={getPlayerDistance(playerId)}
        />
      ))}
    </div>
  );
}