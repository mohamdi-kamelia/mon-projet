import { useState, useCallback, useEffect } from 'react';
import { MAP_EVENTS } from '../constants/map.constants';
import { PlayerMapPosition } from '../types/map.types';
import { useModalCursor } from '../../UnityGame/hooks/useModalCursor';

interface UseUnityMapProps {
    addEventListener: (event: string, callback: (...args: any[]) => void) => void;
    removeEventListener: (event: string, callback: (...args: any[]) => void) => void;
    isLoaded: boolean;
    unityInstance: any;
}

export const useUnityMap = ({
    addEventListener,
    removeEventListener,
    isLoaded,
    unityInstance
}: UseUnityMapProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [playerPos, setPlayerPos] = useState<PlayerMapPosition>({ x: 0.5, y: 0.5 });
    const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(-1);

    // Handle cursor visibility when modal is open
    useModalCursor({ isOpen, isLoaded, unityInstance });

    // Open map
    const openMap = useCallback(() => {
        setIsOpen(true);
        // Tell Unity to start sending position updates
        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                MAP_EVENTS.RECEIVER_OBJECT,
                MAP_EVENTS.START_SENDING_POS
            );
            console.log('[Map] Opened - requested Unity to start sending position updates');
        }
    }, [isLoaded, unityInstance]);

    // Close map
    const closeMap = useCallback(() => {
        setIsOpen(false);
        // Tell Unity to stop sending position updates
        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                MAP_EVENTS.RECEIVER_OBJECT,
                MAP_EVENTS.STOP_SENDING_POS
            );
            console.log('[Map] Closed - requested Unity to stop sending position updates');
        }
    }, [isLoaded, unityInstance]);

    // Handle navigation click
    const handleNavigate = useCallback((sceneIndex: number) => {
        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                MAP_EVENTS.RECEIVER_OBJECT,
                MAP_EVENTS.NAVIGATE_METHOD,
                sceneIndex
            );
            console.log('[Map] Navigation requested to scene:', sceneIndex);
        }
    }, [isLoaded, unityInstance]);

    // Handle position update from Unity
    // IMPORTANT: react-unity-webgl passes event parameters as spread args
    const handleUpdatePosition = useCallback((...parameters: any[]) => {
        const [x, y] = parameters as [number, number];
        
        // Validate the received values
        if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
            setPlayerPos({ x, y });
            // Uncomment for debugging:
            // console.log('[Map] Position update received:', { x, y });
        } else {
            console.warn('[Map] Invalid position received:', parameters);
        }
    }, []);

    // Handle receiving scene index from Unity
    const handleSetSceneIndex = useCallback((...parameters: any[]) => {
        const [index] = parameters as [number];
        console.log('[Map] Current Unity Scene Index:', index);
        setCurrentSceneIndex(index);
    }, []);

    // Handle close request from Unity
    const handleCloseFromUnity = useCallback(() => {
        console.log('[Map] Close requested from Unity');
        setIsOpen(false);
    }, []);

    useEffect(() => {
        addEventListener(MAP_EVENTS.UPDATE_POSITION, handleUpdatePosition);
        addEventListener(MAP_EVENTS.CLOSE_MODAL, handleCloseFromUnity);
        addEventListener(MAP_EVENTS.SET_CURRENT_SCENE, handleSetSceneIndex);

        console.log('[Map] Event listeners registered:', {
            UPDATE_POSITION: MAP_EVENTS.UPDATE_POSITION,
            CLOSE_MODAL: MAP_EVENTS.CLOSE_MODAL,
            SET_CURRENT_SCENE: MAP_EVENTS.SET_CURRENT_SCENE
        });

        return () => {
            removeEventListener(MAP_EVENTS.UPDATE_POSITION, handleUpdatePosition);
            removeEventListener(MAP_EVENTS.CLOSE_MODAL, handleCloseFromUnity);
            removeEventListener(MAP_EVENTS.SET_CURRENT_SCENE, handleSetSceneIndex);
        };
    }, [addEventListener, removeEventListener, handleUpdatePosition, handleCloseFromUnity, handleSetSceneIndex]);

    return {
        isOpen,
        playerPos,
        currentSceneIndex,
        openMap,
        closeMap,
        handleNavigate
    };
};