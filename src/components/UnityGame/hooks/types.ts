/**
 * Types partagés pour les hooks Unity
 */

export interface UnityEventListeners {
  addEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
  removeEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
}