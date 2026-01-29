import { useState, useCallback, useEffect, useRef } from 'react';

export const useUnityFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    }, []);

    // Listen for fullscreen changes (e.g., when user presses ESC)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    return {
        isFullscreen,
        containerRef,
        toggle: toggleFullscreen
    };
};