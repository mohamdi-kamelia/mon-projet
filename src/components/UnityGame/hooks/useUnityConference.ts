import { useState, useCallback, useEffect } from 'react';
import { useConferenceCursor } from './useConferenceCursor';

interface UseUnityConferenceProps {
    addEventListener: any;
    removeEventListener: any;
    isLoaded: boolean;
    unityInstance: any;
    webConferenceUrl?: string;
}

export const useUnityConference = ({
    addEventListener,
    removeEventListener,
    isLoaded,
    unityInstance,
    webConferenceUrl
}: UseUnityConferenceProps) => {
    const [conferenceUrl, setConferenceUrl] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Manage cursor visibility when conference enters/exits fullscreen
    useConferenceCursor({ isFullscreen, isLoaded, unityInstance });

    const handleJoinConference = useCallback((conferenceLink: string) => {
        console.log("Join Conference received from Unity:", conferenceLink);
        console.log("Web conference URL prop:", webConferenceUrl);

        // Check if webConferenceUrl is literally the string "conferenceUrl" (coding error)
        if (webConferenceUrl === "conferenceUrl") {
            console.error("ERROR: conferenceUrl prop is the literal string 'conferenceUrl'!");
            console.error("Falling back to Unity's URL:", conferenceLink);
            const urlToUse = conferenceLink;

            const isValidUrl = urlToUse &&
                urlToUse.trim() !== "" &&
                urlToUse !== "conferenceLink" &&
                (urlToUse.startsWith("http://") || urlToUse.startsWith("https://"));

            if (!isValidUrl) {
                console.error("ERROR: Unity URL is also invalid:", urlToUse);
                setIsActive(false);
                return;
            }

            console.log("✓ Using Unity's URL:", urlToUse);
            setConferenceUrl(urlToUse);
            setIsActive(true);
            setIsFullscreen(false);
            return;
        }

        // Use web-provided conference URL if available, otherwise use Unity's URL
        const urlToUse = (webConferenceUrl && webConferenceUrl.trim() !== "") 
            ? webConferenceUrl 
            : conferenceLink;
        console.log("URL to use (before validation):", urlToUse, 
            (webConferenceUrl && webConferenceUrl.trim() !== "") ? "(from web prop)" : "(from Unity)");

        // Validate the URL
        const isValidUrl = urlToUse &&
            urlToUse.trim() !== "" &&
            urlToUse !== "conferenceLink" &&
            (urlToUse.startsWith("http://") || urlToUse.startsWith("https://"));

        if (!isValidUrl) {
            console.error("ERROR: Invalid or missing conference URL!");
            console.error("  - Unity provided:", conferenceLink);
            console.error("  - Web provided:", webConferenceUrl);
            console.error("  - Final URL:", urlToUse);
            console.error("  - Iframe will NOT be shown");
            setIsActive(false);
            return;
        }

        console.log("✓ Valid conference URL:", urlToUse);
        setConferenceUrl(urlToUse);
        setIsActive(true);
        setIsFullscreen(false);
    }, [webConferenceUrl]);

    const handleLeaveConference = useCallback(() => {
        console.log("Leave Conference received from Unity");
        setIsActive(false);
        setIsFullscreen(false);
        setConferenceUrl("");
    }, []);

    const handleShowConference = useCallback(() => {
        console.log("Show Conference (fullscreen) received from Unity");
        setIsFullscreen(true);
    }, []);

    const handleHideConference = useCallback(() => {
        console.log("Hide Conference (mini mode) received from Unity");
        setIsFullscreen(false);
    }, []);

    const handleCloseConferenceFullscreen = useCallback(() => {
        console.log("Close button pressed - telling Unity to stand up");

        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                "WebInteraction",
                "StandUpPlayer"
            );
        }
    }, [isLoaded, unityInstance]);

    // Debug effect
    useEffect(() => {
        console.log("Conference URL state changed to:", conferenceUrl);
        console.log("Is conference active:", isActive);
        console.log("Is conference fullscreen:", isFullscreen);
        console.log("Should render iframe:", isActive && conferenceUrl && conferenceUrl.trim() !== "");
    }, [conferenceUrl, isActive, isFullscreen]);

    // Window exposure
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).JoinConference = handleJoinConference;
            (window as any).LeaveConference = handleLeaveConference;
            (window as any).ShowConference = handleShowConference;
            (window as any).HideConference = handleHideConference;
        }

        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).JoinConference;
                delete (window as any).LeaveConference;
                delete (window as any).ShowConference;
                delete (window as any).HideConference;
            }
        };
    }, [handleJoinConference, handleLeaveConference, handleShowConference, handleHideConference]);

    return {
        conferenceUrl,
        isActive,
        isFullscreen,
        onClose: handleCloseConferenceFullscreen
    };
};