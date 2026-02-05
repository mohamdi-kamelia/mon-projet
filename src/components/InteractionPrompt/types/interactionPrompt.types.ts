/**
 * Types for the Interaction Prompt system
 */

/**
 * Props for the useUnityInteractionPrompt hook
 */
export interface UseUnityInteractionPromptProps {
    addEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
    removeEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
    isLoaded: boolean;
    unityInstance: any;
}

/**
 * Return type for useUnityInteractionPrompt hook
 */
export interface UseUnityInteractionPromptReturn {
    /** Whether the prompt should be visible */
    isVisible: boolean;
    /** Whether the device is mobile (changes the prompt text) */
    isMobile: boolean;
    /** Function to trigger interaction (called when button is clicked) */
    triggerInteraction: () => void;
}

/**
 * Props for the InteractionPrompt component
 */
export interface InteractionPromptProps {
    /** Whether the prompt is visible */
    isVisible: boolean;
    /** Whether the device is mobile */
    isMobile: boolean;
    /** Function to trigger interaction */
    onInteract: () => void;
}
