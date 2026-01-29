import { useUnityInteraction, UnityHookProps, InteractionConfig } from './useUnityInteraction';
import { WebEvents } from './webEvents';

// ============================================================================
// Data Types
// ============================================================================

interface NewsStandData {
    xmlContent: string;
    errorMessage: string;
}

// ============================================================================
// Configuration
// ============================================================================

const newsStandConfig: InteractionConfig<NewsStandData> = {
    name: 'NewsStand',
    receiveEvent: WebEvents.NewsStand.RECEIVE,
    closeEvent: WebEvents.NewsStand.CLOSE_MODAL,
    closeMethod: WebEvents.NewsStand.CLOSE_METHOD,
    
    parseData: (content: string): NewsStandData | null => {
        // NewsStand always opens modal, even with empty content (to show error)
        if (content && content.length > 0) {
            return {
                xmlContent: content,
                errorMessage: '',
            };
        }
        
        return {
            xmlContent: '',
            errorMessage: 'Aucun contenu reçu du serveur.',
        };
    },
    
    getDefaultData: () => ({ xmlContent: '', errorMessage: '' }),
    
    // Additional event for error handling
    additionalEvents: [
        {
            eventName: WebEvents.NewsStand.RECEIVE_ERROR,
            handler: (setData, setIsOpen) => (error: string) => {
                console.log("NewsStand Error received from Unity:", error);
                setData({
                    xmlContent: '',
                    errorMessage: error || "Une erreur s'est produite lors du chargement des actualités.",
                });
                setIsOpen(true);
            },
        },
    ],
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for NewsStand interactions.
 * 
 * Displays RSS feed content from Éduscol.
 * Handles both successful content loading and error states.
 * 
 * @example
 * const { xmlContent, errorMessage, isOpen, onClose } = useUnityNewsStand(props);
 * if (errorMessage) {
 *     // Show error state
 * } else {
 *     // Parse and display xmlContent
 * }
 */
export const useUnityNewsStand = (props: UnityHookProps) => {
    const result = useUnityInteraction(newsStandConfig, props);
    
    // Return with backward-compatible property names
    return {
        xmlContent: result.data.xmlContent,
        errorMessage: result.data.errorMessage,
        isOpen: result.isOpen,
        onClose: result.onClose,
    };
};