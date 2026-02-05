import { useState, useCallback, useEffect, useRef } from 'react';
import { useModalCursor } from './useModalCursor';
import { WebEvents } from './webEvents';

/**
 * Common props for all Unity interaction hooks.
 * Extracted to avoid repeating the same interface in every hook.
 */
export interface UnityHookProps {
    addEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
    removeEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
    isLoaded: boolean;
    unityInstance: any;
}

/**
 * Configuration for a Unity interaction.
 * Each interaction type provides its specific event names and data parsing logic.
 */
export interface InteractionConfig<TData> {
    /** Name for logging purposes */
    name: string;
    
    /** Event name dispatched from Unity when interaction starts (e.g., "ReceiveTVInteraction") */
    receiveEvent: string;
    
    /** Event name dispatched from Unity when modal should close (e.g., "CloseTVModal") */
    closeEvent: string;
    
    /** Method name to call on WebInteraction GameObject to close (e.g., "CloseTVInteraction") */
    closeMethod: string;
    
    /** 
     * Parse raw parameters from Unity into typed data.
     * Return null to indicate invalid data (modal won't open).
     */
    parseData: (...args: any[]) => TData | null;
    
    /** 
     * Get the default/empty state for data.
     * Called when modal closes to reset state.
     */
    getDefaultData: () => TData;
    
    /**
     * Optional: Additional events to subscribe to.
     * Useful for error events like NewsStand's ReceiveNewsStandInteractionError.
     */
    additionalEvents?: Array<{
        eventName: string;
        handler: (setData: React.Dispatch<React.SetStateAction<TData>>, setIsOpen: React.Dispatch<React.SetStateAction<boolean>>) => (...args: any[]) => void;
    }>;
    
    /**
     * Optional: Whether to expose close handler on window object.
     * Default: true
     */
    exposeOnWindow?: boolean;
}

/**
 * Return type for the generic interaction hook.
 */
export interface InteractionHookResult<TData> {
    /** Current interaction data */
    data: TData;
    
    /** Whether the modal is currently open */
    isOpen: boolean;
    
    /** Close the modal and notify Unity */
    onClose: () => void;
    
    /** 
     * Update data manually (useful for forms/selections within modal).
     * Note: This doesn't notify Unity, just updates local state.
     */
    updateData: (updater: TData | ((prev: TData) => TData)) => void;
    
    /**
     * Send a message to Unity (for custom actions like confirmSelection).
     */
    sendToUnity: (methodName: string, parameter?: string) => void;
}

/**
 * Generic hook factory for Unity interactions.
 * 
 * This hook handles all the common boilerplate:
 * - Event subscription/unsubscription
 * - Modal state management (isOpen)
 * - Data state management with parsing
 * - Cursor management via useModalCursor
 * - Close functionality with Unity notification
 * - Window exposure for direct JS calls
 * 
 * @example
 * // Simple usage for TV
 * const tvConfig: InteractionConfig<{ videoUrl: string }> = {
 *     name: 'TV',
 *     receiveEvent: WebEvents.TV.RECEIVE,
 *     closeEvent: WebEvents.TV.CLOSE_MODAL,
 *     closeMethod: WebEvents.TV.CLOSE_METHOD,
 *     parseData: (url: string) => {
 *         if (!url) return null;
 *         // Transform YouTube watch URLs to embed URLs
 *         if (url.includes("watch?v=")) {
 *             const videoId = url.split("watch?v=")[1].split("&")[0];
 *             return { videoUrl: `https://www.youtube.com/embed/${videoId}` };
 *         }
 *         return { videoUrl: url };
 *     },
 *     getDefaultData: () => ({ videoUrl: '' }),
 * };
 * 
 * export const useUnityTV = (props: UnityHookProps) => useUnityInteraction(tvConfig, props);
 */
