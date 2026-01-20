/**
 * Hook pour détecter si l'utilisateur est sur mobile et le communiquer à Unity
 */

import { useState, useEffect } from 'react';
import { BaseUnityHookProps } from '../types';
import { sendUnityMessage } from '../utils/unityHelpers';

export const useUnityMobile = ({ isLoaded, unityInstance }: BaseUnityHookProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Mobi|iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log("Is Mobile Detected?", isMobileDevice);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isLoaded && unityInstance) {
      sendUnityMessage(
        unityInstance,
        "WebInteraction",
        "IsMobile",
        isMobile ? 1 : 0
      );
    }
  }, [isLoaded, isMobile, unityInstance]);

  return { isMobile };
};
