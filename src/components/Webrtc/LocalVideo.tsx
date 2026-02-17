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
    </div>
  );
}