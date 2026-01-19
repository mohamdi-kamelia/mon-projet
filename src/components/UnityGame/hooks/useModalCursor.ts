import { useEffect, useRef } from 'react';

interface UseModalCursorProps {
    isOpen: boolean;
    isLoaded: boolean;
    unityInstance: any;
}

/**
 * Hook to manage cursor visibility when modals open/close in third-person view.
 * Automatically shows cursor when modal opens, hides it when modal closes.
 * Also ensures Unity canvas regains focus when modal closes for immediate input response.
 */
export const useModalCursor = ({
    isOpen,
    isLoaded,
    unityInstance
}: UseModalCursorProps) => {
    // Track previous isOpen state to detect close events
    const prevIsOpenRef = useRef(isOpen);

    useEffect(() => {
        if (!isLoaded || !unityInstance) {
            return;
        }

        const wasOpen = prevIsOpenRef.current;
        const isNowClosed = wasOpen && !isOpen;

        if (isOpen && !wasOpen) {
            // Modal just opened - request cursor show from Unity
            console.log("Modal opened - requesting cursor show from Unity");
            unityInstance.SendMessage(
                "CursorManager",
                "ShowModalCursor"
            );
        } else if (isNowClosed) {
            // Modal just closed - hide cursor and return focus to Unity canvas
            console.log("Modal closed - requesting cursor hide from Unity");
            unityInstance.SendMessage(
                "CursorManager",
                "HideModalCursor"
            );

            // CRITICAL: Return focus to Unity canvas for immediate input response
            // Without this, user must click on canvas before input works
            setTimeout(() => {
                try {
                    const unityCanvas = document.querySelector('#unity-canvas') as HTMLCanvasElement;
                    if (unityCanvas) {
                        unityCanvas.focus();
                        console.log("Focus returned to Unity canvas");
                    } else {
                        console.warn("Unity canvas not found - trying alternative selector");
                        // Try alternative selector
                        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
                        if (canvas) {
                            canvas.focus();
                            console.log("Focus returned to canvas (alternative selector)");
                        }
                    }
                } catch (error) {
                    console.error("Failed to return focus to Unity canvas:", error);
                }
            }, 100); // Small delay to ensure modal is fully closed
        }

        // Update previous state
        prevIsOpenRef.current = isOpen;
    }, [isOpen, isLoaded, unityInstance]);
};