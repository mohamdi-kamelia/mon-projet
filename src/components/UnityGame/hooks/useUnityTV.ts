import { useUnityInteraction, UnityHookProps, InteractionConfig } from './useUnityInteraction';
import { WebEvents } from './webEvents';

// ============================================================================
// Data Types
// ============================================================================

interface TVData {
    videoUrl: string;
}

// ============================================================================
// Configuration
// ============================================================================

const tvConfig: InteractionConfig<TVData> = {
    name: 'TV',
    receiveEvent: WebEvents.TV.RECEIVE,
    closeEvent: WebEvents.TV.CLOSE_MODAL,
    closeMethod: WebEvents.TV.CLOSE_METHOD,
    
    parseData: (url: string): TVData | null => {
        if (!url) return null;
        
        // Transform YouTube watch URLs to embed URLs
        let videoUrl = url;
        if (url.includes("watch?v=")) {
            const videoId = url.split("watch?v=")[1].split("&")[0];
            videoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        
        return { videoUrl };
    },
    
    getDefaultData: () => ({ videoUrl: '' }),
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for TV/Video interactions.
 * 
 * Handles YouTube video playback in modal.
 * Automatically converts YouTube watch URLs to embed URLs.
 * 
 * @example
 * const { data, isOpen, onClose } = useUnityTV(props);
 * // data.videoUrl contains the embed URL
 */
export const useUnityTV = (props: UnityHookProps) => {
    const result = useUnityInteraction(tvConfig, props);
    
    // Return with backward-compatible property names
    return {
        videoUrl: result.data.videoUrl,
        isOpen: result.isOpen,
        onClose: result.onClose,
    };
};