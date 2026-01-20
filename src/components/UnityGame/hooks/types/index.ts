/**
 * Types partagés pour les hooks Unity
 */

export interface UnityInstance {
  SendMessage: (objectName: string, methodName: string, value?: any) => void;
}

export interface UnityEventListeners {
  addEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
  removeEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
}

export interface BaseUnityHookProps {
  isLoaded: boolean;
  unityInstance: UnityInstance | null;
}

export interface UnityInteractionHookProps extends BaseUnityHookProps, UnityEventListeners {}

export interface ModalState {
  isOpen: boolean;
  onClose: () => void;
}

export interface CursorManagementProps extends BaseUnityHookProps {
  isOpen: boolean;
}

// Types pour les différentes interactions
export interface SignInteractionData {
  text: string;
  filter: string;
}

export interface LibraryDeskInteractionData {
  signTexts: string[];
  selectedSignText: string | null;
}

export interface NewsStandInteractionData {
  xmlContent: string;
  errorMessage: string;
}

export interface ConferenceData {
  url: string;
  isActive: boolean;
  isFullscreen: boolean;
}
