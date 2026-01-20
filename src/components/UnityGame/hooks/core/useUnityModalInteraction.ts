/**
 * Hook générique pour gérer les interactions modales avec Unity
 * Factorise la logique commune de tous les hooks d'interaction
 */

import { useState, useCallback, useEffect } from 'react';
import type { UnityInteractionHookProps, ModalState } from '../types';
import { useCursorManagement } from '../core/useCursorManagement';
import { sendUnityMessage, exposeToWindow } from '../utils/unityHelpers';

interface UseUnityModalInteractionConfig<TData> {
  openEventName: string;
  closeEventName: string;
  closeMethodName: string;
  windowCloseName?: string;
  parseData: (...params: any[]) => TData;
  defaultData: TData;
}

export const useUnityModalInteraction = <TData,>(
  props: UnityInteractionHookProps,
  config: UseUnityModalInteractionConfig<TData>
) => {
  const { addEventListener, removeEventListener, isLoaded, unityInstance } = props;
  const [data, setData] = useState<TData>(config.defaultData);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  useCursorManagement({ isOpen, isLoaded, unityInstance });

  const handleOpen = useCallback((...parameters: any[]) => {
    console.log(`${config.openEventName} received from Unity`);
    
    try {
      const parsedData = config.parseData(...parameters);
      setData(parsedData);
      setIsOpen(true);
    } catch (error) {
      console.error(`Error parsing data for ${config.openEventName}:`, error);
      setData(config.defaultData);
      setIsOpen(false);
    }
  }, [config]);

  const handleCloseFromUnity = useCallback(() => {
    console.log(`${config.closeEventName} received from Unity`);
    setIsOpen(false);
    setData(config.defaultData);
  }, [config]);

  const handleCloseFromWeb = useCallback(() => {
    console.log(`Closing modal - sending ${config.closeMethodName} to Unity`);
    
    if (sendUnityMessage(unityInstance, "WebInteraction", config.closeMethodName)) {
      setIsOpen(false);
      setData(config.defaultData);
    }
  }, [isLoaded, unityInstance, config]);

  useEffect(() => {
    addEventListener(config.openEventName, handleOpen);
    addEventListener(config.closeEventName, handleCloseFromUnity);
    
    return () => {
      removeEventListener(config.openEventName, handleOpen);
      removeEventListener(config.closeEventName, handleCloseFromUnity);
    };
  }, [addEventListener, removeEventListener, handleOpen, handleCloseFromUnity, config]);

  useEffect(() => {
    if (config.windowCloseName) {
      return exposeToWindow(config.windowCloseName, handleCloseFromUnity);
    }
  }, [handleCloseFromUnity, config.windowCloseName]);

  return {
    data,
    isOpen,
    onClose: handleCloseFromWeb,
    setData, 
  };
};
