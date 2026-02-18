interface SignalingMessage {
  type: string;
  fromPlayer?: string;
  toPlayer?: string;
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit | { candidate: RTCIceCandidateInit } | any;
}

export class SignalingClient {
  private ws: WebSocket;
  private localPlayerId: string;

  constructor(ws: WebSocket, localPlayerId: string) {
    this.ws = ws;
    this.localPlayerId = localPlayerId;
  }

  sendOffer(toPlayer: string, offer: RTCSessionDescriptionInit): void {
    this.send({
      type: 'webrtc_offer',
      toPlayer,
      data: {
        sdp: offer.sdp,
        type: offer.type,
      },
    });
  }

  sendAnswer(toPlayer: string, answer: RTCSessionDescriptionInit): void {
    this.send({
      type: 'webrtc_answer',
      toPlayer,
      data: {
        sdp: answer.sdp,
        type: answer.type,
      },
    });
  }

  sendIceCandidate(toPlayer: string, candidate: RTCIceCandidate): void {
    this.send({
      type: 'webrtc_ice',
      toPlayer,
      data: {
        candidate: candidate.toJSON(),
      },
    });
  }

  /**
   * Notifie tous les peers connectés du changement d'état mic/cam.
   * toPlayer = '*' pour broadcaster à tous, ou un playerId spécifique.
   */
  sendMediaState(toPlayer: string, micEnabled: boolean, camEnabled: boolean): void {
    this.send({
      type: 'webrtc_media_state',
      toPlayer,
      data: {
        micEnabled,
        camEnabled,
      },
    });
  }

  private send(message: SignalingMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          ...message,
          fromPlayer: this.localPlayerId,
        })
      );
    }
  }
}