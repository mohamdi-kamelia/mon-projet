import { useEffect, useRef } from 'react';

interface UseProximityAudioOptions {
  remoteStreams: Map<string, MediaStream>;
  getPlayerDistance: (playerId: string) => number;
  maxDistance?: number;
  enabled?: boolean;
}

export function useProximityAudio({
  remoteStreams,
  getPlayerDistance,
  maxDistance = 8.0,
  enabled = true,
}: UseProximityAudioOptions) {
  const audioElementsRef = useRef(new Map<string, HTMLAudioElement>());

  useEffect(() => {
    if (!enabled) return;

    const audioElements = audioElementsRef.current;

    remoteStreams.forEach((stream, playerId) => {
      let audio = audioElements.get(playerId);

      if (!audio) {
        audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        audioElements.set(playerId, audio);
      }

      const distance = getPlayerDistance(playerId);
      audio.volume = calculateVolume(distance, maxDistance);
    });

    audioElements.forEach((audio, playerId) => {
      if (!remoteStreams.has(playerId)) {
        audio.pause();
        audio.srcObject = null;
        audioElements.delete(playerId);
      }
    });

    return () => {
      audioElements.forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
      });
      audioElements.clear();
    };
  }, [remoteStreams, getPlayerDistance, maxDistance, enabled]);
}

function calculateVolume(distance: number, maxDistance: number): number {
  if (distance >= maxDistance) return 0;
  return Math.max(0, Math.min(1, 1 - distance / maxDistance));
}