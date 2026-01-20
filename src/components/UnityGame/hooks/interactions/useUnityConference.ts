/**
 * Hook pour gérer les conférences Unity (visioconférence)
 */
import { useState, useCallback, useEffect } from 'react';
import type { UnityInteractionHookProps, ConferenceData } from '../types';
import { useCursorManagement } from '../core/useCursorManagement';
import { sendUnityMessage, isValidUrl, exposeToWindow } from '../utils/unityHelpers';

interface UseUnityConferenceProps extends UnityInteractionHookProps {
  webConferenceUrl?: string;
}

export const useUnityConference = ({
  // addEventListener,
  // removeEventListener,
  isLoaded,
  unityInstance,
  webConferenceUrl
}: UseUnityConferenceProps) => {
  const [conference, setConference] = useState<ConferenceData>({
    url: '',
    isActive: false,
    isFullscreen: false
  });

  // Gestion du curseur pour le mode plein écran
  useCursorManagement({
    isOpen: conference.isFullscreen,
    isLoaded,
    unityInstance
  });

  // Déterminer l'URL à utiliser
  const getUrlToUse = useCallback((unityUrl: string): string | null => {
    console.log("Conference URL selection:");
    console.log("  - Unity provided:", unityUrl);
    console.log("  - Web provided:", webConferenceUrl);

    // Vérifier si webConferenceUrl est mal configuré
    if (webConferenceUrl === "conferenceUrl") {
      console.error("ERROR: conferenceUrl prop is literal string 'conferenceUrl'!");
      return isValidUrl(unityUrl) ? unityUrl : null;
    }

    // Préférer l'URL web si disponible, sinon Unity
    const urlToUse = (webConferenceUrl && webConferenceUrl.trim() !== '')
      ? webConferenceUrl
      : unityUrl;

    console.log("  - Final URL:", urlToUse, 
      (webConferenceUrl && webConferenceUrl.trim() !== '') ? "(from web)" : "(from Unity)");

    return isValidUrl(urlToUse) ? urlToUse : null;
  }, [webConferenceUrl]);

  // Rejoindre une conférence
  const handleJoinConference = useCallback((conferenceLink: string) => {
    console.log("Join Conference received from Unity");
    
    const url = getUrlToUse(conferenceLink);
    
    if (!url) {
      console.error("ERROR: Invalid or missing conference URL!");
      setConference({ url: '', isActive: false, isFullscreen: false });
      return;
    }

    console.log("✓ Valid conference URL:", url);
    setConference({ url, isActive: true, isFullscreen: false });
  }, [getUrlToUse]);

  // Quitter une conférence
  const handleLeaveConference = useCallback(() => {
    console.log("Leave Conference received from Unity");
    setConference({ url: '', isActive: false, isFullscreen: false });
  }, []);

  // Passer en mode plein écran
  const handleShowConference = useCallback(() => {
    console.log("Show Conference (fullscreen) received from Unity");
    setConference(prev => ({ ...prev, isFullscreen: true }));
  }, []);

  // Quitter le mode plein écran
  const handleHideConference = useCallback(() => {
    console.log("Hide Conference (mini mode) received from Unity");
    setConference(prev => ({ ...prev, isFullscreen: false }));
  }, []);

  // Fermer le plein écran (bouton web)
  const handleCloseFullscreen = useCallback(() => {
    console.log("Close button pressed - telling Unity to stand up");
    sendUnityMessage(unityInstance, "WebInteraction", "StandUpPlayer");
  }, [unityInstance]);

  // Événements Unity
  useEffect(() => {
    const cleanup = [
      exposeToWindow('JoinConference', handleJoinConference),
      exposeToWindow('LeaveConference', handleLeaveConference),
      exposeToWindow('ShowConference', handleShowConference),
      exposeToWindow('HideConference', handleHideConference)
    ];

    return () => cleanup.forEach(fn => fn());
  }, [handleJoinConference, handleLeaveConference, handleShowConference, handleHideConference]);

  // Debug
  useEffect(() => {
    console.log("Conference state:", {
      url: conference.url,
      isActive: conference.isActive,
      isFullscreen: conference.isFullscreen,
      shouldRenderIframe: conference.isActive && conference.url.trim() !== ''
    });
  }, [conference]);

  return {
    conferenceUrl: conference.url,
    isActive: conference.isActive,
    isFullscreen: conference.isFullscreen,
    onClose: handleCloseFullscreen
  };
};
