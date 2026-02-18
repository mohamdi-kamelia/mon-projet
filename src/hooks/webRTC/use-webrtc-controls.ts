import { useCallback, useRef } from 'react';

export function useWebRTCControls() {
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const playerIdRef = useRef<string>('');

  const setLocalStream = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;
  }, []);

  // ✅ À appeler depuis App.tsx pour que les toggles puissent envoyer l'état
  const setWs = useCallback((ws: WebSocket | null, playerId: string) => {
    wsRef.current = ws;
    playerIdRef.current = playerId;
  }, []);

  const sendMediaState = useCallback((micEnabled: boolean, camEnabled: boolean) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      type: 'webrtc_media_state',
      fromPlayer: playerIdRef.current,
      data: { micEnabled, camEnabled },
    }));
  }, []);

  const toggleMic = useCallback((): boolean => {
    const stream = localStreamRef.current;
    if (!stream) return false;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return false;

    audioTrack.enabled = !audioTrack.enabled;
    const isMuted = !audioTrack.enabled;

    const videoTrack = stream.getVideoTracks()[0];
    const camEnabled = videoTrack ? videoTrack.enabled : true;
    sendMediaState(!isMuted, camEnabled);

    console.log(`[WebRTC] Micro ${audioTrack.enabled ? 'activé' : 'coupé'}`);
    return isMuted;
  }, [sendMediaState]);

  const toggleCamera = useCallback((): boolean => {
    const stream = localStreamRef.current;
    if (!stream) return false;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return false;

    videoTrack.enabled = !videoTrack.enabled;
    const isCamOff = !videoTrack.enabled;

    const audioTrack = stream.getAudioTracks()[0];
    const micEnabled = audioTrack ? audioTrack.enabled : true;
    sendMediaState(micEnabled, !isCamOff);

    console.log(`[WebRTC] Caméra ${videoTrack.enabled ? 'activée' : 'coupée'}`);
    return isCamOff;
  }, [sendMediaState]);

  return { setLocalStream, setWs, toggleMic, toggleCamera };
}