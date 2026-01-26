import { useState, useEffect, useRef, useCallback } from 'react';
import WebRTCService from '@/services/WebRTCService';

export interface UseWebRTCOptions {
  autoStart?: boolean;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  onPeerConnected?: (peerId: string) => void;
  onPeerDisconnected?: (peerId: string) => void;
  onError?: (error: Error) => void;
}

export interface RemotePeer {
  id: string;
  stream?: MediaStream;
}

export const useWebRTC = (options: UseWebRTCOptions = {}) => {
  const {
    autoStart = false,
    audioEnabled = true,
    videoEnabled = true,
    onRemoteStream,
    onPeerConnected,
    onPeerDisconnected,
    onError,
  } = options;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(audioEnabled);
  const [isVideoEnabled, setIsVideoEnabled] = useState(videoEnabled);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const webrtcService = useRef<WebRTCService | null>(null);

  // Initialiser le service WebRTC
  useEffect(() => {
    webrtcService.current = new WebRTCService();

    // Configurer les callbacks
    webrtcService.current.onLocalStream = (stream) => {
      setLocalStream(stream);
      setIsInitialized(true);
    };

    webrtcService.current.onRemoteStream = (peerId, stream) => {
      setRemotePeers((prev) => {
        const newMap = new Map(prev);
        newMap.set(peerId, { id: peerId, stream });
        return newMap;
      });
      onRemoteStream?.(peerId, stream);
    };

    webrtcService.current.onPeerConnected = (peerId) => {
      console.log('Peer connecté:', peerId);
      onPeerConnected?.(peerId);
    };

    webrtcService.current.onPeerDisconnected = (peerId) => {
      console.log('Peer déconnecté:', peerId);
      setRemotePeers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(peerId);
        return newMap;
      });
      onPeerDisconnected?.(peerId);
    };

    webrtcService.current.onError = (err) => {
      console.error('Erreur WebRTC:', err);
      setError(err);
      onError?.(err);
    };

    // Auto-start si demandé
    if (autoStart) {
      initializeStream();
    }

    return () => {
      webrtcService.current?.cleanup();
    };
  }, []);

  // Initialiser le stream local
  const initializeStream = useCallback(async () => {
    if (!webrtcService.current) return;

    try {
      await webrtcService.current.initLocalStream(
        audioEnabled,
        videoEnabled
      );
      setError(null);
    } catch (err) {
      console.error('Erreur lors de l\'initialisation du stream:', err);
      setError(err as Error);
    }
  }, [audioEnabled, videoEnabled]);

  // Créer une offre pour un peer
  const createOffer = useCallback(async (peerId: string) => {
    if (!webrtcService.current) throw new Error('Service WebRTC non initialisé');
    return await webrtcService.current.createOffer(peerId);
  }, []);

  // Créer une réponse à une offre
  const createAnswer = useCallback(
    async (peerId: string, offer: RTCSessionDescriptionInit) => {
      if (!webrtcService.current) throw new Error('Service WebRTC non initialisé');
      return await webrtcService.current.createAnswer(peerId, offer);
    },
    []
  );

  // Gérer une réponse reçue
  const handleAnswer = useCallback(
    async (peerId: string, answer: RTCSessionDescriptionInit) => {
      if (!webrtcService.current) throw new Error('Service WebRTC non initialisé');
      await webrtcService.current.handleAnswer(peerId, answer);
    },
    []
  );

  // Ajouter un candidat ICE
  const addIceCandidate = useCallback(
    async (peerId: string, candidate: RTCIceCandidateInit) => {
      if (!webrtcService.current) throw new Error('Service WebRTC non initialisé');
      await webrtcService.current.addIceCandidate(peerId, candidate);
    },
    []
  );

  // Configurer le callback de signalisation
  const setSignalingCallback = useCallback((callback: (message: any) => void) => {
    webrtcService.current?.setSignalingCallback(callback);
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!webrtcService.current) return false;
    const enabled = webrtcService.current.toggleAudio();
    setIsAudioEnabled(enabled);
    return enabled;
  }, []);

  // Toggle vidéo
  const toggleVideo = useCallback(() => {
    if (!webrtcService.current) return false;
    const enabled = webrtcService.current.toggleVideo();
    setIsVideoEnabled(enabled);
    return enabled;
  }, []);

  // Changer le périphérique audio
  const setAudioDevice = useCallback(async (deviceId: string) => {
    if (!webrtcService.current) return;
    await webrtcService.current.setAudioDevice(deviceId);
  }, []);

  // Changer le périphérique vidéo
  const setVideoDevice = useCallback(async (deviceId: string) => {
    if (!webrtcService.current) return;
    await webrtcService.current.setVideoDevice(deviceId);
  }, []);

  // Partage d'écran
  const startScreenShare = useCallback(async () => {
    if (!webrtcService.current) return;
    try {
      await webrtcService.current.startScreenShare();
      setIsScreenSharing(true);
    } catch (err) {
      console.error('Erreur lors du partage d\'écran:', err);
    }
  }, []);

  // Arrêter le partage d'écran
  const stopScreenShare = useCallback(async () => {
    if (!webrtcService.current) return;
    await webrtcService.current.stopScreenShare();
    setIsScreenSharing(false);
  }, []);

  // Fermer une connexion peer
  const disconnectPeer = useCallback((peerId: string) => {
    webrtcService.current?.closePeerConnection(peerId);
  }, []);

  // Nettoyer toutes les connexions
  const cleanup = useCallback(() => {
    webrtcService.current?.cleanup();
    setLocalStream(null);
    setRemotePeers(new Map());
    setIsInitialized(false);
  }, []);

  return {
    // États
    localStream,
    remotePeers: Array.from(remotePeers.values()),
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isInitialized,
    error,

    // Méthodes
    initializeStream,
    createOffer,
    createAnswer,
    handleAnswer,
    addIceCandidate,
    setSignalingCallback,
    toggleAudio,
    toggleVideo,
    setAudioDevice,
    setVideoDevice,
    startScreenShare,
    stopScreenShare,
    disconnectPeer,
    cleanup,
  };
};

export default useWebRTC;