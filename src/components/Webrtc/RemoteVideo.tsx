import { useEffect, useRef, useState } from 'react';

interface RemoteVideoProps {
  playerId: string;
  stream: MediaStream;
  distance?: number;
  className?: string;
}

export function RemoteVideo({ playerId, stream, distance, className = '' }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !stream) return;

    const tracks = stream.getTracks();
    console.log(
      `[RemoteVideo] Attache stream pour ${playerId}: ${tracks.length} tracks`,
      tracks.map(t => `${t.kind}:${t.readyState}`)
    );

    video.srcObject = stream;
    audio.srcObject = stream;
    audio.muted = false;
    audio.volume = 1;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.warn(`[RemoteVideo] video.play() bloqué:`, e?.name);
        }
      }
      try {
        await audio.play();
        setAudioBlocked(false);
      } catch (e: any) {
        if (e?.name === 'NotAllowedError') {
          console.warn(`[RemoteVideo] audio.play() bloqué - clic requis`);
          setAudioBlocked(true);
        }
      }
    };

    const onAddTrack = () => {
      console.log(`[RemoteVideo] Nouveau track ajouté pour ${playerId}`);
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

  const enableAudio = async () => {
    const audio = audioRef.current;
    const video = videoRef.current;
    if (!audio || !video) return;
    try {
      video.muted = false;
      await audio.play();
      setAudioBlocked(false);
    } catch (e) {
      console.warn(`[RemoteVideo] Enable audio failed`, e);
    }
  };

  return (
    <div
      className={`relative w-40 rounded-lg overflow-hidden bg-black/50 border-2 border-blue-500 hover:border-cyan-400 transition-colors ${className}`}
      style={{ height: '120px' }}
      onClick={() => { if (audioBlocked) enableAudio(); }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <audio ref={audioRef} autoPlay />

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

      {audioBlocked && (
        <button
          className="absolute top-1 right-1 text-[10px] bg-yellow-600 text-white px-2 py-1 rounded"
          onClick={(e) => { e.stopPropagation(); enableAudio(); }}
        >
          🔊 Son
        </button>
      )}
    </div>
  );
}