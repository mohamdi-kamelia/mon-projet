import { useCallback, useEffect } from 'react';

interface UseUnityBBBProps {
    addEventListener: any;
    removeEventListener: any;
    onChangeJitsiRoom: (roomName: string) => void; 
}

/**
 * Hook pour gérer la communication entre Unity et BBB
 * Remplace useUnityJitsi - Garde la même interface pour compatibilité
 */
export const useUnityBBB = ({
    addEventListener,
    removeEventListener,
    onChangeJitsiRoom // Même nom que Jitsi pour compatibilité
}: UseUnityBBBProps) => {
    const handleJoinRoom = useCallback((...parameters: any[]) => {
        const [roomName] = parameters as [string];
        console.log("Unity demande de rejoindre la salle BBB:", roomName);
        onChangeJitsiRoom(roomName);
    }, [onChangeJitsiRoom]);

    const handleExitRoom = useCallback(() => {
        console.log("Unity demande de quitter la salle BBB");
        onChangeJitsiRoom("");
    }, [onChangeJitsiRoom]);

    useEffect(() => {
        // on Garde les mêmes noms d'événements Unity pour compatibilité
        addEventListener("UnityJoinRoom", handleJoinRoom);
        addEventListener("UnityExitRoom", handleExitRoom);
        
        return () => {
            removeEventListener("UnityJoinRoom", handleJoinRoom);
            removeEventListener("UnityExitRoom", handleExitRoom);
        };
    }, [addEventListener, removeEventListener, handleJoinRoom, handleExitRoom]);

    return {};
};

// Export aussi sous l'ancien nom pour compatibilité totale
export const useUnityJitsi = useUnityBBB;