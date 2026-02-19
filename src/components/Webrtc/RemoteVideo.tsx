import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface RemoteVideoProps {
  playerId: string;
  stream: MediaStream;
  distance?: number;
  className?: string;
  // ✅ WebSocket pour recevoir l'état mic/cam distant
  ws?: WebSocket | null;
}

export function RemoteVideo({ playerId, stream, className = '', ws }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  // ✅ Écoute les messages webrtc_media_state depuis le WebSocket
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'webrtc_media_state' && msg.fromPlayer === playerId) {
          const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          if (data?.micEnabled !== undefined) setMicEnabled(data.micEnabled);
          if (data?.camEnabled !== undefined) setCamEnabled(data.camEnabled);
        }
      } catch {}
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, playerId]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !stream) return;

    video.srcObject = stream;
    audio.srcObject = stream;
    audio.muted = false;
    audio.volume = 1;

    const tryPlay = async () => {
      try { await video.play(); } catch (e: any) {
        if (e?.name !== 'AbortError') console.warn(`[RemoteVideo] video.play() bloqué:`, e?.name);
      }
      try { await audio.play(); } catch {}
    };

    const onAddTrack = () => {
      video.srcObject = stream;
      audio.srcObject = stream;
      tryPlay();
    };

    stream.addEventListener('addtrack', onAddTrack);
    if (video.readyState >= 1) {
      tryPlay();
    } else {
      video.onloadedmetadata = tryPlay;
      setTimeout(tryPlay, 200);
    }

    return () => {
      stream.removeEventListener('addtrack', onAddTrack);
    };
  }, [stream, playerId]);

  return (
    <div
      className={`relative w-40 rounded-lg overflow-hidden bg-black/50 border-2 border-blue-500 hover:border-cyan-400 transition-colors ${className}`}
      style={{ height: '120px' }}
    >
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      <audio ref={audioRef} autoPlay />

      {/* ✅ Icônes mises à jour via WebSocket */}
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

      {/* Nom en bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
        <span className="text-white text-xs font-semibold drop-shadow-lg truncate block">
          {playerId}
        </span>
      </div>
    </div>
  );
}