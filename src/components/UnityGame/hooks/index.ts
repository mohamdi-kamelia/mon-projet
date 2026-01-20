/**
 * Unity Hooks Library
 * 
 * Collection de hooks React pour l'intégration Unity WebGL
 * 
 * @module unity-hooks
 */

// Core hooks
export {
  useCursorManagement,
  useUnityInitialFocus,
  useUnityMobile,
  useUnityFullscreen,
  useUnityModalInteraction
} from './core';

// Interaction hooks
export {
  useUnityTV,
  useUnitySign,
  useUnityNewsStand,
  useUnityLibraryDesk,
  useUnityBBB,
  useUnityJitsi, // Alias pour compatibilité
  useUnityConference
} from './interactions';

// Types
export type {
  UnityInstance,
  UnityEventListeners,
  BaseUnityHookProps,
  UnityInteractionHookProps,
  ModalState,
  CursorManagementProps,
  SignInteractionData,
  LibraryDeskInteractionData,
  NewsStandInteractionData,
  ConferenceData
} from './types';

// Utilities (optionnel - pour usage avancé)
export * from './utils';
