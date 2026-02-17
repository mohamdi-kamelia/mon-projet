import { PeerConnectionManager } from './PeerConnectionManager';
import { SignalingClient } from './SignalingClient';
import { StreamManager } from './StreamManager';

interface ProximityNotification {
  targetPlayerID: string;
  distance: number;
  action: 'connect' | 'disconnect';
}

interface WebRTCMessage {
  type: string;
  fromPlayer?: string;
  toPlayer?: string;
  data?: any;
}

export class WebRTCClient {
  private peerManager: PeerConnectionManager;
  private signalingClient: SignalingClient;
  private streamManager: StreamManager;

  // anti doublons/race
  private processingOffer = new Set<string>();
  private answerApplied = new Set<string>();

  constructor(private ws: WebSocket, private localPlayerId: string) {
    this.peerManager = new PeerConnectionManager();
    this.signalingClient = new SignalingClient(ws, localPlayerId);
    this.streamManager = new StreamManager();
    this.ws.addEventListener('message', this.handleMessage.bind(this));
  }

  async initialize(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    const localStream = await this.streamManager.initializeLocalStream(constraints);
    this.peerManager.setLocalStream(localStream);
    return localStream;
  }

  onStreamAdded(callback: (playerId: string, stream: MediaStream) => void): void {
    this.streamManager.onStreamAdded(callback);
  }

  onStreamRemoved(callback: (playerId: string) => void): void {
    this.streamManager.onStreamRemoved(callback);
  }

  getStreamManager(): StreamManager {
    return this.streamManager;
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    const message: WebRTCMessage = JSON.parse(event.data);

    switch (message.type) {
      case 'webrtc_connect':
        await this.handleProximityConnect(message.data as ProximityNotification);
        break;
      case 'webrtc_disconnect':
        this.handleProximityDisconnect(message.data as ProximityNotification);
        break;
      case 'webrtc_offer':
        await this.handleRemoteOffer(message);
        break;
      case 'webrtc_answer':
        await this.handleRemoteAnswer(message);
        break;
      case 'webrtc_ice':
        await this.handleRemoteIceCandidate(message);
        break;
    }
  }

  private async handleProximityConnect(notification: ProximityNotification): Promise<void> {
    const { targetPlayerID } = notification;

    if (this.peerManager.hasConnection(targetPlayerID)) return;

    const pc = this.peerManager.createConnection(targetPlayerID, {
      onIceCandidate: (candidate) => this.signalingClient.sendIceCandidate(targetPlayerID, candidate),
      onTrack: (stream) => this.streamManager.addRemoteStream(targetPlayerID, stream),
      onConnectionStateChange: (state) => {
        console.log(`[WebRTC] Connection state with ${targetPlayerID}: ${state}`);
        if (state === 'disconnected' || state === 'failed') {
          this.handleProximityDisconnect({
            targetPlayerID,
            action: 'disconnect',
            distance: 0,
          });
        }
      },
    });

    if (this.localPlayerId < targetPlayerID) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.signalingClient.sendOffer(targetPlayerID, pc.localDescription);
        console.log(`[WebRTC] Offer envoyé à ${targetPlayerID}`);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    } else {
      console.log(
        `[WebRTC] En attente d'offer de ${targetPlayerID} (notre ID ${this.localPlayerId} > leur ID)`
      );
    }
  }

  private handleProximityDisconnect(notification: ProximityNotification): void {
    const { targetPlayerID } = notification;
    console.log(`[WebRTC] Disconnect de ${targetPlayerID}`);

    this.processingOffer.delete(targetPlayerID);
    this.answerApplied.delete(targetPlayerID);

    this.peerManager.closeConnection(targetPlayerID);
    this.streamManager.removeRemoteStream(targetPlayerID);
  }

  private async handleRemoteOffer(message: WebRTCMessage): Promise<void> {
    const { fromPlayer, data } = message;
    if (!fromPlayer) return;

    if (this.processingOffer.has(fromPlayer)) {
      console.warn(`[WebRTC] Offer dupliqué ignoré de ${fromPlayer}`);
      return;
    }
    this.processingOffer.add(fromPlayer);

    let pc = this.peerManager.getConnection(fromPlayer);

    if (pc) {
      const state = pc.signalingState;
      if (state === 'stable' && pc.connectionState === 'connected') {
        console.warn(`[WebRTC] Offer ignoré - déjà connecté avec ${fromPlayer}`);
        this.processingOffer.delete(fromPlayer);
        return;
      }
      console.warn(`[WebRTC] Offer reçu état ${state} avec ${fromPlayer} - réinitialisation`);
      this.peerManager.closeConnection(fromPlayer);
      pc = undefined;
    }

    this.answerApplied.delete(fromPlayer);

    pc = this.peerManager.createConnection(fromPlayer, {
      onIceCandidate: (candidate) => this.signalingClient.sendIceCandidate(fromPlayer, candidate),
      onTrack: (stream) => this.streamManager.addRemoteStream(fromPlayer, stream),
      onConnectionStateChange: (state) => {
        console.log(`[WebRTC] Connection state with ${fromPlayer}: ${state}`);
        if (state === 'disconnected' || state === 'failed') {
          this.handleProximityDisconnect({
            targetPlayerID: fromPlayer,
            action: 'disconnect',
            distance: 0,
          });
        }
      },
    });

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.signalingClient.sendAnswer(fromPlayer, pc.localDescription);
      console.log(`[WebRTC] Answer envoyé à ${fromPlayer}`);
    } catch (error) {
      console.error('Error handling offer:', error);
    } finally {
      this.processingOffer.delete(fromPlayer);
    }
  }

  private async handleRemoteAnswer(message: WebRTCMessage): Promise<void> {
    const { fromPlayer, data } = message;
    if (!fromPlayer) return;

    const pc = this.peerManager.getConnection(fromPlayer);
    if (!pc) {
      console.warn(`[WebRTC] Answer ignoré - pas de connexion avec ${fromPlayer}`);
      return;
    }

    if (this.answerApplied.has(fromPlayer)) {
      console.warn(`[WebRTC] Answer dupliqué ignoré de ${fromPlayer}`);
      return;
    }

    if (pc.signalingState === 'stable') {
      console.warn(`[WebRTC] Answer ignoré - déjà stable avec ${fromPlayer}`);
      this.answerApplied.add(fromPlayer);
      return;
    }

    if (pc.signalingState !== 'have-local-offer') {
      console.warn(`[WebRTC] Answer ignoré, état: ${pc.signalingState}`);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
      this.answerApplied.add(fromPlayer);
      console.log(`[WebRTC] Answer appliqué de ${fromPlayer}`);
    } catch (error: any) {
      if (error?.name === 'InvalidStateError' && pc.signalingState === 'stable') {
        console.warn(`[WebRTC] Answer ignoré (race) - stable avec ${fromPlayer}`);
        this.answerApplied.add(fromPlayer);
        return;
      }
      console.error('Error handling answer:', error);
    }
  }

  private async handleRemoteIceCandidate(message: WebRTCMessage): Promise<void> {
    const { fromPlayer, data } = message;
    if (!fromPlayer) return;

    const pc = this.peerManager.getConnection(fromPlayer);
    if (!pc) return;

    // ICE peut arriver avant remoteDescription
    if (pc.remoteDescription === null) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  cleanup(): void {
    this.peerManager.closeAllConnections();
    this.streamManager.cleanup();
    this.processingOffer.clear();
    this.answerApplied.clear();
  }
}
