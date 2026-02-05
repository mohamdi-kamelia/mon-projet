import { useUnityInteraction, UnityHookProps, InteractionConfig } from './useUnityInteraction';
import { WebEvents } from './webEvents';

// ============================================================================
// Data Types
// ============================================================================

interface MediaData {
    imageUrl: string;
    imageTitle: string;
}

// ============================================================================
// Configuration
// ============================================================================

const mediaConfig: InteractionConfig<MediaData> = {
    name: 'Media',
    receiveEvent: WebEvents.Media.RECEIVE,
    closeEvent: WebEvents.Media.CLOSE_MODAL,
    closeMethod: WebEvents.Media.CLOSE_METHOD,
    
    parseData: (url: string, title: string): MediaData | null => {
        if (!url) return null;
        
        return {
            imageUrl: url,
            imageTitle: title || 'Image',
        };
    },
    
    getDefaultData: () => ({ imageUrl: '', imageTitle: '' }),
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for Media/Poster interactions.
 * 
 * Displays images and posters in a modal view.
 * 
 * @example
 * const { imageUrl, imageTitle, isOpen, onClose } = useUnityMedia(props);
 */
export const useUnityMedia = (props: UnityHookProps) => {
    const result = useUnityInteraction(mediaConfig, props);
    
    // Return with backward-compatible property names
    return {
        imageUrl: result.data.imageUrl,
        imageTitle: result.data.imageTitle,
        isOpen: result.isOpen,
        onClose: result.onClose,
    };
};