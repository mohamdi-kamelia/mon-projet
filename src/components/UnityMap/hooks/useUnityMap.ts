import { useState, useCallback, useEffect } from 'react';
import { MAP_EVENTS, indexToSceneName, sceneNameToIndex } from '../constants/map.constants';
import { PlayerMapPosition, SceneName } from '../types/map.types';
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
    const [currentSceneName, setCurrentSceneName] = useState<SceneName | null>(null);

    // Handle cursor visibility when modal is open
    useModalCursor({ isOpen, isLoaded, unityInstance });

    // Open map
    const openMap = useCallback(() => {
        setIsOpen(true);
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
        if (isLoaded && unityInstance) {
            unityInstance.SendMessage(
                MAP_EVENTS.RECEIVER_OBJECT,
                MAP_EVENTS.STOP_SENDING_POS
            );
            console.log('[Map] Closed - requested Unity to stop sending position updates');
        }
    }, [isLoaded, unityInstance]);

    // Handle navigation click by INDEX
    const handleNavigate = useCallback((sceneIndex: number) => {
        if (isLoaded && unityInstance) {
            // Try to use scene name if available (preferred)
            const sceneName = indexToSceneName(sceneIndex);
            if (sceneName) {
                console.log('[Map] Navigation by name requested to scene:', sceneName);
                unityInstance.SendMessage(
                    MAP_EVENTS.RECEIVER_OBJECT,
                    MAP_EVENTS.NAVIGATE_BY_NAME_METHOD,
                    sceneName
                );
            } else {
                // Fallback to index
                console.log('[Map] Navigation by index requested to scene:', sceneIndex);
                unityInstance.SendMessage(
                    MAP_EVENTS.RECEIVER_OBJECT,
                    MAP_EVENTS.NAVIGATE_METHOD,
                    sceneIndex
                );
            }
        }
    }, [isLoaded, unityInstance]);

    // Handle navigation click by NAME (preferred)
    const handleNavigateByName = useCallback((sceneName: SceneName) => {
        if (isLoaded && unityInstance) {
            console.log('[Map] Navigation by name requested to scene:', sceneName);
            unityInstance.SendMessage(
                MAP_EVENTS.RECEIVER_OBJECT,
                MAP_EVENTS.NAVIGATE_BY_NAME_METHOD,
                sceneName
            );
        }
    }, [isLoaded, unityInstance]);

    // Handle position update from Unity
    const handleUpdatePosition = useCallback((...parameters: any[]) => {
        const [x, y] = parameters as [number, number];
        
        if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
            setPlayerPos({ x, y });
        } else {
            console.warn('[Map] Invalid position received:', parameters);
        }
    }, []);

    // Handle receiving scene INDEX from Unity
    const handleSetSceneIndex = useCallback((...parameters: any[]) => {
        const [index] = parameters as [number];
        console.log('[Map] Current Unity Scene Index:', index);
        setCurrentSceneIndex(index);
        
        // Also update scene name based on index
        const sceneName = indexToSceneName(index);
        if (sceneName) {
            setCurrentSceneName(sceneName);
        }
    }, []);

    // Handle receiving scene NAME from Unity (preferred)
    const handleSetSceneName = useCallback((...parameters: any[]) => {
        const [name] = parameters as [string];
        console.log('[Map] Current Unity Scene Name:', name);
        setCurrentSceneName(name as SceneName);
        
        // Also update scene index based on name
        const index = sceneNameToIndex(name as SceneName);
        if (index >= 0) {
            setCurrentSceneIndex(index);
        }
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
        addEventListener(MAP_EVENTS.SET_CURRENT_SCENE_NAME, handleSetSceneName);

        console.log('[Map] Event listeners registered:', {
            UPDATE_POSITION: MAP_EVENTS.UPDATE_POSITION,
            CLOSE_MODAL: MAP_EVENTS.CLOSE_MODAL,
            SET_CURRENT_SCENE: MAP_EVENTS.SET_CURRENT_SCENE,
            SET_CURRENT_SCENE_NAME: MAP_EVENTS.SET_CURRENT_SCENE_NAME,
        });

        return () => {
            removeEventListener(MAP_EVENTS.UPDATE_POSITION, handleUpdatePosition);
            removeEventListener(MAP_EVENTS.CLOSE_MODAL, handleCloseFromUnity);
            removeEventListener(MAP_EVENTS.SET_CURRENT_SCENE, handleSetSceneIndex);
            removeEventListener(MAP_EVENTS.SET_CURRENT_SCENE_NAME, handleSetSceneName);
        };
    }, [addEventListener, removeEventListener, handleUpdatePosition, handleCloseFromUnity, handleSetSceneIndex, handleSetSceneName]);

    return {
        // State
        isOpen,
        playerPos,
        currentSceneIndex,      
        currentSceneName,       
        
        // Actions
        openMap,
        closeMap,
        handleNavigate,         // Handle navigation by index
        handleNavigateByName,   // Handle navigation by name (preferred)
    };
};