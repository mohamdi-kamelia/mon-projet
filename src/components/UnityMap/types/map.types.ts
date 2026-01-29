export interface MapScene {
    id: number;
    name: string;
    color: string;
}

export interface PlayerMapPosition {
    x: number;
    y: number;
}

export interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (sceneIndex: number) => void;
    playerData?: PlayerMapPosition;
    currentSceneIndex?: number;
}