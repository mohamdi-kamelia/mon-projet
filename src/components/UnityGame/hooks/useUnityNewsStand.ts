import { useState, useCallback, useEffect } from 'react';
import { useModalCursor } from './useModalCursor';

interface UseUnityNewsStandProps {
    addEventListener: any;
    removeEventListener: any;
    isLoaded: boolean;
    unityInstance: any;
}

export const useUnityNewsStand = ({
    addEventListener,
    removeEventListener,
    isLoaded,
    unityInstance
}: UseUnityNewsStandProps) => {
    const [xmlContent, setXmlContent] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Manage cursor visibility when modal opens/closes
    useModalCursor({ isOpen, isLoaded, unityInstance });

    const handleReceiveNewsStandInteraction = useCallback((...parameters: any[]) => {
        const [content] = parameters as [string];

        console.log("NewsStand Interaction received from Unity:");
        console.log("  XML Content Length:", content?.length || 0, "characters");

        if (content && content.length > 0) {
            setXmlContent(content);
            setErrorMessage(""); // Clear any previous errors
            setIsOpen(true);
        } else {
            console.warn("Received NewsStand interaction with empty XML content.");
            setErrorMessage("Aucun contenu reçu du serveur.");
            setXmlContent("");
            setIsOpen(true); // Still open to show error
        }
    }, []);

    const handleReceiveNewsStandInteractionError = useCallback((...parameters: any[]) => {
        const [error] = parameters as [string];

        console.log("NewsStand Error received from Unity:");
        console.log("  Error Message:", error);

        setErrorMessage(error || "Une erreur s'est produite lors du chargement des actualités.");
        setXmlContent("");
        setIsOpen(true); // Open modal to show error
    }, []);

    const handleCloseNewsStandModal = useCallback(() => {
        console.log("Close NewsStand Modal signal received from Unity");
        setIsOpen(false);
        setXmlContent("");
        setErrorMessage("");
    }, []);

    const closeNewsStandModal = useCallback(() => {
        console.log("Close NewsStand modal button clicked - telling Unity to close NewsStand interaction");

        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                "WebInteraction",
                "CloseNewsStandInteraction"
            );
            console.log("Sent CloseNewsStandInteraction message to Unity.");
        } else {
            console.warn("Unity instance not ready, cannot send CloseNewsStandInteraction message.");
            setIsOpen(false);
            setXmlContent("");
            setErrorMessage("");
        }
    }, [isLoaded, unityInstance]);

    // Event listeners
    useEffect(() => {
        addEventListener("ReceiveNewsStandInteraction", handleReceiveNewsStandInteraction);
        return () => {
            removeEventListener("ReceiveNewsStandInteraction", handleReceiveNewsStandInteraction);
        };
    }, [addEventListener, removeEventListener, handleReceiveNewsStandInteraction]);

    useEffect(() => {
        addEventListener("ReceiveNewsStandInteractionError", handleReceiveNewsStandInteractionError);
        return () => {
            removeEventListener("ReceiveNewsStandInteractionError", handleReceiveNewsStandInteractionError);
        };
    }, [addEventListener, removeEventListener, handleReceiveNewsStandInteractionError]);

    useEffect(() => {
        addEventListener("CloseNewsStandModal", handleCloseNewsStandModal);
        return () => {
            removeEventListener("CloseNewsStandModal", handleCloseNewsStandModal);
        };
    }, [addEventListener, removeEventListener, handleCloseNewsStandModal]);

    // Window exposure
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).CloseNewsStandModal = handleCloseNewsStandModal;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).CloseNewsStandModal;
            }
        };
    }, [handleCloseNewsStandModal]);

    return {
        xmlContent,
        errorMessage,
        isOpen,
        onClose: closeNewsStandModal
    };
};