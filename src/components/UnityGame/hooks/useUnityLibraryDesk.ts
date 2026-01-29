import { useCallback } from 'react';
import { useUnityInteraction, UnityHookProps, InteractionConfig } from './useUnityInteraction';
import { WebEvents } from './webEvents';

// ============================================================================
// Data Types
// ============================================================================

interface LibraryDeskData {
    signTexts: string[];
    selectedSignText: string | null;
}

// ============================================================================
// Configuration
// ============================================================================

const libraryDeskConfig: InteractionConfig<LibraryDeskData> = {
    name: 'LibraryDesk',
    receiveEvent: WebEvents.LibraryDesk.RECEIVE,
    closeEvent: WebEvents.LibraryDesk.CLOSE_MODAL,
    closeMethod: WebEvents.LibraryDesk.CLOSE_METHOD,
    
    parseData: (signTextsJson: string): LibraryDeskData | null => {
        try {
            const parsedSignTexts = JSON.parse(signTextsJson);
            
            if (Array.isArray(parsedSignTexts)) {
                return {
                    signTexts: parsedSignTexts,
                    selectedSignText: null,
                };
            }
            
            console.warn("LibraryDesk: Received invalid sign texts format");
            return { signTexts: [], selectedSignText: null };
            
        } catch (error) {
            console.error("LibraryDesk: Failed to parse sign texts JSON:", error);
            return { signTexts: [], selectedSignText: null };
        }
    },
    
    getDefaultData: () => ({ signTexts: [], selectedSignText: null }),
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for LibraryDesk interactions.
 * 
 * Displays available book themes and allows user to select one.
 * On confirmation, notifies Unity to show the path to the selected rack.
 * 
 * @example
 * const { 
 *     signTexts, 
 *     selectedSignText, 
 *     isOpen, 
 *     onSelectSignText, 
 *     onClose, 
 *     onConfirm 
 * } = useUnityLibraryDesk(props);
 */
export const useUnityLibraryDesk = (props: UnityHookProps) => {
    const result = useUnityInteraction(libraryDeskConfig, props);
    
    // Handler to update selected sign text
    const onSelectSignText = useCallback((signText: string | null) => {
        result.updateData(prev => ({
            ...prev,
            selectedSignText: signText,
        }));
    }, [result]);
    
    // Handler to confirm selection and close modal
    const onConfirm = useCallback(() => {
        const selected = result.data.selectedSignText;
        
        if (!selected) {
            console.warn("LibraryDesk: No sign text selected!");
            return;
        }
        
        console.log("LibraryDesk: Confirming selection:", selected);
        
        // Send selected sign text to Unity for pathfinding
        result.sendToUnity(WebEvents.LibraryDesk.CONFIRM_METHOD, selected);
        
        // Close the modal
        result.sendToUnity(WebEvents.LibraryDesk.CLOSE_METHOD);
        
        // Reset local state
        result.updateData(libraryDeskConfig.getDefaultData());
    }, [result]);
    
    // Return with backward-compatible property names
    return {
        signTexts: result.data.signTexts,
        selectedSignText: result.data.selectedSignText,
        isOpen: result.isOpen,
        onSelectSignText,
        onClose: result.onClose,
        onConfirm,
    };
};