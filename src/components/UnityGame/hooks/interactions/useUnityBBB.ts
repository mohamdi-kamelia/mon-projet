import { useCallback, useEffect, useRef, useState } from 'react';
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
  
  const lastRoomRef = useRef<string>("");
  const isProcessingRef = useRef<boolean>(false);

  const handleJoinRoom = useCallback((...parameters: any[]) => {
    const [room] = parameters as [string];
    
    if (isProcessingRef.current) {
      console.log("🚫 Event joinRoom ignored (already processing)");
      return;
    }
    
    if (lastRoomRef.current === room) {
      console.log("🚫 Event joinRoom ignored (same room):", room);
      return;
    }
    
    console.log("🎯 Unity requests to join BBB room:", room);
    
    isProcessingRef.current = true;
    lastRoomRef.current = room;
    
    setRoomName(room);
    onChangeJitsiRoom(room);
    
    // Réinitialiser le flag après un délai
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 500);
    
  }, [onChangeJitsiRoom]);

  const handleExitRoom = useCallback(() => {
    if (isProcessingRef.current) {
      console.log(" Event exitRoom ignored (already processing)");
      return;
    }
    
    console.log(" Unity requests to exit BBB room");
    
    isProcessingRef.current = true;
    lastRoomRef.current = "";
    
    setRoomName("");
    onChangeJitsiRoom("");
    
    // Réinitialiser le flag après un délai
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 500);
    
  }, [onChangeJitsiRoom]);

  useEffect(() => {
    addEventListener("UnityJoinRoom", handleJoinRoom);
    addEventListener("UnityExitRoom", handleExitRoom);
    
    return () => {
      removeEventListener("UnityJoinRoom", handleJoinRoom);
      removeEventListener("UnityExitRoom", handleExitRoom);
    };
  }, [addEventListener, removeEventListener, handleJoinRoom, handleExitRoom]);

  // Retourne roomName pour que le composant puisse l'utiliser
  return { roomName };
};

// Export aussi sous l'ancien nom pour compatibilité totale
export const useUnityJitsi = useUnityBBB;