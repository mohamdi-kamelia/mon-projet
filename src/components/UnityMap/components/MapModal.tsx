import { X, MapPin, Navigation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { MapModalProps } from '../types/map.types';
import { 
    MAP_SCENES, 
    MINIMAP_CONFIG, 
    localToGlobalPosition,
    getMapPieceForScene 
} from '../constants/map.constants';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";

// Toggle debug mode to see coordinate values
const DEBUG_MODE = false;

// Zoom constants
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const DEFAULT_ZOOM = 0.75;

interface MapImageContainerProps {
    playerData: { x: number; y: number };
    currentSceneIndex: number;
    zoom: number;
    position: { x: number; y: number };
    isDragging: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
}

const MapImageContainer = ({ 
    playerData, 
    currentSceneIndex,
    zoom,
    position,
    isDragging,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave
}: MapImageContainerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [imageRect, setImageRect] = useState<{ 
        offsetX: number; 
        offsetY: number; 
        width: number; 
        height: number 
    } | null>(null);

    const calculateImageBounds = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const imageAspect = MINIMAP_CONFIG.aspectRatio;
        const containerAspect = containerWidth / containerHeight;
        
        let imageWidth: number, imageHeight: number, offsetX: number, offsetY: number;
        
        if (imageAspect > containerAspect) {
            imageWidth = containerWidth;
            imageHeight = containerWidth / imageAspect;
            offsetX = 0;
            offsetY = (containerHeight - imageHeight) / 2;
        } else {
            imageHeight = containerHeight;
            imageWidth = containerHeight * imageAspect;
            offsetX = (containerWidth - imageWidth) / 2;
            offsetY = 0;
        }

        setImageRect({ offsetX, offsetY, width: imageWidth, height: imageHeight });
    }, []);

    useEffect(() => {
        calculateImageBounds();
        const resizeObserver = new ResizeObserver(calculateImageBounds);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, [calculateImageBounds]);

    // Transform local coordinates to global minimap coordinates
    const globalPos = localToGlobalPosition(playerData.x, playerData.y, currentSceneIndex);
    const piece = getMapPieceForScene(currentSceneIndex);

    // Calculate CSS position for the player dot (relative to the image, not the container)
    const getDotPositionRelativeToImage = () => {
        if (!imageRect) {
            return { left: '50%', top: '50%' };
        }

        // Calculate position as percentage of the image
        const percentX = globalPos.x * 100;
        const percentY = globalPos.y * 100;

        return {
            left: `${percentX}%`,
            top: `${percentY}%`
        };
    };

    const dotPosition = getDotPositionRelativeToImage();

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full relative overflow-hidden"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            {/* Zoomable container - contains both the map and the player dot */}
            <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-100 select-none"
                style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                }}
            >
                {/* Map Image */}
                <div className="relative">
                    <img
                        src={MINIMAP_CONFIG.imagePath}
                        alt="Carte de la MAM"
                        className="max-w-full max-h-full object-contain select-none"
                        draggable={false}
                        style={{
                            maxHeight: 'calc(85vh - 2rem)',
                        }}
                    />
                    
                    {/* Debug Overlay */}
                    {DEBUG_MODE && piece && (
                        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs p-2 rounded font-mono z-20">
                            <div>Scene: {currentSceneIndex} ({piece.name})</div>
                            <div>Local UV: ({playerData.x.toFixed(3)}, {playerData.y.toFixed(3)})</div>
                            <div>Global CSS: ({globalPos.x.toFixed(3)}, {globalPos.y.toFixed(3)})</div>
                            <div className="border-t border-gray-600 pt-1 mt-1">
                                Piece Config:
                            </div>
                            <div>  pos: ({piece.x}, {piece.y})</div>
                            <div>  size: {piece.width}x{piece.height}</div>
                            <div>
                                invertX: {piece.invertX ? '✓' : '✗'} | 
                                invertY: {piece.invertY ? '✓' : '✗'} | 
                                swapXY: {piece.swapXY ? '✓' : '✗'}
                            </div>
                            <div className="border-t border-gray-600 pt-1 text-[10px] text-gray-400">
                                Adjust MAP_PIECES in map.constants.ts
                            </div>
                        </div>
                    )}

                    {/* Player Dot - positioned relative to the image */}
                    <div
                        className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 z-10 group"
                        style={dotPosition}
                    >
                        <div className="absolute inset-0 bg-red-500/50 rounded-full animate-ping" />
                        <div className="absolute inset-0 bg-red-500 border-2 border-white rounded-full shadow-lg shadow-red-500/50" />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Vous êtes ici
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MapModal = ({
    isOpen,
    onClose,
    onNavigate,
    playerData = { x: 0.5, y: 0.5 },
    currentSceneIndex = -1
}: MapModalProps) => {
    // Zoom state
    const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Reset zoom and position when modal opens
    useEffect(() => {
        if (isOpen) {
            setZoom(DEFAULT_ZOOM);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Handle wheel event with passive: false to allow preventDefault
    useEffect(() => {
        const container = mapContainerRef.current;
        if (!container || !isOpen) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            setZoom(prev => Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM));
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [isOpen]);

    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoom(DEFAULT_ZOOM);
        setPosition({ x: 0, y: 0 });
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    if (!isOpen) return null;

    const currentScene = MAP_SCENES.find(scene => scene.id === currentSceneIndex);

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-[95%] max-w-[1600px] h-[85vh] bg-[#1a1f2e] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    aria-label="Fermer la carte"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Map area with zoom controls */}
                <div className="flex-grow relative bg-[#0f1219] overflow-hidden flex flex-col">
                    {/* Zoom Controls Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#1a1f2e] border-b border-slate-700">
                        <h3 className="text-white font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-500" />
                            Carte de la MAM
                        </h3>
                        
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleZoomOut}
                                disabled={zoom <= MIN_ZOOM}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Zoom arrière"
                                size="sm"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            
                            <span className="text-white text-sm font-medium min-w-[60px] text-center bg-slate-700 px-3 py-1.5 rounded-lg">
                                {Math.round(zoom * 100)}%
                            </span>
                            
                            <Button
                                onClick={handleZoomIn}
                                disabled={zoom >= MAX_ZOOM}
                                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Zoom avant"
                                size="sm"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            
                            <Button
                                onClick={handleResetZoom}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg ml-2"
                                title="Réinitialiser le zoom"
                                size="sm"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div ref={mapContainerRef} className="flex-grow p-4">
                        <MapImageContainer 
                            playerData={playerData} 
                            currentSceneIndex={currentSceneIndex}
                            zoom={zoom}
                            position={position}
                            isDragging={isDragging}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                        />
                    </div>

                    {/* Instructions Footer */}
                    <div className="px-4 py-2 bg-[#1a1f2e] border-t border-slate-700">
                        <p className="text-slate-400 text-xs text-center">
                            🖱️ Glissez pour déplacer la carte • Molette pour zoomer
                        </p>
                    </div>
                </div>

                {/* Navigation Sidebar */}
                <div className="w-80 bg-[#1e2330] border-l border-slate-700 p-6 flex flex-col shadow-xl">
                    
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Navigation className="w-6 h-6 text-blue-400" />
                            Navigation
                        </h2>
                        <p className="text-slate-400 text-sm mt-2">
                            Sélectionnez une destination pour vous y rendre.
                        </p>
                    </div>

                    {currentScene && (
                        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <MapPin className="w-4 h-4 text-red-500" />
                                <span>Position actuelle:</span>
                            </div>
                            <p className="text-white font-medium mt-1">{currentScene.name}</p>
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                        {MAP_SCENES.map((scene) => {
                            const isHere = scene.id === currentSceneIndex;
                            return (
                                <button
                                    key={scene.id}
                                    onClick={() => !isHere && onNavigate(scene.id)}
                                    disabled={isHere}
                                    className={`
                                        w-full p-4 rounded-lg text-left transition-all duration-200 group
                                        ${isHere
                                            ? 'bg-slate-700/50 border border-slate-600 cursor-not-allowed opacity-60'
                                            : 'bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-700/50'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${scene.color} ${!isHere ? 'group-hover:scale-125' : ''} transition-transform`} />
                                        <span className={`font-medium ${isHere ? 'text-slate-400' : 'text-white'}`}>
                                            {scene.name}
                                        </span>
                                        {isHere && (
                                            <span className="ml-auto text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded">
                                                Ici
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-xs text-slate-500 text-center">
                            Le mode de déplacement peut être configuré dans les paramètres.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};