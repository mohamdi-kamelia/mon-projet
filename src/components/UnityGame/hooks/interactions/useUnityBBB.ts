/**
 * Hook pour gérer la communication entre Unity et BigBlueButton
 * Compatible avec l'ancienne interface Jitsi
 */

import { useCallback, useEffect } from 'react';
import { UnityEventListeners } from '../types';

interface UseUnityBBBProps extends UnityEventListeners {
  onChangeJitsiRoom: (roomName: string) => void;
}

export const useUnityBBB = ({
  addEventListener,
  removeEventListener,
  onChangeJitsiRoom
}: UseUnityBBBProps) => {
  const handleJoinRoom = useCallback((...parameters: any[]) => {
    const [roomName] = parameters as [string];
    console.log("Unity requests to join BBB room:", roomName);
    onChangeJitsiRoom(roomName);
  }, [onChangeJitsiRoom]);

  const handleExitRoom = useCallback(() => {
    console.log("Unity requests to exit BBB room");
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

// Export aussi sous l'ancien nom pour compatibilité totale
export const useUnityJitsi = useUnityBBB;
