import { useState, useCallback, useEffect } from 'react';
import { useModalCursor } from './useModalCursor';

interface UseUnityTVProps {
    addEventListener: any;
    removeEventListener: any;
    isLoaded: boolean;
    unityInstance: any;
}

export const useUnityTV = ({
    addEventListener,
    removeEventListener,
    isLoaded,
    unityInstance
}: UseUnityTVProps) => {
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Manage cursor visibility when modal opens/closes
    useModalCursor({ isOpen, isLoaded, unityInstance });

    const handleCloseTVModal = useCallback(() => {
        console.log("Close TV Modal signal received from Unity");
        setIsOpen(false);
        setVideoUrl("");
    }, []);

    const handleReceiveTVInteraction = useCallback((...parameters: any[]) => {
        let [url] = parameters as [string];

        if (url.includes("watch?v=")) {
            const videoId = url.split("watch?v=")[1].split("&")[0];
            url = `https://www.youtube.com/embed/${videoId}`;
        }

        console.log("TV Interaction received from Unity with embed URL:", url);

        if (url) {
            setVideoUrl(url);
            setIsOpen(true);
        } else {
            console.warn("Received TV interaction with an empty video URL.");
        }
    }, []);

    const closeTVModal = useCallback(() => {
        console.log("Close TV modal button clicked - telling Unity to close TV interaction");

        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                "WebInteraction",
                "CloseTVInteraction"
            );
            console.log("Sent CloseTVInteraction message to Unity.");
        } else {
            console.warn("Unity instance not ready, cannot send CloseTVInteraction message.");
            setIsOpen(false);
            setVideoUrl("");
        }
    }, [isLoaded, unityInstance]);

    // Event listeners
    useEffect(() => {
        addEventListener("ReceiveTVInteraction", handleReceiveTVInteraction);
        return () => {
            removeEventListener("ReceiveTVInteraction", handleReceiveTVInteraction);
        };
    }, [addEventListener, removeEventListener, handleReceiveTVInteraction]);

    useEffect(() => {
        addEventListener("CloseTVModal", handleCloseTVModal);
        return () => {
            removeEventListener("CloseTVModal", handleCloseTVModal);
        };
    }, [addEventListener, removeEventListener, handleCloseTVModal]);

    // Window exposure
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).CloseTVModal = handleCloseTVModal;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).CloseTVModal;
            }
        };
    }, [handleCloseTVModal]);

    return {
        videoUrl,
        isOpen,
        onClose: closeTVModal
    };
};