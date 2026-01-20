/**
 * Hook générique pour gérer la visibilité du curseur lors de l'ouverture/fermeture de modales
 */

import { useEffect, useRef } from 'react';
import type { CursorManagementProps } from '../types';
import { sendUnityMessage, focusUnityCanvas } from '../utils/unityHelpers';

export const useCursorManagement = ({
  isOpen,
  isLoaded,
  unityInstance
}: CursorManagementProps) => {
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (!isLoaded || !unityInstance) {
      return;
    }

    const wasOpen = prevIsOpenRef.current;
    const justOpened = isOpen && !wasOpen;
    const justClosed = !isOpen && wasOpen;

    if (justOpened) {
      sendUnityMessage(unityInstance, "CursorManager", "ShowModalCursor");
    } else if (justClosed) {
      sendUnityMessage(unityInstance, "CursorManager", "HideModalCursor");
      focusUnityCanvas();
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, isLoaded, unityInstance]);
};
