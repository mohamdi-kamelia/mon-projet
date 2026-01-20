/**
 * Hook pour l'interaction avec les kiosques à journaux Unity
 */

import { useCallback, useEffect } from 'react';
import type { UnityInteractionHookProps, NewsStandInteractionData } from '../types';
import { useUnityModalInteraction } from '../core/useUnityModalInteraction';

export const useUnityNewsStand = (props: UnityInteractionHookProps) => {
  const { addEventListener, removeEventListener } = props;

  const { data, isOpen, onClose, setData } = useUnityModalInteraction<NewsStandInteractionData>(
    props,
    {
      openEventName: 'ReceiveNewsStandInteraction',
      closeEventName: 'CloseNewsStandModal',
      closeMethodName: 'CloseNewsStandInteraction',
      windowCloseName: 'CloseNewsStandModal',
      parseData: (content: string) => ({
        xmlContent: content || '',
        errorMessage: content && content.length > 0 ? '' : 'Aucun contenu reçu du serveur.'
      }),
      defaultData: { xmlContent: '', errorMessage: '' }
    }
  );

  // Handler spécifique pour les erreurs
  const handleError = useCallback((...parameters: any[]) => {
    const [error] = parameters as [string];
    console.log("NewsStand Error received from Unity:", error);
    
    setData({
      xmlContent: '',
      errorMessage: error || "Une erreur s'est produite lors du chargement des actualités."
    });
  }, [setData]);

  // Événement d'erreur supplémentaire
  useEffect(() => {
    addEventListener('ReceiveNewsStandInteractionError', handleError);
    return () => {
      removeEventListener('ReceiveNewsStandInteractionError', handleError);
    };
  }, [addEventListener, removeEventListener, handleError]);

  return {
    xmlContent: data.xmlContent,
    errorMessage: data.errorMessage,
    isOpen,
    onClose
  };
};
