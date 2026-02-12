import { useState, useCallback, useEffect } from 'react';

interface UseUnityProximityVocProp {
    addEventListener: any;
    removeEventListener: any;
    isLoaded: boolean;
    unityInstance: any;
    localPlayerID ?: string;
    targetPlayerID ?: string;
}

export const useUnityProximityVoc = ({
    addEventListener,
    removeEventListener,
    isLoaded,
    unityInstance,
    localPlayerID = "",
    targetPlayerID = "",
}: UseUnityProximityVocProp) => {
    const [localPlayer, setLocalPlayer] = useState<string>("");
    const [targetPlayer, setTargetPlayer] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(false);

    
    const handleJoinCall = useCallback((targetPlayerID: string) => {
        console.log("Join call received from Unity:", targetPlayerID);

        //TODO : send connect notif
    }, [targetPlayerID]);

    const handleLeaveCall = useCallback(() => {
        console.log("Leave call received from Unity");

        //TODO : send disconnect notif
    }, []);

    const handleCutCall = useCallback(() => {
        console.log("Show call received from React");

        //TODO : send disconnect to Unity
        //TODO : send disconnect notif
    }, []);

    // Debug effect
    useEffect(() => {
        console.log("WebRTC target changed to:", targetPlayerID);
        console.log("Is WebRTC active:", isActive);
    }, [targetPlayerID, isActive]);

    
    useEffect(() => {
        addEventListener('JoinWebRTC', handleJoinCall);
        addEventListener('LeaveWebRTC', handleLeaveCall);
        
        return () => {
            removeEventListener('JoinWebRTC', handleJoinCall);
            removeEventListener('LeaveWebRTC', handleLeaveCall);
        };
    }, [handleJoinCall, handleLeaveCall]);

    return {
        targetPlayerID,
        isActive
    };
};