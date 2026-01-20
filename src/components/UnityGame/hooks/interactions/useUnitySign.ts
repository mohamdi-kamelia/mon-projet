/**
 * Hook pour l'interaction avec les panneaux/signs Unity
 */

import type { UnityInteractionHookProps,  SignInteractionData } from '../types';
import { useUnityModalInteraction } from '../core/useUnityModalInteraction';

export const useUnitySign = (props: UnityInteractionHookProps) => {
  const { data, isOpen, onClose } = useUnityModalInteraction<SignInteractionData>(props, {
    openEventName: 'ReceiveSignInteraction',
    closeEventName: 'CloseSignModal',
    closeMethodName: 'CloseSignInteraction',
    windowCloseName: 'CloseSignModal',
    parseData: (text: string, filter: string) => ({
      text: text || '',
      filter: filter || 'No filter set'
    }),
    defaultData: { text: '', filter: '' }
  });

  return {
    signText: data.text,
    signFilter: data.filter,
    isOpen,
    onClose
  };
};
