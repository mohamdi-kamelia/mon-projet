import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import SignalingClient from '@/services/SignalingClient';

interface WebRTCRoomProps {
  roomName: string;
  signalingServer?: string;
  autoJoin?: boolean;
}

export interface WebRTCRoomRef {
  toggleAudio: () => boolean;
  toggleVideo: () => boolean;
  setAudioInput: (deviceId: string) => void;
  setVideoInput: (deviceId: string) => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  leaveRoom: () => void;
  getLocalStream: () => MediaStream | null;
}

const WebRTCRoom = forwardRef<WebRTCRoomRef, WebRTCRoomProps>(
  ({ roomName, signalingServer = 'ws://localhost:3001', autoJoin = true }, ref) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [remotePeerElements, setRemotePeerElements] = useState<Map<string, HTMLVideoElement>>(new Map());
    const signalingClient = useRef<SignalingClient | null>(null);

    const {
      localStream,
      remotePeers,
      isAudioEnabled,
      isVideoEnabled,
      isScreenSharing,
      isInitialized,
      error,
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
      cleanup,
    } = useWebRTC({
      autoStart: true,
      audioEnabled: true,
      videoEnabled: false,
    });

    // Initialiser le client de signalisation
    useEffect(() => {
      signalingClient.current = new SignalingClient(signalingServer);

      // Callbacks de signalisation
      signalingClient.current.onPeerJoined = async (peerId) => {
        console.log('Nouveau pair détecté, création d\'une offre:', peerId);
        try {
          const offer = await createOffer(peerId);
          signalingClient.current?.sendOffer(peerId, offer);
        } catch (err) {
          console.error('Erreur lors de la création de l\'offre:', err);
        }
      };

      signalingClient.current.onOffer = async (peerId, offer) => {
        console.log('Offre reçue de:', peerId);
        try {
          const answer = await createAnswer(peerId, offer);
          signalingClient.current?.sendAnswer(peerId, answer);
        } catch (err) {
          console.error('Erreur lors de la création de la réponse:', err);
        }
      };

      signalingClient.current.onAnswer = async (peerId, answer) => {
        console.log('Réponse reçue de:', peerId);
        try {
          await handleAnswer(peerId, answer);
        } catch (err) {
          console.error('Erreur lors du traitement de la réponse:', err);
        }
      };

      signalingClient.current.onIceCandidate = async (peerId, candidate) => {
        console.log('Candidat ICE reçu de:', peerId);
        try {
          await addIceCandidate(peerId, candidate);
        } catch (err) {
          console.error('Erreur lors de l\'ajout du candidat ICE:', err);
        }
      };

      signalingClient.current.onPeerLeft = (peerId) => {
        console.log('Pair quitté:', peerId);
        setRemotePeerElements((prev) => {
          const newMap = new Map(prev);
          newMap.delete(peerId);
          return newMap;
        });
      };

      // Configurer le callback de signalisation pour WebRTC
      setSignalingCallback((message: any) => {
        if (message.type === 'ice-candidate' && message.candidate) {
          signalingClient.current?.sendIceCandidate(message.peerId, message.candidate);
        }
      });

      return () => {
        signalingClient.current?.disconnect();
      };
    }, [signalingServer]);

    // Rejoindre la room quand le nom change
    useEffect(() => {
      if (roomName && signalingClient.current?.isConnected() && autoJoin) {
        signalingClient.current.joinRoom(roomName);
      }

      return () => {
        if (signalingClient.current) {
          signalingClient.current.leaveRoom();
        }
      };
    }, [roomName, autoJoin]);

    // Afficher le stream local
    useEffect(() => {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }, [localStream]);

    // Afficher les streams distants
    useEffect(() => {
      remotePeers.forEach((peer) => {
        if (peer.stream) {
          setRemotePeerElements((prev) => {
            const newMap = new Map(prev);
            if (!newMap.has(peer.id)) {
              const videoElement = document.createElement('video');
              videoElement.autoplay = true;
              videoElement.playsInline = true;
              videoElement.srcObject = peer.stream!;
              newMap.set(peer.id, videoElement);
            }
            return newMap;
          });
        }
      });
    }, [remotePeers]);

    // Exposer les méthodes via ref
    useImperativeHandle(ref, () => ({
      toggleAudio,
      toggleVideo,
      setAudioInput: setAudioDevice,
      setVideoInput: setVideoDevice,
      startScreenShare,
      stopScreenShare,
      leaveRoom: () => {
        signalingClient.current?.leaveRoom();
        cleanup();
      },
      getLocalStream: () => localStream,
    }));

    if (error) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-bold">Erreur WebRTC</h3>
          <p>{error.message}</p>
        </div>
      );
    }

    return (
      <div className="h-full w-full flex flex-col gap-2">
        {/* Vidéo locale */}
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto bg-gray-900 rounded"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Vous {!isAudioEnabled && '(muet)'} {!isVideoEnabled && '(caméra off)'}
          </div>
        </div>

        {/* Vidéos distantes */}
        <div className="grid grid-cols-2 gap-2">
          {Array.from(remotePeerElements.entries()).map(([peerId, videoElement]) => (
            <div key={peerId} className="relative">
              <video
                ref={(el) => {
                  if (el && videoElement) {
                    el.srcObject = videoElement.srcObject;
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-auto bg-gray-900 rounded"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                Participant {peerId.slice(-6)}
              </div>
            </div>
          ))}
        </div>

        {/* Indicateurs de statut */}
        {!isInitialized && (
          <div className="text-sm text-gray-500 text-center">
            Initialisation...
          </div>
        )}

        {remotePeers.length === 0 && isInitialized && (
          <div className="text-sm text-gray-500 text-center">
            En attente d'autres participants...
          </div>
        )}
      </div>
    );
  }
);

WebRTCRoom.displayName = 'WebRTCRoom';

export default WebRTCRoom;