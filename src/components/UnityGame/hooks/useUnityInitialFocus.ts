import { useEffect } from 'react';

interface UseUnityInitialFocusProps {
    isLoaded: boolean;
}

/**
 * Hook to automatically focus the Unity canvas when it first loads.
 * This ensures users can immediately use keyboard input without clicking the page first.
 * Only runs once when Unity finishes loading.
 */
export const useUnityInitialFocus = ({ isLoaded }: UseUnityInitialFocusProps) => {
    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        // Unity just finished loading - give focus to the canvas
        // Small delay to ensure canvas is fully ready
        const focusTimer = setTimeout(() => {
            try {
                const unityCanvas = document.querySelector('#unity-canvas') as HTMLCanvasElement;
                if (unityCanvas) {
                    unityCanvas.focus();
                    console.log("Initial focus set to Unity canvas on load");
                } else {
                    console.warn("Unity canvas not found on initial load - trying alternative selector");
                    // Fallback: find any canvas element
                    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
                    if (canvas) {
                        canvas.focus();
                        console.log("Initial focus set to canvas (alternative selector)");
                    } else {
                        console.error("No canvas found for initial focus");
                    }
                }
            } catch (error) {
                console.error("Failed to set initial focus to Unity canvas:", error);
            }
        }, 200); // 200ms delay to ensure Unity canvas is fully mounted and ready

        return () => clearTimeout(focusTimer);
    }, [isLoaded]); // Only run when isLoaded changes from false to true
};