import { useCallback, useEffect, useRef } from 'react';
import { EViewType } from '../UnitySettings/types/settings.types';

interface CameraRotationButtonsProps {
    isLoaded: boolean;
    unityInstance: any;
    viewType: EViewType;
}

/**
 * Camera rotation buttons for isometric view.
 * Displays left/right arrows on screen edges that rotate the camera while held.
 * Only visible when in isometric view mode.
 */
export function CameraRotationButtons({ 
    isLoaded, 
    unityInstance, 
    viewType 
}: CameraRotationButtonsProps) {
    // Track if we're currently rotating to handle edge cases
    const isRotatingLeftRef = useRef(false);
    const isRotatingRightRef = useRef(false);

    // Target GameObject for camera rotation commands
    // Uses WebInteraction receiver, same as other web UI components
    const RECEIVER_OBJECT = 'WebInteraction';

    // Send message to Unity
    const sendToUnity = useCallback((methodName: string) => {
        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(RECEIVER_OBJECT, methodName);
            console.log(`[CameraRotation] Sent ${methodName} to Unity`);
        } else {
            console.warn(`[CameraRotation] Unity not ready, cannot send ${methodName}`);
        }
    }, [isLoaded, unityInstance]);

    // Left rotation handlers
    const handleLeftPointerDown = useCallback(() => {
        if (!isRotatingLeftRef.current) {
            isRotatingLeftRef.current = true;
            sendToUnity('StartRotateLeft');
        }
    }, [sendToUnity]);

    const handleLeftPointerUp = useCallback(() => {
        if (isRotatingLeftRef.current) {
            isRotatingLeftRef.current = false;
            sendToUnity('StopRotateLeft');
        }
    }, [sendToUnity]);

    // Right rotation handlers
    const handleRightPointerDown = useCallback(() => {
        if (!isRotatingRightRef.current) {
            isRotatingRightRef.current = true;
            sendToUnity('StartRotateRight');
        }
    }, [sendToUnity]);

    const handleRightPointerUp = useCallback(() => {
        if (isRotatingRightRef.current) {
            isRotatingRightRef.current = false;
            sendToUnity('StopRotateRight');
        }
    }, [sendToUnity]);

    // Stop all rotation when component unmounts or view changes
    useEffect(() => {
        return () => {
            if (isRotatingLeftRef.current) {
                sendToUnity('StopRotateLeft');
                isRotatingLeftRef.current = false;
            }
            if (isRotatingRightRef.current) {
                sendToUnity('StopRotateRight');
                isRotatingRightRef.current = false;
            }
        };
    }, [sendToUnity]);

    // Stop rotation when view type changes away from isometric
    useEffect(() => {
        if (viewType !== EViewType.ISOMETRIC) {
            if (isRotatingLeftRef.current) {
                sendToUnity('StopRotateLeft');
                isRotatingLeftRef.current = false;
            }
            if (isRotatingRightRef.current) {
                sendToUnity('StopRotateRight');
                isRotatingRightRef.current = false;
            }
        }
    }, [viewType, sendToUnity]);

    // Only show in isometric view
    if (viewType !== EViewType.ISOMETRIC) {
        return null;
    }

    return (
        <>
            {/* Left Arrow Button */}
            <button
                onPointerDown={handleLeftPointerDown}
                onPointerUp={handleLeftPointerUp}
                onPointerLeave={handleLeftPointerUp}
                onPointerCancel={handleLeftPointerUp}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-gray-800/80 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors duration-150 shadow-lg group select-none touch-none"
                aria-label="Tourner la caméra à gauche"
                title="Tourner la caméra à gauche"
            >
                <svg
                    className="w-8 h-8 text-white/80 group-hover:text-white group-active:text-blue-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>

            {/* Right Arrow Button */}
            <button
                onPointerDown={handleRightPointerDown}
                onPointerUp={handleRightPointerUp}
                onPointerLeave={handleRightPointerUp}
                onPointerCancel={handleRightPointerUp}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-gray-800/80 hover:bg-gray-700 active:bg-gray-600 rounded-lg transition-colors duration-150 shadow-lg group select-none touch-none"
                aria-label="Tourner la caméra à droite"
                title="Tourner la caméra à droite"
            >
                <svg
                    className="w-8 h-8 text-white/80 group-hover:text-white group-active:text-blue-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>
        </>
    );
}