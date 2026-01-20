import { useCallback, useEffect } from 'react';

interface UseUnityJitsiProps {
    addEventListener: any;
    removeEventListener: any;
    onChangeJitsiRoom: (roomName: string) => void;
}

export const useUnityJitsi = ({
    addEventListener,
    removeEventListener,
    onChangeJitsiRoom
}: UseUnityJitsiProps) => {
    const handleJoinRoom = useCallback((...parameters: any[]) => {
        const [roomName] = parameters as [string];
        onChangeJitsiRoom(roomName);
    }, [onChangeJitsiRoom]);

    const handleExitRoom = useCallback(() => {a
        onChangeJitsiRoom("");
    }, [onChangeJitsiRoom]);

    useEffect(() => {
        addEventListener("UnityJoinRoom", handleJoinRoom);
        addEventListener("UnityExitRoom", handleExitRoom);
        return () => {
            removeEventListener("UnityJoinRoom", handleJoinRoom);
            removeEventListener("UnityExitRoom", handleExitRoom);
        };
    }, [addEventListener, removeEventListener, handleJoinRoom, handleExitRoom]);

    return {};
};