import { useEffect, useRef } from 'react';

interface RemoteVideoProps {
  playerId: string;
  stream: MediaStream;
  distance?: number;
  className?: string;
}

export function RemoteVideo({ playerId, stream, distance, className = '' }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative w-40 h-30 rounded-lg overflow-hidden bg-black/50 border-2 border-blue-500 hover:border-cyan-400 transition-colors ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 flex justify-between items-center">
        <span className="text-white text-xs font-semibold drop-shadow-lg truncate max-w-[100px]">
          {playerId}
        </span>
        {distance !== undefined && (
          <span className="text-green-400 text-[10px] bg-black/60 px-1.5 py-0.5 rounded shrink-0">
            {distance.toFixed(1)}m
          </span>
        )}
      </div>
    </div>
  );
}