export function useUnityInteraction<TData>(
    config: InteractionConfig<TData>,
    { addEventListener, removeEventListener, isLoaded, unityInstance }: UnityHookProps
): InteractionHookResult<TData> {
    const [data, setData] = useState<TData>(config.getDefaultData());
    const [isOpen, setIsOpen] = useState<boolean>(false);
    
    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);
    
    // Manage cursor visibility when modal opens/closes
    useModalCursor({ isOpen, isLoaded, unityInstance });

    // Handler for receiving interaction from Unity
    const handleReceive = useCallback((...args: any[]) => {
        console.log(`${config.name} Interaction received from Unity:`, args);
        
        const parsedData = config.parseData(...args);
        
        if (parsedData !== null) {
            setData(parsedData);
            setIsOpen(true);
        } else {
            console.warn(`${config.name}: Received interaction with invalid data.`);
        }
    }, [config]);

    // Handler for close signal from Unity
    const handleClose = useCallback(() => {
        console.log(`${config.name}: Close signal received from Unity`);
        setIsOpen(false);
        setData(config.getDefaultData());
    }, [config]);

    // Close function that notifies Unity
    const onClose = useCallback(() => {
        console.log(`${config.name}: Close requested - notifying Unity`);

        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                WebEvents.RECEIVER_OBJECT,
                config.closeMethod
            );
            console.log(`${config.name}: Sent ${config.closeMethod} to Unity`);
        } else {
            console.warn(`${config.name}: Unity not ready, closing locally`);
            setIsOpen(false);
            setData(config.getDefaultData());
        }
    }, [isLoaded, unityInstance, config]);

    // Helper to send custom messages to Unity
    const sendToUnity = useCallback((methodName: string, parameter?: string) => {
        if (isLoaded && unityInstance) {
            if (parameter !== undefined) {
                unityInstance.SendMessage(WebEvents.RECEIVER_OBJECT, methodName, parameter);
            } else {
                unityInstance.SendMessage(WebEvents.RECEIVER_OBJECT, methodName);
            }
            console.log(`${config.name}: Sent ${methodName} to Unity`, parameter ? `with: ${parameter}` : '');
        } else {
            console.warn(`${config.name}: Unity not ready, cannot send ${methodName}`);
        }
    }, [isLoaded, unityInstance, config.name]);

    // Update data helper
    const updateData = useCallback((updater: TData | ((prev: TData) => TData)) => {
        setData(updater);
    }, []);

    // Subscribe to receive event
    useEffect(() => {
        addEventListener(config.receiveEvent, handleReceive);
        return () => {
            removeEventListener(config.receiveEvent, handleReceive);
        };
    }, [addEventListener, removeEventListener, handleReceive, config.receiveEvent]);

    // Subscribe to close event
    useEffect(() => {
        addEventListener(config.closeEvent, handleClose);
        return () => {
            removeEventListener(config.closeEvent, handleClose);
        };
    }, [addEventListener, removeEventListener, handleClose, config.closeEvent]);

    // Subscribe to additional events if configured
    useEffect(() => {
        if (!config.additionalEvents) return;

        const handlers = config.additionalEvents.map(({ eventName, handler }) => ({
            eventName,
            boundHandler: handler(setData, setIsOpen),
        }));

        handlers.forEach(({ eventName, boundHandler }) => {
            addEventListener(eventName, boundHandler);
        });

        return () => {
            handlers.forEach(({ eventName, boundHandler }) => {
                removeEventListener(eventName, boundHandler);
            });
        };
    }, [addEventListener, removeEventListener, config.additionalEvents]);

    // Expose close handler on window (for direct JS calls from Unity if needed)
    useEffect(() => {
        if (config.exposeOnWindow === false) return;
        
        if (typeof window !== 'undefined') {
            (window as any)[config.closeEvent] = handleClose;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any)[config.closeEvent];
            }
        };
    }, [handleClose, config.closeEvent, config.exposeOnWindow]);

    // Track mounted state
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        data,
        isOpen,
        onClose,
        updateData,
        sendToUnity,
    };
}