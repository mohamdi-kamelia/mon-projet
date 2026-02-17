import { useCallback, useRef } from 'react';

export function useWebRTCControls() {
  const localStreamRef = useRef<MediaStream | null>(null);

  const setLocalStream = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;
  }, []);

  const toggleMic = useCallback((): boolean => {
    const stream = localStreamRef.current;
    if (!stream) return false;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return false;

    audioTrack.enabled = !audioTrack.enabled;
    console.log(`[WebRTC] Micro ${audioTrack.enabled ? 'activé' : 'coupé'}`);
    return !audioTrack.enabled; 
  }, []);

  const toggleCamera = useCallback((): boolean => {
    const stream = localStreamRef.current;
    if (!stream) return false;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return false;

    videoTrack.enabled = !videoTrack.enabled;
    console.log(`[WebRTC] Caméra ${videoTrack.enabled ? 'activée' : 'coupée'}`);
    return !videoTrack.enabled; 
  }, []);

  return { setLocalStream, toggleMic, toggleCamera };
}