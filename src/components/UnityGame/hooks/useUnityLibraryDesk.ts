import { useState, useCallback, useEffect } from 'react';
import { useModalCursor } from './useModalCursor';

interface UseUnityLibraryDeskProps {
    addEventListener: any;
    removeEventListener: any;
    isLoaded: boolean;
    unityInstance: any;
}

export const useUnityLibraryDesk = ({
    addEventListener,
    removeEventListener,
    isLoaded,
    unityInstance
}: UseUnityLibraryDeskProps) => {
    const [signTexts, setSignTexts] = useState<string[]>([]);
    const [selectedSignText, setSelectedSignText] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Manage cursor visibility when modal opens/closes
    useModalCursor({ isOpen, isLoaded, unityInstance });

    const handleReceiveHelpDeskInteraction = useCallback((...parameters: any[]) => {
        const [signTextsJson] = parameters as [string];

        console.log("LibraryDesk Interaction received from Unity:");
        console.log("  Sign Texts JSON:", signTextsJson);

        try {
            const parsedSignTexts = JSON.parse(signTextsJson);
            
            if (Array.isArray(parsedSignTexts) && parsedSignTexts.length > 0) {
                setSignTexts(parsedSignTexts);
                setSelectedSignText(null);
                setIsOpen(true);
                console.log("  Parsed sign texts:", parsedSignTexts);
            } else {
                console.warn("Received empty or invalid sign texts array");
                setSignTexts([]);
                setSelectedSignText(null);
                setIsOpen(true);
            }
        } catch (error) {
            console.error("Failed to parse sign texts JSON:", error);
            setSignTexts([]);
            setIsOpen(true);
        }
    }, []);

    const handleCloseHelpDeskModal = useCallback(() => {
        console.log("Close LibraryDesk Modal signal received from Unity");
        setIsOpen(false);
        setSelectedSignText(null);
        setSignTexts([]);
    }, []);

    const closeModal = useCallback(() => {
        console.log("Close LibraryDesk modal - cancel button clicked");

        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                "WebInteraction",
                "CloseHelpDeskInteraction"
            );
            console.log("Sent CloseHelpDeskInteraction message to Unity");
        } else {
            console.warn("Unity instance not ready, closing modal locally");
            setIsOpen(false);
            setSelectedSignText(null);
            setSignTexts([]);
        }
    }, [isLoaded, unityInstance]);

    const confirmSelection = useCallback(() => {
        console.log("LibraryDesk: Confirming selection:", selectedSignText);
        
        if (!selectedSignText) {
            console.warn("No sign text selected!");
            return;
        }
        
        if (isLoaded && unityInstance) {
            // Send the selected sign text to Unity
            console.log(`Sending selected sign text to Unity: "${selectedSignText}"`);
            unityInstance.SendMessage(
                "WebInteraction",
                "ConfirmLibraryDeskSelection",
                selectedSignText
            );
            console.log("Selection sent successfully");
            
            // Then close the modal
            unityInstance.SendMessage(
                "WebInteraction",
                "CloseHelpDeskInteraction"
            );
            console.log("Close message sent");
        } else {
            console.error("Unity instance not ready!");
        }
        
        // Close the modal locally
        setIsOpen(false);
        setSelectedSignText(null);
        setSignTexts([]);
    }, [selectedSignText, isLoaded, unityInstance]);

    // Event listeners
    useEffect(() => {
        addEventListener("ReceiveHelpDeskInteraction", handleReceiveHelpDeskInteraction);
        return () => {
            removeEventListener("ReceiveHelpDeskInteraction", handleReceiveHelpDeskInteraction);
        };
    }, [addEventListener, removeEventListener, handleReceiveHelpDeskInteraction]);

    useEffect(() => {
        addEventListener("CloseHelpDeskModal", handleCloseHelpDeskModal);
        return () => {
            removeEventListener("CloseHelpDeskModal", handleCloseHelpDeskModal);
        };
    }, [addEventListener, removeEventListener, handleCloseHelpDeskModal]);

    // Window exposure
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).CloseHelpDeskModal = handleCloseHelpDeskModal;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).CloseHelpDeskModal;
            }
        };
    }, [handleCloseHelpDeskModal]);

    return {
        signTexts,
        selectedSignText,
        isOpen,
        onSelectSignText: setSelectedSignText,
        onClose: closeModal,
        onConfirm: confirmSelection
    };
};