/**
 * Settings types for Unity-React communication
 * These mirror the Unity enums and SO_SettingsData structure
 */

/**
 * View type enum - mirrors Unity's EViewType
 */
export enum EViewType {
    ISOMETRIC = 0,
    THIRD_PERSON = 1
}

/**
 * Map movement type enum - mirrors Unity's EMapMovementType
 */
export enum EMapMovementType {
    GPS = 0,
    AUTOMATIC = 1,
    TELEPORT = 2
}

/**
 * Device type - mirrors Unity's DeviceType
 */
export type DeviceType = 'Desktop' | 'Unknown';

/**
 * Control scheme names as used in Unity
 */
export type ControlSchemeName = 'ZQSD' | 'Arrows' | 'Joystick' | 'PointAndClick';

/**
 * Complete settings state received from Unity
 */
export interface SettingsState {
    // Camera
    viewType: EViewType;
    isometricZoomSensitivity: number;      // 0.01 - 3.0
    thirdPersonRotationSensitivity: number; // 0.1 - 5.0

    // Map Movement
    mapMovementType: EMapMovementType;

    // Sound
    effectVolume: number;   // 0 - 1
    musicVolume: number;    // 0 - 1
    masterVolume: number;   // 0 - 1

    // Control Schemes - active schemes list from Unity
    activeSchemes: ControlSchemeName[];

    // Device info
    deviceType: DeviceType;
}

/**
 * Settings tab identifiers
 */
export type SettingsTab = 'general' | 'sound' | 'accessibility' | 'avatar';

/**
 * Props for the settings modal
 */
export interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Return type for useUnitySettings hook
 */
export interface UseUnitySettingsReturn {
    // State
    settings: SettingsState;
    isOpen: boolean;
    activeTab: SettingsTab;
    isLoading: boolean;

    // Modal controls
    openModal: () => void;
    closeModal: () => void;
    setActiveTab: (tab: SettingsTab) => void;

    // Settings setters (send to Unity)
    setViewType: (value: EViewType) => void;
    setZoomSensitivity: (value: number) => void;
    setCameraSensitivity: (value: number) => void;
    setMapMovementType: (value: EMapMovementType) => void;
    setEffectVolume: (value: number) => void;
    setMusicVolume: (value: number) => void;
    setMasterVolume: (value: number) => void;
    toggleControlScheme: (schemeName: ControlSchemeName) => void;
    setControlScheme: (schemeName: ControlSchemeName, isActive: boolean) => void;
    
    // Actions
    enterAvatarCustomization: () => void;

    // Helpers
    isSchemeActive: (schemeName: ControlSchemeName) => boolean;
    isSchemeAvailable: (schemeName: ControlSchemeName) => boolean;
}

/**
 * Visibility rules for control schemes based on view type and device
 */
export interface SchemeVisibility {
    zqsd: boolean;
    arrows: boolean;
    joystick: boolean;
    pointAndClick: boolean;
}