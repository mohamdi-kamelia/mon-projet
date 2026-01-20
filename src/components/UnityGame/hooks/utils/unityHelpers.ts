/**
 * Utilitaires pour la gestion de Unity
 */

import {type  UnityInstance } from '../types';

/**
 * Envoie un message à Unity de manière sécurisée
 */
export const sendUnityMessage = (
  unityInstance: UnityInstance | null,
  objectName: string,
  methodName: string,
  value?: any
): boolean => {
  if (!unityInstance) {
    console.warn(`Cannot send message to Unity: instance not ready. Target: ${objectName}.${methodName}`);
    return false;
  }

  try {
    unityInstance.SendMessage(objectName, methodName, value);
    console.log(`✓ Sent message to Unity: ${objectName}.${methodName}`, value !== undefined ? `(${value})` : '');
    return true;
  } catch (error) {
    console.error(`Failed to send message to Unity: ${objectName}.${methodName}`, error);
    return false;
  }
};

/**
 * Focus le canvas Unity
 */
export const focusUnityCanvas = (delay: number = 100): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        // Try primary selector
        const unityCanvas = document.querySelector('#unity-canvas') as HTMLCanvasElement;
        if (unityCanvas) {
          unityCanvas.focus();
          console.log("✓ Focus returned to Unity canvas");
          resolve(true);
          return;
        }

        // Fallback to any canvas
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (canvas) {
          canvas.focus();
          console.log("✓ Focus returned to canvas (fallback)");
          resolve(true);
          return;
        }

        console.warn("⚠ No Unity canvas found for focus");
        resolve(false);
      } catch (error) {
        console.error("Failed to focus Unity canvas:", error);
        resolve(false);
      }
    }, delay);
  });
};

/**
 * Valide une URL
 */
export const isValidUrl = (url: string | undefined): boolean => {
  if (!url || url.trim() === '') return false;
  if (url === 'conferenceLink' || url === 'conferenceUrl') return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Convertit une URL YouTube en format embed
 */
export const convertToYouTubeEmbed = (url: string): string => {
  if (url.includes("watch?v=")) {
    const videoId = url.split("watch?v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
};

/**
 * Parse un JSON de manière sécurisée
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return fallback;
  }
};

/**
 * Expose une fonction sur window de manière sécurisée
 */
export const exposeToWindow = <T extends (...args: any[]) => string>(
    name: string,
    func: T
  ): (() => void) => {
  if (typeof window !== 'undefined') {
    (window as any)[name] = func;
  }
  
  return () => {
    if (typeof window !== 'undefined') {
      delete (window as any)[name];
    }
  };
};
