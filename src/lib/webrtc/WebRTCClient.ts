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

  constructor(
    private ws: WebSocket,
    private localPlayerId: string
  ) {
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

    if (this.peerManager.hasConnection(targetPlayerID)) {
      return;
    }

    const pc = this.peerManager.createConnection(targetPlayerID, {
      onIceCandidate: (candidate) => {
        this.signalingClient.sendIceCandidate(targetPlayerID, candidate);
      },
      onTrack: (stream) => {
        this.streamManager.addRemoteStream(targetPlayerID, stream);
      },
      onConnectionStateChange: (state) => {
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
        this.signalingClient.sendOffer(targetPlayerID, offer);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
  }

  private handleProximityDisconnect(notification: ProximityNotification): void {
    const { targetPlayerID } = notification;
    this.peerManager.closeConnection(targetPlayerID);
    this.streamManager.removeRemoteStream(targetPlayerID);
  }

  private async handleRemoteOffer(message: WebRTCMessage): Promise<void> {
    const { fromPlayer, data } = message;
    if (!fromPlayer) return;

    let pc = this.peerManager.getConnection(fromPlayer);
    if (!pc) {
      pc = this.peerManager.createConnection(fromPlayer, {
        onIceCandidate: (candidate) => {
          this.signalingClient.sendIceCandidate(fromPlayer, candidate);
        },
        onTrack: (stream) => {
          this.streamManager.addRemoteStream(fromPlayer, stream);
        },
        onConnectionStateChange: (state) => {
          if (state === 'disconnected' || state === 'failed') {
            this.handleProximityDisconnect({
              targetPlayerID: fromPlayer,
              action: 'disconnect',
              distance: 0,
            });
          }
        },
      });
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.signalingClient.sendAnswer(fromPlayer, answer);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleRemoteAnswer(message: WebRTCMessage): Promise<void> {
    const { fromPlayer, data } = message;
    if (!fromPlayer) return;

    const pc = this.peerManager.getConnection(fromPlayer);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private async handleRemoteIceCandidate(message: WebRTCMessage): Promise<void> {
    const { fromPlayer, data } = message;
    if (!fromPlayer) return;

    const pc = this.peerManager.getConnection(fromPlayer);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  cleanup(): void {
    this.peerManager.closeAllConnections();
    this.streamManager.cleanup();
  }
}