/**
 * Hook pour l'interaction avec les bureaux de bibliothèque Unity
 */

import { useCallback } from 'react';
import { UnityInteractionHookProps, LibraryDeskInteractionData } from '../types';
import { useUnityModalInteraction } from '../core/useUnityModalInteraction';
import { sendUnityMessage, safeJsonParse } from '../utils/unityHelpers';

export const useUnityLibraryDesk = (props: UnityInteractionHookProps) => {
  const { isLoaded, unityInstance } = props;

  const { data, isOpen, onClose, setData } = useUnityModalInteraction<LibraryDeskInteractionData>(
    props,
    {
      openEventName: 'ReceiveHelpDeskInteraction',
      closeEventName: 'CloseHelpDeskModal',
      closeMethodName: 'CloseHelpDeskInteraction',
      windowCloseName: 'CloseHelpDeskModal',
      parseData: (signTextsJson: string) => {
        console.log("LibraryDesk - Parsing sign texts:", signTextsJson);
        const parsedSignTexts = safeJsonParse<string[]>(signTextsJson, []);
        
        return {
          signTexts: Array.isArray(parsedSignTexts) ? parsedSignTexts : [],
          selectedSignText: null
        };
      },
      defaultData: { signTexts: [], selectedSignText: null }
    }
  );

  // Sélectionner un texte
  const onSelectSignText = useCallback((signText: string | null) => {
    setData(prev => ({
      ...prev,
      selectedSignText: signText
    }));
  }, [setData]);

  // Confirmer la sélection
  const onConfirm = useCallback(() => {
    if (!data.selectedSignText) {
      console.warn("No sign text selected!");
      return;
    }

    console.log("LibraryDesk - Confirming selection:", data.selectedSignText);

    if (isLoaded && unityInstance) {
      sendUnityMessage(
        unityInstance,
        "WebInteraction",
        "ConfirmLibraryDeskSelection",
        data.selectedSignText
      );
      sendUnityMessage(unityInstance, "WebInteraction", "CloseHelpDeskInteraction");
    }

    // Fermer localement
    setData({ signTexts: [], selectedSignText: null });
  }, [data.selectedSignText, isLoaded, unityInstance, setData]);

  return {
    signTexts: data.signTexts,
    selectedSignText: data.selectedSignText,
    isOpen,
    onSelectSignText,
    onClose,
    onConfirm
  };
};
