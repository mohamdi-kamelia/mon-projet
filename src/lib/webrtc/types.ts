export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Player {
  id: string;
  position: Vector3;
  rotation: Quaternion;
  animationState?: number;
  skin?: string;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface ProximityConfig {
  connectThreshold: number;
  disconnectThreshold: number;
  positionUpdateInterval: number;
}