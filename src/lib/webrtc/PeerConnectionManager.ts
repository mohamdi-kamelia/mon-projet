import { WEBRTC_CONFIG } from './config';

export class PeerConnectionManager {
  private connections = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;

  setLocalStream(stream: MediaStream) {
    this.localStream = stream;
  }

  createConnection(
    remotePlayerId: string,
    callbacks: {
      onIceCandidate: (candidate: RTCIceCandidate) => void;
      onTrack: (stream: MediaStream) => void;
      onConnectionStateChange: (state: RTCPeerConnectionState) => void;
    }
  ): RTCPeerConnection {
    const pc = new RTCPeerConnection(WEBRTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        callbacks.onIceCandidate(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      callbacks.onTrack(remoteStream);
    };

    pc.onconnectionstatechange = () => {
      callbacks.onConnectionStateChange(pc.connectionState);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    this.connections.set(remotePlayerId, pc);
    return pc;
  }

  getConnection(remotePlayerId: string): RTCPeerConnection | undefined {
    return this.connections.get(remotePlayerId);
  }

  closeConnection(remotePlayerId: string): void {
    const pc = this.connections.get(remotePlayerId);
    if (pc) {
      pc.close();
      this.connections.delete(remotePlayerId);
    }
  }

  closeAllConnections(): void {
    this.connections.forEach((pc) => pc.close());
    this.connections.clear();
  }

  hasConnection(remotePlayerId: string): boolean {
    return this.connections.has(remotePlayerId);
  }
}