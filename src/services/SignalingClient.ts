import { io, Socket } from 'socket.io-client';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room';
  roomId?: string;
  peerId?: string;
  data?: any;
}

export class SignalingClient {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private peerId: string;

  // Callbacks
  public onOffer?: (peerId: string, offer: RTCSessionDescriptionInit) => void;
  public onAnswer?: (peerId: string, answer: RTCSessionDescriptionInit) => void;
  public onIceCandidate?: (peerId: string, candidate: RTCIceCandidateInit) => void;
  public onPeerJoined?: (peerId: string) => void;
  public onPeerLeft?: (peerId: string) => void;
  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onError?: (error: Error) => void;

  constructor(serverUrl?: string) {
    this.peerId = this.generatePeerId();
    
    if (serverUrl) {
      this.connect(serverUrl);
    }
  }

  /**
   * Génère un ID unique pour ce pair
   */
  private generatePeerId(): string {
    return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Se connecte au serveur de signalisation
   */
  connect(serverUrl: string): void {
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupSocketListeners();
  }

  /**
   * Configure les écouteurs d'événements du socket
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connecté au serveur de signalisation');
      this.onConnected?.();
    });

    this.socket.on('disconnect', () => {
      console.log('Déconnecté du serveur de signalisation');
      this.onDisconnected?.();
    });

    this.socket.on('error', (error: any) => {
      console.error('Erreur de signalisation:', error);
      this.onError?.(new Error(error));
    });

    // Nouveau pair a rejoint la room
    this.socket.on('peer-joined', (peerId: string) => {
      console.log('Nouveau pair:', peerId);
      this.onPeerJoined?.(peerId);
    });

    // Un pair a quitté la room
    this.socket.on('peer-left', (peerId: string) => {
      console.log('Pair quitté:', peerId);
      this.onPeerLeft?.(peerId);
    });

    // Offre reçue
    this.socket.on('offer', ({ peerId, offer }: { peerId: string; offer: RTCSessionDescriptionInit }) => {
      console.log('Offre reçue de', peerId);
      this.onOffer?.(peerId, offer);
    });

    // Réponse reçue
    this.socket.on('answer', ({ peerId, answer }: { peerId: string; answer: RTCSessionDescriptionInit }) => {
      console.log('Réponse reçue de', peerId);
      this.onAnswer?.(peerId, answer);
    });

    // Candidat ICE reçu
    this.socket.on('ice-candidate', ({ peerId, candidate }: { peerId: string; candidate: RTCIceCandidateInit }) => {
      console.log('Candidat ICE reçu de', peerId);
      this.onIceCandidate?.(peerId, candidate);
    });
  }

  /**
   * Rejoint une room
   */
  joinRoom(roomId: string): void {
    if (!this.socket) {
      throw new Error('Socket non connecté');
    }

    this.roomId = roomId;
    this.socket.emit('join-room', { roomId, peerId: this.peerId });
    console.log(`Rejoindre la room: ${roomId}`);
  }

  /**
   * Quitte la room actuelle
   */
  leaveRoom(): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('leave-room', { roomId: this.roomId, peerId: this.peerId });
    this.roomId = null;
    console.log('Room quittée');
  }

  /**
   * Envoie une offre à un pair
   */
  sendOffer(peerId: string, offer: RTCSessionDescriptionInit): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('offer', {
      roomId: this.roomId,
      targetPeerId: peerId,
      peerId: this.peerId,
      offer,
    });
  }

  /**
   * Envoie une réponse à un pair
   */
  sendAnswer(peerId: string, answer: RTCSessionDescriptionInit): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('answer', {
      roomId: this.roomId,
      targetPeerId: peerId,
      peerId: this.peerId,
      answer,
    });
  }

  /**
   * Envoie un candidat ICE à un pair
   */
  sendIceCandidate(peerId: string, candidate: RTCIceCandidateInit): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('ice-candidate', {
      roomId: this.roomId,
      targetPeerId: peerId,
      peerId: this.peerId,
      candidate,
    });
  }

  /**
   * Déconnecte du serveur de signalisation
   */
  disconnect(): void {
    if (this.roomId) {
      this.leaveRoom();
    }
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * Obtient l'ID de ce pair
   */
  getPeerId(): string {
    return this.peerId;
  }

  /**
   * Obtient l'ID de la room actuelle
   */
  getRoomId(): string | null {
    return this.roomId;
  }

  /**
   * Vérifie si le socket est connecté
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export default SignalingClient;