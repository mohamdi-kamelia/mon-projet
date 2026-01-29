import { MapScene } from '../types/map.types';

export const MAP_EVENTS = {
    RECEIVER_OBJECT: 'WebInteraction',
    UPDATE_POSITION: 'UpdateMapPosition',
    CLOSE_MODAL: 'CloseMapModal',
    SET_CURRENT_SCENE: 'SetCurrentSceneIndex',
    NAVIGATE_METHOD: 'NavigateToScene',
    START_SENDING_POS: 'StartSendingMapPosition',
    STOP_SENDING_POS: 'StopSendingMapPosition'
} as const;

export const MAP_SCENES: MapScene[] = [
    { id: 1, name: "Zone d'accueil", color: "bg-orange-500" },
    { id: 2, name: "Espace Principal", color: "bg-blue-600" },
    { id: 3, name: "Espace de discussion", color: "bg-purple-500" },
    { id: 4, name: "Espace Documentaire", color: "bg-green-600" },
    { id: 5, name: "Amphithéâtre", color: "bg-red-600" },
];

// 1. GLOBAL IMAGE CONFIGURATION
export const MINIMAP_CONFIG = {
    imagePath: '/images/Minimap.png',
    naturalWidth: 4845,  // Exact width of Minimap.png
    naturalHeight: 4062, // Exact height of Minimap.png
    get aspectRatio() {
        return this.naturalWidth / this.naturalHeight;
    }
} as const;

/**
 * 2. PIECE CONFIGURATION
 * Defines the pixel rectangle for each scene on the minimap image.
 */
interface MapPieceConfig {
    name: string;   // Added back for Debug Overlay
    x: number;      // Pixel X of the Left edge
    y: number;      // Pixel Y of the Top edge
    width: number;  // Width in pixels
    height: number; // Height in pixels
    invertX?: boolean; 
    invertY?: boolean; // Default true for Unity->Web mapping
    swapXY?: boolean;
}

export const MAP_PIECES: Record<number, MapPieceConfig> = {
    // Scene 1: Reception
    1: { 
        name: "Zone d'accueil",
        x: 1973, y: 3437, width: 753, height: 625,
        swapXY: true, 
    }, 
    
    // Scene 2: Main Space
    2: { 
        name: "Espace Principal",
        x: 1285, y: 970, width: 2048, height: 2468, 
        invertY: true 
    },
    
    // Scene 3: Discussion
    3: { 
        name: "Espace de discussion",
        x: 1543, y: 68, width: 1509, height: 903, 
        invertY: true 
    },
    
    // Scene 4: Library
    4: { 
        name: "Espace Documentaire",
        x: 0, y: 0, width: 1280, height: 2670, 
        invertY: true 
    },
    
    // Scene 5: Amphitheater
    5: { 
        name: "Amphithéâtre",
        x: 3343, y: 440, width: 1502, height: 2098, 
        invertY: true 
    },
};

export function getMapPieceForScene(sceneIndex: number): MapPieceConfig | undefined {
    return MAP_PIECES[sceneIndex];
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
    
    // 1. Handle Axis Swapping (90 degree rotation)
    // If swapXY is true, Unity X becomes vertical, Unity Y becomes horizontal
    let sourceHorizontal = piece.swapXY ? localY : localX;
    let sourceVertical   = piece.swapXY ? localX : localY;

    // 2. Handle Inversion
    // Note: If swapped, "invertX" now applies to the Unity Y input (because it's acting as horizontal)
    let adjustedX = piece.invertX ? (1 - sourceHorizontal) : sourceHorizontal;
    let adjustedY = piece.invertY ? (1 - sourceVertical)   : sourceVertical;
    
    // Clamp to 0-1
    adjustedX = Math.max(0, Math.min(1, adjustedX));
    adjustedY = Math.max(0, Math.min(1, adjustedY));
    
    // 3. Scale to Pixel Size
    const pixelInPieceX = adjustedX * piece.width;
    const pixelInPieceY = adjustedY * piece.height;
    
    // 4. Add Offset
    const globalPixelX = piece.x + pixelInPieceX;
    const globalPixelY = piece.y + pixelInPieceY;
    
    // 5. Convert to Global Percentage
    return {
        x: globalPixelX / MINIMAP_CONFIG.naturalWidth,
        y: globalPixelY / MINIMAP_CONFIG.naturalHeight
    };
}