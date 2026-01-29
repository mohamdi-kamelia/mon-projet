import { useState, useCallback, useEffect, useRef } from 'react';
import {
    UseUnityInteractionPromptProps,
    UseUnityInteractionPromptReturn
} from '../types/interactionPrompt.types';

/**
 * Event names for Unity communication
 */
const INTERACTION_PROMPT_EVENTS = {
    SHOW: 'ShowInteractionPrompt',
    HIDE: 'HideInteractionPrompt',
    RECEIVER_OBJECT: 'WebInteraction',
    TRIGGER_METHOD: 'TriggerInteractionFromWeb'
} as const;

/**
 * Hook for managing the interaction prompt UI
 * 
 * Listens to Unity events for showing/hiding the prompt,
 * and can trigger interactions back to Unity when the button is clicked.
 * 
 * @example
 * const { isVisible, isMobile, triggerInteraction } = useUnityInteractionPrompt({
 *     addEventListener,
 *     removeEventListener,
 *     isLoaded,
 *     unityInstance
 * });
 */
export const useUnityInteractionPrompt = ({
    addEventListener,
    removeEventListener,
    isLoaded,
    unityInstance
}: UseUnityInteractionPromptProps): UseUnityInteractionPromptReturn => {
    // State
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Ref to track if we're mounted
    const isMountedRef = useRef(true);

    // ========== Unity → Web: Event Handlers ==========

    /**
     * Handle show prompt event from Unity
     */
    const handleShowPrompt = useCallback((isMobileDevice: boolean) => {
        console.log('[InteractionPrompt] Show prompt, isMobile:', isMobileDevice);
        if (isMountedRef.current) {
            setIsVisible(true);
            setIsMobile(isMobileDevice);
        }
    }, []);

    /**
     * Handle hide prompt event from Unity
     */
    const handleHidePrompt = useCallback(() => {
        console.log('[InteractionPrompt] Hide prompt');
        if (isMountedRef.current) {
            setIsVisible(false);
        }
    }, []);

    // ========== Web → Unity: Actions ==========

    /**
     * Trigger interaction in Unity
     * Called when user clicks/taps the interaction button
     */
    const triggerInteraction = useCallback(() => {
        if (!isLoaded || !unityInstance) {
            console.warn('[InteractionPrompt] Unity not ready, cannot trigger interaction');
            return;
        }

        console.log('[InteractionPrompt] Triggering interaction in Unity');
        unityInstance.SendMessage(
            INTERACTION_PROMPT_EVENTS.RECEIVER_OBJECT,
            INTERACTION_PROMPT_EVENTS.TRIGGER_METHOD
        );
    }, [isLoaded, unityInstance]);

    // ========== Effects ==========

    // Subscribe to Unity events
    useEffect(() => {
        addEventListener(INTERACTION_PROMPT_EVENTS.SHOW, handleShowPrompt);
        addEventListener(INTERACTION_PROMPT_EVENTS.HIDE, handleHidePrompt);

        return () => {
            removeEventListener(INTERACTION_PROMPT_EVENTS.SHOW, handleShowPrompt);
            removeEventListener(INTERACTION_PROMPT_EVENTS.HIDE, handleHidePrompt);
        };
    }, [addEventListener, removeEventListener, handleShowPrompt, handleHidePrompt]);

    // Track mounted state
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        isVisible,
        isMobile,
        triggerInteraction
    };
};
