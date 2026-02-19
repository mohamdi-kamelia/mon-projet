import { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface LocalVideoProps {
  stream: MediaStream;
  className?: string;
  // ✅ État mic/cam contrôlé par le parent (Footer via App)
  micEnabled?: boolean;
  camEnabled?: boolean;
}

export function LocalVideo({ stream, className = '', micEnabled = true, camEnabled = true }: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative w-40 rounded-lg overflow-hidden bg-black/50 border-2 border-green-500 shadow-lg ${className}`}
      style={{ height: '120px' }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* ✅ Icônes mises à jour via props (source de vérité = Footer) */}
      <div className="absolute top-1.5 right-1.5 flex gap-1">
        {micEnabled
          ? <Mic className="w-4 h-4 text-white drop-shadow" />
          : <MicOff className="w-4 h-4 text-red-400 drop-shadow" />
        }
        {camEnabled
          ? <Video className="w-4 h-4 text-white drop-shadow" />
          : <VideoOff className="w-4 h-4 text-red-400 drop-shadow" />
        }
      </div>

      {/* Label "You" en bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
        <span className="text-white text-xs font-semibold">You</span>
      </div>
    </div>
  );
}