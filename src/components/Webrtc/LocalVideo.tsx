import { useEffect, useRef } from 'react';

interface LocalVideoProps {
  stream: MediaStream;
  className?: string;
}

export function LocalVideo({ stream, className = '' }: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative w-40 h-30 rounded-lg overflow-hidden bg-black/50 border-2 border-green-500 shadow-lg ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <span className="absolute bottom-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs font-medium">
        You
      </span>
    </div>
  );
}