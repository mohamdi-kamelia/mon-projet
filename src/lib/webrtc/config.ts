import type { WebRTCConfig } from './types';

export const WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const PROXIMITY_CONFIG = {
  connectThreshold: 5.0,
  disconnectThreshold: 8.0,
  positionUpdateInterval: 200,
};