import { useEffect, useRef } from 'react';

interface UseConferenceCursorProps {
    isFullscreen: boolean;
    isLoaded: boolean;
    unityInstance: any;
}

/**
 * Hook to manage cursor visibility when conference enters/exits fullscreen mode.
 * Shows cursor when conference goes fullscreen (user sits down to watch).
 * Hides cursor when conference exits fullscreen (user stands up).
 * Also ensures Unity canvas regains focus when exiting fullscreen.
 */
export const useConferenceCursor = ({
    isFullscreen,
    isLoaded,
    unityInstance
}: UseConferenceCursorProps) => {
    // Track previous fullscreen state to detect transitions
    const prevIsFullscreenRef = useRef(isFullscreen);

    useEffect(() => {
        if (!isLoaded || !unityInstance) {
            return;
        }

        const wasFullscreen = prevIsFullscreenRef.current;
        const nowExitedFullscreen = wasFullscreen && !isFullscreen;

        if (isFullscreen && !wasFullscreen) {
            // Conference entered fullscreen - show cursor for interaction
            console.log("Conference fullscreen - requesting cursor show from Unity");
            unityInstance.SendMessage(
                "CursorManager",
                "ShowModalCursor"
            );
        } else if (nowExitedFullscreen) {
            // Conference exited fullscreen - hide cursor and return focus to Unity
            console.log("Conference exited fullscreen - requesting cursor hide from Unity");
            unityInstance.SendMessage(
                "CursorManager",
                "HideModalCursor"
            );

            // CRITICAL: Return focus to Unity canvas for immediate input response
            setTimeout(() => {
                try {
                    const unityCanvas = document.querySelector('#unity-canvas') as HTMLCanvasElement;
                    if (unityCanvas) {
                        unityCanvas.focus();
                        console.log("Focus returned to Unity canvas after conference");
                    } else {
                        console.warn("Unity canvas not found - trying alternative selector");
                        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
                        if (canvas) {
                            canvas.focus();
                            console.log("Focus returned to canvas (alternative selector)");
                        }
                    }
                } catch (error) {
                    console.error("Failed to return focus to Unity canvas:", error);
                }
            }, 100);
        }

        // Update previous state
        prevIsFullscreenRef.current = isFullscreen;
    }, [isFullscreen, isLoaded, unityInstance]);
};