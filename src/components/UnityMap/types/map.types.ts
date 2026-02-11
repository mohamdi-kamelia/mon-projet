import { SCENE_NAMES } from '../constants/map.constants';

// ============================================
// Scene name type (derived from SCENE_NAMES constant)
// ============================================

export type SceneName = typeof SCENE_NAMES[keyof typeof SCENE_NAMES];

// ============================================
// Types (updated to include scene name)
// ============================================

export interface MapScene {
    id: number;              
    name: string;            
    color: string;           
    sceneName?: SceneName;
}

export interface PlayerMapPosition {
    x: number;
    y: number;
}

export interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (sceneIndex: number) => void;           
    onNavigateByName?: (sceneName: SceneName) => void;  
    playerData?: PlayerMapPosition;
    currentSceneIndex?: number;                          
    currentSceneName?: SceneName;                        
}

// ============================================
// Additional types for scene name support
// ============================================

export interface MapDestination {
    id: number;
    name: string;
    sceneName: SceneName;
    spawnPosition?: { x: number; y: number; z: number };
    spawnRotation?: { x: number; y: number; z: number };
    worldId?: string;
}

export interface SceneInfo {
    index: number;
    name: SceneName;
    displayName: string;
}