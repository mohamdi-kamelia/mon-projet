import { useCallback, useEffect, useState } from 'react';
import type { UnityEventListeners } from '../types';

interface UseUnityBBBProps extends UnityEventListeners {
  onChangeJitsiRoom: (roomName: string) => void;
}

export const useUnityBBB = ({
  addEventListener,
  removeEventListener,
  onChangeJitsiRoom
}: UseUnityBBBProps) => {
  const [roomName, setRoomName] = useState<string>("");

  const handleJoinRoom = useCallback((...parameters: any[]) => {
    const [room] = parameters as [string];
    console.log("🎯 Unity requests to join BBB room:", room);
    
    setRoomName(room);
    onChangeJitsiRoom(room);
  }, [onChangeJitsiRoom]);

  const handleExitRoom = useCallback(() => {
    console.log("🚪 Unity requests to exit BBB room");
    
    setRoomName("");
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

  //  Retourne roomName pour que le composant puisse l'utiliser
  return { roomName };
};

// Export aussi sous l'ancien nom pour compatibilité totale
export const useUnityJitsi = useUnityBBB;