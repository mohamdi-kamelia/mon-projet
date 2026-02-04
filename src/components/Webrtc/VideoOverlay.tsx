import { LocalVideo } from './LocalVideo';
import { RemoteVideo } from './RemoteVideo';

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface VideoOverlayProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  getPlayerDistance: (playerId: string) => number;
  position?: Position;
  maxVisible?: number;
}

const POSITION_CLASSES: Record<Position, string> = {
  'top-right': 'top-5 right-5',
  'top-left': 'top-5 left-5',
  'bottom-right': 'bottom-5 right-5',
  'bottom-left': 'bottom-5 left-5',
};

export function VideoOverlay({
  localStream,
  remoteStreams,
  getPlayerDistance,
  position = 'top-right',
  maxVisible = 8,
}: VideoOverlayProps) {
  const remoteArray = Array.from(remoteStreams.entries()).slice(0, maxVisible);

  return (
    <div className={`absolute ${POSITION_CLASSES[position]} z-50 flex flex-col gap-2.5 max-h-[calc(100vh-40px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent hover:scrollbar-thumb-white/50`}>
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