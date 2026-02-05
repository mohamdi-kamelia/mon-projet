import { MapScene, SceneName } from '../types/map.types';

// ============================================
// Scene name constants (must match Unity SceneNames.cs)
// ============================================

export const SCENE_NAMES = {
    WelcomeScreen: 'WelcomeScreen',
    SelectionSkinUMA: 'SelectionSkinUMA',
    ReceptionArea: 'ReceptionArea',
    OpenSpaceMap: 'OpenSpaceMap',      // Hub scene
    Project: 'Project',                
    Library2: 'Library2',               
    Theater: 'Theater',                
} as const;

export const HUB_SCENE_NAME = SCENE_NAMES.OpenSpaceMap;

// ============================================
// Event constants
// ============================================

export const MAP_EVENTS = {
    RECEIVER_OBJECT: 'WebInteraction',
    UPDATE_POSITION: 'UpdateMapPosition',
    CLOSE_MODAL: 'CloseMapModal',
    SET_CURRENT_SCENE: 'SetCurrentSceneIndex',        
    SET_CURRENT_SCENE_NAME: 'SetCurrentSceneName',    
    NAVIGATE_METHOD: 'NavigateToScene',               
    NAVIGATE_BY_NAME_METHOD: 'NavigateToSceneByName',
    START_SENDING_POS: 'StartSendingMapPosition',
    STOP_SENDING_POS: 'StopSendingMapPosition'
} as const;

// ============================================
// Scene list with IDs (updated to include scene names)
// ============================================

export const MAP_SCENES: MapScene[] = [
    { id: 2, name: "Zone d'accueil", color: "bg-orange-500", sceneName: SCENE_NAMES.ReceptionArea },
    { id: 3, name: "Espace Principal", color: "bg-blue-600", sceneName: SCENE_NAMES.OpenSpaceMap },
    { id: 4, name: "Espace de discussion", color: "bg-purple-500", sceneName: SCENE_NAMES.Project },
    { id: 5, name: "Espace Documentaire", color: "bg-green-600", sceneName: SCENE_NAMES.Library2 },
    { id: 6, name: "Amphithéâtre", color: "bg-red-600", sceneName: SCENE_NAMES.Theater },
];

// ============================================
// Minimap configuration
// ============================================

export const MINIMAP_CONFIG = {
    imagePath: '/images/Minimap.png',
    naturalWidth: 4845,
    naturalHeight: 4062,
    get aspectRatio() {
        return this.naturalWidth / this.naturalHeight;
    }
} as const;

// ============================================
// Map piece configuration (updated to include scene names)
// ============================================

interface MapPieceConfig {
    name: string;
    sceneName?: SceneName;  // Scene name reference
    x: number;
    y: number;
    width: number;
    height: number;
    invertX?: boolean;
    invertY?: boolean;
    swapXY?: boolean;
}

export const MAP_PIECES: Record<number, MapPieceConfig> = {
    // Scene 2: Reception
    2: { 
        name: "Zone d'accueil",
        sceneName: SCENE_NAMES.ReceptionArea,
        x: 1973, y: 3437, width: 753, height: 625,
        swapXY: true, 
    }, 
    
    // Scene 3: Main Space (Hub)
    3: { 
        name: "Espace Principal",
        sceneName: SCENE_NAMES.OpenSpaceMap,
        x: 1285, y: 970, width: 2048, height: 2468, 
        invertY: true 
    },
    
    // Scene 4: Discussion
    4: { 
        name: "Espace de discussion",
        sceneName: SCENE_NAMES.Project,
        x: 1543, y: 68, width: 1509, height: 903, 
        invertY: true 
    },
    
    // Scene 5: Library
    5: { 
        name: "Espace Documentaire",
        sceneName: SCENE_NAMES.Library2,
        x: 0, y: 0, width: 1280, height: 2670, 
        invertY: true 
    },
    
    // Scene 6: Amphitheater
    6: { 
        name: "Amphithéâtre",
        sceneName: SCENE_NAMES.Theater,
        x: 3343, y: 440, width: 1502, height: 2098, 
        invertY: true 
    },
};

// Map pieces by scene name (for scene-name-based lookups)
export const MAP_PIECES_BY_NAME: Record<SceneName, MapPieceConfig> = {
    [SCENE_NAMES.WelcomeScreen]: { name: "Welcome Screen", sceneName: SCENE_NAMES.WelcomeScreen, x: 0, y: 0, width: 0, height: 0 },
    [SCENE_NAMES.SelectionSkinUMA]: { name: "Selection Skin UMA", sceneName: SCENE_NAMES.SelectionSkinUMA, x: 0, y: 0, width: 0, height: 0 },
    [SCENE_NAMES.ReceptionArea]: MAP_PIECES[2],
    [SCENE_NAMES.OpenSpaceMap]: MAP_PIECES[3],
    [SCENE_NAMES.Project]: MAP_PIECES[4],
    [SCENE_NAMES.Library2]: MAP_PIECES[5],
    [SCENE_NAMES.Theater]: MAP_PIECES[6],
};

// ============================================
// Utility functions
// ============================================

export function getMapPieceForScene(sceneIndex: number): MapPieceConfig | undefined {
    return MAP_PIECES[sceneIndex];
}

// Get map piece by scene name
export function getMapPieceForSceneName(sceneName: SceneName): MapPieceConfig | undefined {
    return MAP_PIECES_BY_NAME[sceneName];
}

// Convert scene index to scene name
export function indexToSceneName(index: number): SceneName | undefined {
    const piece = MAP_PIECES[index];
    return piece?.sceneName;
}

// Convert scene name to index
export function sceneNameToIndex(sceneName: SceneName): number {
    for (const [indexStr, piece] of Object.entries(MAP_PIECES)) {
        if (piece.sceneName === sceneName) {
            return parseInt(indexStr);
        }
    }
    return -1;
}

// Get MapScene by scene name
export function getMapSceneByName(sceneName: SceneName): MapScene | undefined {
    return MAP_SCENES.find(scene => scene.sceneName === sceneName);
}

/**
 * Converts Unity UV (0-1) to Global CSS Percentage (0-1)
 * Used by MapModal to position the red dot
 */
export function localToGlobalPosition(
    localX: number, 
    localY: number, 
    sceneIndex: number
): { x: number; y: number } {
    const piece = getMapPieceForScene(sceneIndex);
    
    if (!piece) {
        return { x: 0.5, y: 0.5 };
    }
    
    // 1. Apply coordinate transformations
    let transformedX = localX;
    let transformedY = localY;
    
    if (piece.swapXY) {
        [transformedX, transformedY] = [transformedY, transformedX];
    }
    
    if (piece.invertX) {
        transformedX = 1 - transformedX;
    }
    
    if (piece.invertY) {
        transformedY = 1 - transformedY;
    }
    
    // 2. Calculate pixel position within the piece
    const pixelX = piece.x + (transformedX * piece.width);
    const pixelY = piece.y + (transformedY * piece.height);
    
    // 3. Convert to global percentage (0-1)
    const globalX = pixelX / MINIMAP_CONFIG.naturalWidth;
    const globalY = pixelY / MINIMAP_CONFIG.naturalHeight;
    
    return { x: globalX, y: globalY };
}

// localToGlobalPosition by scene name
export function localToGlobalPositionByName(
    localX: number, 
    localY: number, 
    sceneName: SceneName
): { x: number; y: number } {
    const index = sceneNameToIndex(sceneName);
    if (index < 0) {
        return { x: 0.5, y: 0.5 };
    }
    return localToGlobalPosition(localX, localY, index);
}