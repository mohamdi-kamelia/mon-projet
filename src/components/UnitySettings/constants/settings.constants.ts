import { 
    SettingsState, 
    EViewType, 
    EMapMovementType, 
    ControlSchemeName,
    SchemeVisibility,
    SettingsTab
} from '../types/settings.types';

/**
 * Default settings state - used before Unity sync
 */
export const DEFAULT_SETTINGS: SettingsState = {
    viewType: EViewType.THIRD_PERSON,
    isometricZoomSensitivity: 1.0,
    thirdPersonRotationSensitivity: 1.0,
    mapMovementType: EMapMovementType.AUTOMATIC,
    effectVolume: 0.5,
    musicVolume: 0.5,
    masterVolume: 0.5,
    activeSchemes: ['Arrows'],
    deviceType: 'Desktop'
};

/**
 * Slider constraints - mirrors Unity SO_SettingsData ranges
 */
export const SLIDER_CONSTRAINTS = {
    zoomSensitivity: {
        min: 0.01,
        max: 2.0,
        step: 0.01
    },
    cameraSensitivity: {
        min: 0.1,
        max: 1.5,
        step: 0.01
    },
    volume: {
        min: 0,
        max: 1,
        step: 0.01
    }
} as const;

/**
 * French labels for UI - matching Unity UI
 */
export const LABELS = {
    // Tabs
    tabs: {
        general: 'Généraux',
        sound: 'Son',
        accessibility: 'Accessibilité',
        avatar: 'Personnalisation'
    } as Record<SettingsTab, string>,

    // Section headers
    sections: {
        camera: 'Caméra',
        cameraZoom: 'Caméra Zoom',
        cameraSensitivity: 'Sensibilité Camera',
        movementControls: 'Contrôleurs de déplacement',
        mapMovement: 'Déplacement Cartes',
        interactions: 'Interactions',
        sound: 'Son',
        avatar: 'Avatar'
    },

    // Settings labels
    settings: {
        viewType: 'Choix du type de vue',
        zoomSpeed: 'Vitesse Caméra Zoom',
        cameraSensitivity: 'Sensibilité Caméra',
        mapMovement: 'Déplacement depuis la cartes',
        effectVolume: 'Volume des effets',
        musicVolume: 'Volume de la musique',
        masterVolume: 'Volume principal'
    },

    // View type options
    viewTypes: {
        [EViewType.ISOMETRIC]: 'Isométrique',
        [EViewType.THIRD_PERSON]: 'Troisième personne'
    } as Record<EViewType, string>,

    // Map movement type options
    mapMovementTypes: {
        [EMapMovementType.GPS]: 'GPS',
        [EMapMovementType.AUTOMATIC]: 'Automatique',
        [EMapMovementType.TELEPORT]: 'Téléportation'
    } as Record<EMapMovementType, string>,

    // Control scheme labels
    controlSchemes: {
        ZQSD: 'Touches ZQSD',
        Arrows: 'Flèches directionnelles',
        Joystick: 'Pilotage virtuel',
        PointAndClick: 'Point & Click'
    } as Record<ControlSchemeName, string>,

    // Control scheme descriptions
    controlSchemeDescriptions: {
        ZQSD: '',
        Arrows: '',
        Joystick: 'Maintenez le clic gauche enfoncé dans la direction où vous souhaitez vous déplacer.',
        PointAndClick: 'Effectuez un clic droit à l\'endroit où vous souhaitez vous déplacer.'
    } as Record<ControlSchemeName, string>,

    // Interaction hint
    interactionHint: 'Rappel : Pour interagir avec votre environnement, appuyez sur « F »'
} as const;

/**
 * WebEvents constants for Unity communication
 * These should match the WebEvents in the hooks folder
 */
export const SETTINGS_EVENTS = {
    // Target GameObject
    RECEIVER_OBJECT: 'WebInteraction',

    // Events from Unity to Web
    RECEIVE_SETTINGS: 'ReceiveSettings',
    SETTING_CHANGED: 'SettingChanged',
    SCHEME_CHANGED: 'SchemeChanged',
    OPEN_MODAL: 'OpenSettingsModal',
    CLOSE_MODAL: 'CloseSettingsModal',

    // Methods to call on Unity (via SendMessage)
    methods: {
        REQUEST_SYNC: 'RequestSettingsSync',
        SET_VIEW_TYPE: 'SetViewType',
        SET_CAMERA_SENSITIVITY: 'SetCameraSensitivity',
        SET_ZOOM_SENSITIVITY: 'SetZoomSensitivity',
        TOGGLE_SCHEME: 'ToggleControlScheme',
        SET_SCHEME: 'SetControlScheme',
        SET_MAP_MOVEMENT: 'SetMapMovementType',
        SET_EFFECT_VOLUME: 'SetEffectVolume',
        SET_MUSIC_VOLUME: 'SetMusicVolume',
        SET_MASTER_VOLUME: 'SetMasterVolume',
        ON_MODAL_OPENED: 'OnSettingsModalOpened',
        ON_MODAL_CLOSED: 'OnSettingsModalClosed',
        ENTER_AVATAR_CUSTOMIZATION: 'EnterAvatarCustomization'
    }
} as const;

/**
 * Get visibility rules for control schemes based on view type and device
 * Mirrors InputConstraintValidator logic from Unity
 */
export function getSchemeVisibility(
    viewType: EViewType, 
    deviceType: 'Desktop' | 'Unknown'
): SchemeVisibility {
    const isDesktop = deviceType === 'Desktop';
    const isIsometric = viewType === EViewType.ISOMETRIC;

    return {
        // ZQSD: Desktop only (both views)
        zqsd: isDesktop,

        // Arrows: Desktop only (both views)
        arrows: isDesktop,

        // Joystick: Mobile always, Desktop only in Isometric
        joystick: !isDesktop || isIsometric,

        // Point & Click: Isometric only (Desktop and Mobile)
        pointAndClick: isIsometric
    };
}

/**
 * Check if a specific scheme is available given current state
 */
export function isSchemeAvailable(
    schemeName: ControlSchemeName,
    viewType: EViewType,
    deviceType: 'Desktop' | 'Unknown'
): boolean {
    const visibility = getSchemeVisibility(viewType, deviceType);
    
    switch (schemeName) {
        case 'ZQSD': return visibility.zqsd;
        case 'Arrows': return visibility.arrows;
        case 'Joystick': return visibility.joystick;
        case 'PointAndClick': return visibility.pointAndClick;
        default: return false;
    }
}