import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface RemoteVideoProps {
  playerId: string;
  stream: MediaStream;
  distance?: number;
  className?: string;
}

export function RemoteVideo({ playerId, stream, className = '' }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !stream) return;

    console.log(
      `[RemoteVideo] Attache stream pour ${playerId}: ${stream.getTracks().length} tracks`,
      stream.getTracks().map(t => `${t.kind}:${t.readyState}`)
    );

    // État initial des tracks
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];
    if (audioTrack) setMicEnabled(audioTrack.enabled);
    if (videoTrack) setCamEnabled(videoTrack.enabled);

    // Surveille les changements en temps réel
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

    const onAddTrack = (e: MediaStreamTrackEvent) => {
      const track = e.track;
      track.addEventListener('mute', handleMute);
      track.addEventListener('unmute', handleUnmute);
      if (track.kind === 'audio') setMicEnabled(track.enabled);
      if (track.kind === 'video') setCamEnabled(track.enabled);
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
      stream.getTracks().forEach(track => {
        track.removeEventListener('mute', handleMute);
        track.removeEventListener('unmute', handleUnmute);
      });
    };
  }, [stream, playerId]);

  return (
    <div
      className={`relative w-40 rounded-lg overflow-hidden bg-black/50 border-2 border-blue-500 hover:border-cyan-400 transition-colors ${className}`}
      style={{ height: '120px' }}
    >
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      <audio ref={audioRef} autoPlay />

      {/* Icônes micro + caméra en haut à droite */}
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