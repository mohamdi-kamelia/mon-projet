export class StreamManager {
  private remoteStreams = new Map<string, MediaStream>();
  private localStream: MediaStream | null = null;
  
  private onStreamAddedCallbacks: Array<(playerId: string, stream: MediaStream) => void> = [];
  private onStreamRemovedCallbacks: Array<(playerId: string) => void> = [];

  async initializeLocalStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia not available');
      throw new Error('getUserMedia not supported - HTTPS required or browser incompatible');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints || {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
          },
        }
      );

      this.localStream = stream;
      console.log('✅ Local stream initialized');
      return stream;
    } catch (error) {
      console.error('❌ getUserMedia error:', error);
      throw error;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  addRemoteStream(playerId: string, stream: MediaStream): void {
    this.remoteStreams.set(playerId, stream);
    this.onStreamAddedCallbacks.forEach((cb) => cb(playerId, stream));
  }

  removeRemoteStream(playerId: string): void {
    this.remoteStreams.delete(playerId);
    this.onStreamRemovedCallbacks.forEach((cb) => cb(playerId));
  }

  getRemoteStream(playerId: string): MediaStream | undefined {
    return this.remoteStreams.get(playerId);
  }

  getAllRemoteStreams(): Map<string, MediaStream> {
    return new Map(this.remoteStreams);
  }

  onStreamAdded(callback: (playerId: string, stream: MediaStream) => void): void {
    this.onStreamAddedCallbacks.push(callback);
  }

  onStreamRemoved(callback: (playerId: string) => void): void {
    this.onStreamRemovedCallbacks.push(callback);
  }

  cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.remoteStreams.clear();
    this.onStreamAddedCallbacks = [];
    this.onStreamRemovedCallbacks = [];
  }
}