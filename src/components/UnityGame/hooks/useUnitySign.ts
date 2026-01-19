import { useState, useCallback, useEffect } from 'react';
import { useModalCursor } from './useModalCursor';

interface UseUnitySignProps {
    addEventListener: any;
    removeEventListener: any;
    isLoaded: boolean;
    unityInstance: any;
}

export const useUnitySign = ({
    addEventListener,
    removeEventListener,
    isLoaded,
    unityInstance
}: UseUnitySignProps) => {
    const [signText, setSignText] = useState<string>("");
    const [signFilter, setSignFilter] = useState<string>("");
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Manage cursor visibility when modal opens/closes
    useModalCursor({ isOpen, isLoaded, unityInstance });

    const handleReceiveSignInteraction = useCallback((...parameters: any[]) => {
        const [text, filter] = parameters as [string, string];

        console.log("Sign Interaction received from Unity:");
        console.log("  Text:", text);
        console.log("  Filter:", filter);

        if (text) {
            setSignText(text);
            setSignFilter(filter || "No filter set");
            setIsOpen(true);
        } else {
            console.warn("Received Sign interaction with empty text.");
        }
    }, []);

    const handleCloseSignModal = useCallback(() => {
        console.log("Close Sign Modal signal received from Unity");
        setIsOpen(false);
        setSignText("");
        setSignFilter("");
    }, []);

    const closeSignModal = useCallback(() => {
        console.log("Close Sign modal button clicked - telling Unity to close Sign interaction");

        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                "WebInteraction",
                "CloseSignInteraction"
            );
            console.log("Sent CloseSignInteraction message to Unity.");
        } else {
            console.warn("Unity instance not ready, cannot send CloseSignInteraction message.");
            setIsOpen(false);
            setSignText("");
            setSignFilter("");
        }
    }, [isLoaded, unityInstance]);

    // Event listeners
    useEffect(() => {
        addEventListener("ReceiveSignInteraction", handleReceiveSignInteraction);
        return () => {
            removeEventListener("ReceiveSignInteraction", handleReceiveSignInteraction);
        };
    }, [addEventListener, removeEventListener, handleReceiveSignInteraction]);

    useEffect(() => {
        addEventListener("CloseSignModal", handleCloseSignModal);
        return () => {
            removeEventListener("CloseSignModal", handleCloseSignModal);
        };
    }, [addEventListener, removeEventListener, handleCloseSignModal]);

    // Window exposure
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).CloseSignModal = handleCloseSignModal;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).CloseSignModal;
            }
        };
    }, [handleCloseSignModal]);

    return {
        signText,
        signFilter,
        isOpen,
        onClose: closeSignModal
    };
};