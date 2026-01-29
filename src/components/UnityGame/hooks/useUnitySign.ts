import { useUnityInteraction, UnityHookProps, InteractionConfig } from './useUnityInteraction';
import { WebEvents } from './webEvents';

// ============================================================================
// Data Types
// ============================================================================

interface SignData {
    signText: string;
    signFilter: string;
}

// ============================================================================
// Configuration
// ============================================================================

const signConfig: InteractionConfig<SignData> = {
    name: 'Sign',
    receiveEvent: WebEvents.Sign.RECEIVE,
    closeEvent: WebEvents.Sign.CLOSE_MODAL,
    closeMethod: WebEvents.Sign.CLOSE_METHOD,
    
    parseData: (text: string, filter: string): SignData | null => {
        if (!text) return null;
        
        return {
            signText: text,
            signFilter: filter || 'No filter set',
        };
    },
    
    getDefaultData: () => ({ signText: '', signFilter: '' }),
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for Sign/Library Rack interactions.
 * 
 * Displays sign text and filter information for library racks.
 * Integrates with Éduscol educational resources.
 * 
 * @example
 * const { signText, signFilter, isOpen, onClose } = useUnitySign(props);
 */
export const useUnitySign = (props: UnityHookProps) => {
    const result = useUnityInteraction(signConfig, props);
    
    // Return with backward-compatible property names
    return {
        signText: result.data.signText,
        signFilter: result.data.signFilter,
        isOpen: result.isOpen,
        onClose: result.onClose,
    };
};