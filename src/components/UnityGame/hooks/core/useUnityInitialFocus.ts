/**
 * Hook pour donner automatiquement le focus au canvas Unity lors du chargement
 */

import { useEffect } from 'react';
import { focusUnityCanvas } from '../utils/unityHelpers';

interface UseUnityInitialFocusProps {
  isLoaded: boolean;
}

export const useUnityInitialFocus = ({ isLoaded }: UseUnityInitialFocusProps) => {
  useEffect(() => {
    if (!isLoaded) return;
    focusUnityCanvas(200);
  }, [isLoaded]);
};
