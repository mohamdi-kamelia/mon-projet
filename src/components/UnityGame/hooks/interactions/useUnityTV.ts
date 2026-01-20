/**
 * Hook pour l'interaction avec les TVs Unity
 */

import type { UnityInteractionHookProps } from '../types';
import { useUnityModalInteraction } from '../core/useUnityModalInteraction';
import { convertToYouTubeEmbed } from '../utils/unityHelpers';

interface TVData {
  videoUrl: string;
}

export const useUnityTV = (props: UnityInteractionHookProps) => {
  const { data, isOpen, onClose } = useUnityModalInteraction<TVData>(props, {
    openEventName: 'ReceiveTVInteraction',
    closeEventName: 'CloseTVModal',
    closeMethodName: 'CloseTVInteraction',
    windowCloseName: 'CloseTVModal',
    parseData: (url: string) => ({
      videoUrl: url ? convertToYouTubeEmbed(url) : ''
    }),
    defaultData: { videoUrl: '' }
  });

  return {
    videoUrl: data.videoUrl,
    isOpen,
    onClose
  };
};
