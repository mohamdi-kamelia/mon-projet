import { useState, useCallback, useEffect, useRef } from 'react';
import { useModalCursor } from '../../UnityGame/hooks/useModalCursor';

import {
    SettingsState,
    EViewType,
    EMapMovementType,
    ControlSchemeName,
    SettingsTab,
    UseUnitySettingsReturn
} from '../types/settings.types';
import {
    DEFAULT_SETTINGS,
    SETTINGS_EVENTS,
    isSchemeAvailable
} from '../constants/settings.constants';

/**
 * Props for the useUnitySettings hook
 */
export interface UseUnitySettingsProps {
    addEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
    removeEventListener: (eventName: string, callback: (...args: any[]) => void) => void;
    isLoaded: boolean;
    unityInstance: any;
}

/**
 * Hook for managing Unity settings communication
 * Handles bidirectional sync between React UI and Unity's SO_SettingsData
 */
export const useUnitySettings = ({
    addEventListener,
    removeEventListener,
    isLoaded,
    unityInstance
}: UseUnitySettingsProps): UseUnitySettingsReturn => {
    // State
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [isLoading, setIsLoading] = useState(true);

    // Ref to track if we're mounted
    const isMountedRef = useRef(true);

    // Handle cursor visibility and focus when modal opens/closes
    useModalCursor({ isOpen, isLoaded, unityInstance });

    // Helper to send messages to Unity
    const sendToUnity = useCallback((methodName: string, parameter?: string) => {
        if (isLoaded && unityInstance) {
            if (parameter !== undefined) {
                unityInstance.SendMessage(SETTINGS_EVENTS.RECEIVER_OBJECT, methodName, parameter);
            } else {
                unityInstance.SendMessage(SETTINGS_EVENTS.RECEIVER_OBJECT, methodName);
            }
            console.log(`[Settings] Sent ${methodName} to Unity`, parameter ? `with: ${parameter}` : '');
        } else {
            console.warn(`[Settings] Unity not ready, cannot send ${methodName}`);
        }
    }, [isLoaded, unityInstance]);

    // ========== Receive handlers (Unity → Web) ==========

    /**
     * Handle full settings sync from Unity
     */
    const handleReceiveSettings = useCallback((settingsJson: string) => {
        console.log('[Settings] Received settings from Unity:', settingsJson);
        try {
            const parsed = JSON.parse(settingsJson) as SettingsState;
            if (isMountedRef.current) {
                setSettings(parsed);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('[Settings] Failed to parse settings JSON:', error);
        }
    }, []);

    /**
     * Handle individual setting change from Unity
     */
    const handleSettingChanged = useCallback((settingName: string, value: string) => {
        console.log(`[Settings] Setting changed from Unity: ${settingName} = ${value}`);
        
        if (!isMountedRef.current) return;

        setSettings(prev => {
            const updated = { ...prev };
            
            switch (settingName) {
                case 'viewType':
                    updated.viewType = parseInt(value) as EViewType;
                    break;
                case 'mapMovementType':
                    updated.mapMovementType = parseInt(value) as EMapMovementType;
                    break;
                case 'isometricZoomSensitivity':
                    updated.isometricZoomSensitivity = parseFloat(value);
                    break;
                case 'thirdPersonRotationSensitivity':
                    updated.thirdPersonRotationSensitivity = parseFloat(value);
                    break;
                case 'effectVolume':
                    updated.effectVolume = parseFloat(value);
                    break;
                case 'musicVolume':
                    updated.musicVolume = parseFloat(value);
                    break;
                case 'masterVolume':
                    updated.masterVolume = parseFloat(value);
                    break;
            }
            
            return updated;
        });
    }, []);

    /**
     * Handle control scheme toggle from Unity
     */
    const handleSchemeChanged = useCallback((schemeName: string, isActiveStr: string) => {
        console.log(`[Settings] Scheme changed from Unity: ${schemeName} = ${isActiveStr}`);
        
        if (!isMountedRef.current) return;

        const isActive = isActiveStr === 'true' || isActiveStr === 'True';
        
        setSettings(prev => {
            const schemes = new Set(prev.activeSchemes);
            if (isActive) {
                schemes.add(schemeName as ControlSchemeName);
            } else {
                schemes.delete(schemeName as ControlSchemeName);
            }
            return {
                ...prev,
                activeSchemes: Array.from(schemes) as ControlSchemeName[]
            };
        });
    }, []);

    /**
     * Handle modal open request from Unity
     */
    const handleOpenModal = useCallback(() => {
        console.log('[Settings] Open modal request from Unity');
        if (isMountedRef.current) {
            setIsOpen(true);
        }
    }, []);

    /**
     * Handle modal close request from Unity
     */
    const handleCloseModal = useCallback(() => {
        console.log('[Settings] Close modal request from Unity');
        if (isMountedRef.current) {
            setIsOpen(false);
        }
    }, []);

    // ========== Send handlers (Web → Unity) ==========

    const openModal = useCallback(() => {
        setIsOpen(true);
        sendToUnity(SETTINGS_EVENTS.methods.ON_MODAL_OPENED);
    }, [sendToUnity]);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        sendToUnity(SETTINGS_EVENTS.methods.ON_MODAL_CLOSED);
    }, [sendToUnity]);

    const setViewType = useCallback((value: EViewType) => {
        setSettings(prev => ({ ...prev, viewType: value }));
        sendToUnity(SETTINGS_EVENTS.methods.SET_VIEW_TYPE, value.toString());
    }, [sendToUnity]);

    const setZoomSensitivity = useCallback((value: number) => {
        setSettings(prev => ({ ...prev, isometricZoomSensitivity: value }));
        sendToUnity(SETTINGS_EVENTS.methods.SET_ZOOM_SENSITIVITY, value.toString());
    }, [sendToUnity]);

    const setCameraSensitivity = useCallback((value: number) => {
        setSettings(prev => ({ ...prev, thirdPersonRotationSensitivity: value }));
        sendToUnity(SETTINGS_EVENTS.methods.SET_CAMERA_SENSITIVITY, value.toString());
    }, [sendToUnity]);

    const setMapMovementType = useCallback((value: EMapMovementType) => {
        setSettings(prev => ({ ...prev, mapMovementType: value }));
        sendToUnity(SETTINGS_EVENTS.methods.SET_MAP_MOVEMENT, value.toString());
    }, [sendToUnity]);

    const setEffectVolume = useCallback((value: number) => {
        setSettings(prev => ({ ...prev, effectVolume: value }));
        sendToUnity(SETTINGS_EVENTS.methods.SET_EFFECT_VOLUME, value.toString());
    }, [sendToUnity]);

    const setMusicVolume = useCallback((value: number) => {
        setSettings(prev => ({ ...prev, musicVolume: value }));
        sendToUnity(SETTINGS_EVENTS.methods.SET_MUSIC_VOLUME, value.toString());
    }, [sendToUnity]);

    const setMasterVolume = useCallback((value: number) => {
        setSettings(prev => ({ ...prev, masterVolume: value }));
        sendToUnity(SETTINGS_EVENTS.methods.SET_MASTER_VOLUME, value.toString());
    }, [sendToUnity]);

    const toggleControlScheme = useCallback((schemeName: ControlSchemeName) => {
        setSettings(prev => {
            const schemes = new Set(prev.activeSchemes);
            if (schemes.has(schemeName)) {
                schemes.delete(schemeName);
            } else {
                schemes.add(schemeName);
            }
            return {
                ...prev,
                activeSchemes: Array.from(schemes) as ControlSchemeName[]
            };
        });
        sendToUnity(SETTINGS_EVENTS.methods.TOGGLE_SCHEME, schemeName);
    }, [sendToUnity]);

    const setControlScheme = useCallback((schemeName: ControlSchemeName, isActive: boolean) => {
        setSettings(prev => {
            const schemes = new Set(prev.activeSchemes);
            if (isActive) {
                schemes.add(schemeName);
            } else {
                schemes.delete(schemeName);
            }
            return {
                ...prev,
                activeSchemes: Array.from(schemes) as ControlSchemeName[]
            };
        });
        sendToUnity(SETTINGS_EVENTS.methods.SET_SCHEME, `${schemeName}:${isActive}`);
    }, [sendToUnity]);

    const enterAvatarCustomization = useCallback(() => {
        const sceneName = "SelectionSkinUMA"; 
        
        // Send the method name AND the scene name as a parameter
        sendToUnity(SETTINGS_EVENTS.methods.ENTER_AVATAR_CUSTOMIZATION, sceneName);
    }, [sendToUnity]);

    // ========== Helper functions ==========

    const isSchemeActive = useCallback((schemeName: ControlSchemeName): boolean => {
        return settings.activeSchemes.includes(schemeName);
    }, [settings.activeSchemes]);

    const checkSchemeAvailable = useCallback((schemeName: ControlSchemeName): boolean => {
        return isSchemeAvailable(schemeName, settings.viewType, settings.deviceType);
    }, [settings.viewType, settings.deviceType]);

    // ========== Effects ==========

    // Subscribe to Unity events
    useEffect(() => {
        addEventListener(SETTINGS_EVENTS.RECEIVE_SETTINGS, handleReceiveSettings);
        addEventListener(SETTINGS_EVENTS.SETTING_CHANGED, handleSettingChanged);
        addEventListener(SETTINGS_EVENTS.SCHEME_CHANGED, handleSchemeChanged);
        addEventListener(SETTINGS_EVENTS.OPEN_MODAL, handleOpenModal);
        addEventListener(SETTINGS_EVENTS.CLOSE_MODAL, handleCloseModal);

        return () => {
            removeEventListener(SETTINGS_EVENTS.RECEIVE_SETTINGS, handleReceiveSettings);
            removeEventListener(SETTINGS_EVENTS.SETTING_CHANGED, handleSettingChanged);
            removeEventListener(SETTINGS_EVENTS.SCHEME_CHANGED, handleSchemeChanged);
            removeEventListener(SETTINGS_EVENTS.OPEN_MODAL, handleOpenModal);
            removeEventListener(SETTINGS_EVENTS.CLOSE_MODAL, handleCloseModal);
        };
    }, [
        addEventListener,
        removeEventListener,
        handleReceiveSettings,
        handleSettingChanged,
        handleSchemeChanged,
        handleOpenModal,
        handleCloseModal
    ]);

    // Request initial settings sync when Unity is loaded
    useEffect(() => {
        if (isLoaded && unityInstance) {
            console.log('[Settings] Unity loaded, requesting settings sync...');
            sendToUnity(SETTINGS_EVENTS.methods.REQUEST_SYNC);
        }
    }, [isLoaded, unityInstance, sendToUnity]);

    // Track mounted state
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        // State
        settings,
        isOpen,
        activeTab,
        isLoading,

        // Modal controls
        openModal,
        closeModal,
        setActiveTab,

        // Settings setters
        setViewType,
        setZoomSensitivity,
        setCameraSensitivity,
        setMapMovementType,
        setEffectVolume,
        setMusicVolume,
        setMasterVolume,
        toggleControlScheme,
        setControlScheme,
        enterAvatarCustomization,

        // Helpers
        isSchemeActive,
        isSchemeAvailable: checkSchemeAvailable
    };
};