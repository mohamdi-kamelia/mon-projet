export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export class WebRTCService {
  private config: RTCConfiguration;
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private signalingCallback?: (message: any) => void;

  // Callbacks pour les événements
  public onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  public onPeerConnected?: (peerId: string) => void;
  public onPeerDisconnected?: (peerId: string) => void;
  public onLocalStream?: (stream: MediaStream) => void;
  public onError?: (error: Error) => void;

  constructor(config?: WebRTCConfig) {
    this.config = {
      iceServers: config?.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };
  }

  /**
   * Initialise le stream local (caméra et micro)
   */
  async initLocalStream(
    audioConstraints: boolean | MediaTrackConstraints = true,
    videoConstraints: boolean | MediaTrackConstraints = true
  ): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: videoConstraints,
      });

      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      return this.localStream;
    } catch (error) {
      const err = new Error(`Erreur lors de l'accès aux médias: ${error}`);
      this.onError?.(err);
      throw err;
    }
  }

  /**
   * Crée une connexion peer avec un autre utilisateur
   */
  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection(this.config);

    // Ajouter le stream local à la connexion
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Gérer les candidats ICE
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingCallback) {
        this.signalingCallback({
          type: 'ice-candidate',
          candidate: event.candidate,
          peerId: peerId,
        });
      }
    };

    // Gérer le stream distant
    peerConnection.ontrack = (event) => {
      console.log('Stream distant reçu de', peerId);
      const remoteStream = event.streams[0];
      
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.stream = remoteStream;
        if (this.onRemoteStream) {
          this.onRemoteStream(peerId, remoteStream);
        }
      }
    };

    // Gérer l'état de la connexion
    peerConnection.onconnectionstatechange = () => {
      console.log(`État de connexion avec ${peerId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'connected') {
        this.onPeerConnected?.(peerId);
      } else if (
        peerConnection.connectionState === 'disconnected' ||
        peerConnection.connectionState === 'failed' ||
        peerConnection.connectionState === 'closed'
      ) {
        this.onPeerDisconnected?.(peerId);
      }
    };

    this.peers.set(peerId, { id: peerId, connection: peerConnection });
    return peerConnection;
  }

  /**
   * Crée une offre pour initier une connexion
   */
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = await this.createPeerConnection(peerId);
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerConnection.setLocalDescription(offer);

    return offer;
  }

  /**
   * Crée une réponse à une offre reçue
   */
  async createAnswer(
    peerId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    let peerConnection = this.peers.get(peerId)?.connection;
    
    if (!peerConnection) {
      peerConnection = await this.createPeerConnection(peerId);
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    return answer;
  }

  /**
   * Traite une réponse reçue
   */
  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  /**
   * Ajoute un candidat ICE reçu
   */
  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Erreur lors de l\'ajout du candidat ICE:', error);
      }
    }
  }

  /**
   * Configure le callback pour la signalisation
   */
  setSignalingCallback(callback: (message: any) => void): void {
    this.signalingCallback = callback;
  }

  /**
   * Active/désactive l'audio local
   */
  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled !== undefined ? enabled : !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  /**
   * Active/désactive la vidéo locale
   */
  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled !== undefined ? enabled : !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  /**
   * Change le périphérique audio
   */
  async setAudioDevice(deviceId: string): Promise<void> {
    if (!this.localStream) return;

    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
      video: this.localStream.getVideoTracks().length > 0,
    });

    const oldAudioTrack = this.localStream.getAudioTracks()[0];
    const newAudioTrack = newStream.getAudioTracks()[0];

    // Remplacer la piste audio dans tous les peer connections
    this.peers.forEach(({ connection }) => {
      const sender = connection.getSenders().find(s => s.track?.kind === 'audio');
      if (sender) {
        sender.replaceTrack(newAudioTrack);
      }
    });

    // Remplacer dans le stream local
    this.localStream.removeTrack(oldAudioTrack);
    this.localStream.addTrack(newAudioTrack);
    oldAudioTrack.stop();
  }

  /**
   * Change le périphérique vidéo
   */
  async setVideoDevice(deviceId: string): Promise<void> {
    if (!this.localStream) return;

    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: this.localStream.getAudioTracks().length > 0,
      video: { deviceId: { exact: deviceId } },
    });

    const oldVideoTrack = this.localStream.getVideoTracks()[0];
    const newVideoTrack = newStream.getVideoTracks()[0];

    // Remplacer la piste vidéo dans tous les peer connections
    this.peers.forEach(({ connection }) => {
      const sender = connection.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(newVideoTrack);
      }
    });

    // Remplacer dans le stream local
    if (oldVideoTrack) {
      this.localStream.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();
    }
    this.localStream.addTrack(newVideoTrack);
  }

  /**
   * Partage d'écran
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const videoTrack = screenStream.getVideoTracks()[0];

      // Remplacer la piste vidéo dans tous les peer connections
      this.peers.forEach(({ connection }) => {
        const sender = connection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Détecter quand l'utilisateur arrête le partage
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      const err = new Error(`Erreur lors du partage d'écran: ${error}`);
      this.onError?.(err);
      throw err;
    }
  }

  /**
   * Arrête le partage d'écran et revient à la caméra
   */
  async stopScreenShare(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Recréer un stream avec la caméra
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    const newVideoTrack = newStream.getVideoTracks()[0];

    // Remplacer dans tous les peer connections
    this.peers.forEach(({ connection }) => {
      const sender = connection.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(newVideoTrack);
      }
    });
  }

  /**
   * Ferme une connexion peer spécifique
   */
  closePeerConnection(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.connection.close();
      this.peers.delete(peerId);
      this.onPeerDisconnected?.(peerId);
    }
  }

  /**
   * Ferme toutes les connexions et nettoie les ressources
   */
  cleanup(): void {
    // Fermer toutes les connexions peer
    this.peers.forEach(({ connection }) => {
      connection.close();
    });
    this.peers.clear();

    // Arrêter tous les tracks du stream local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Obtient le stream local
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Obtient tous les peers connectés
   */
  getPeers(): Map<string, PeerConnection> {
    return this.peers;
  }

  /**
   * Obtient un peer spécifique
   */
  getPeer(peerId: string): PeerConnection | undefined {
    return this.peers.get(peerId);
  }
}

export default WebRTCService;