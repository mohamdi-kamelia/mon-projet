import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface LocalVideoProps {
  stream: MediaStream;
  className?: string;
}

export function LocalVideo({ stream, className = '' }: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    // ✅ État initial des tracks
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];
    if (audioTrack) setMicEnabled(audioTrack.enabled);
    if (videoTrack) setCamEnabled(videoTrack.enabled);

    // ✅ Surveille les changements en temps réel
    const handleMute = (e: Event) => {
      const track = e.target as MediaStreamTrack;
      if (track.kind === 'audio') setMicEnabled(false);
      if (track.kind === 'video') setCamEnabled(false);
    };
    const handleUnmute = (e: Event) => {
      const track = e.target as MediaStreamTrack;
      if (track.kind === 'audio') setMicEnabled(true);
      if (track.kind === 'video') setCamEnabled(true);
    };

    stream.getTracks().forEach(track => {
      track.addEventListener('mute', handleMute);
      track.addEventListener('unmute', handleUnmute);
    });

    return () => {
      stream.getTracks().forEach(track => {
        track.removeEventListener('mute', handleMute);
        track.removeEventListener('unmute', handleUnmute);
      });
    };
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

      {/* ✅ Icônes micro + caméra en haut à droite */}
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