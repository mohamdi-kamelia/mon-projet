import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface MediaModalProps {
    isOpen: boolean;
    imageUrl: string;
    imageTitle: string;
    onClose: () => void;
}

export const MediaModal = ({ isOpen, imageUrl, imageTitle, onClose }: MediaModalProps) => {
    const [zoom, setZoom] = useState<number>(1);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 4;
    const ZOOM_STEP = 0.25;

    // Reset zoom and position when modal opens
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Handle wheel event with passive: false to allow preventDefault
    useEffect(() => {
        const container = containerRef.current;
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
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    }, [zoom, position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    }, [isDragging, dragStart, zoom]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
            <div className="relative w-[90%] max-w-5xl h-[85%] bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
                    <h2 className="text-white text-xl font-semibold truncate max-w-[60%]">
                        {imageTitle || "Image"}
                    </h2>
                    
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleZoomOut}
                            disabled={zoom <= MIN_ZOOM}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Zoom arrière"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                        </Button>
                        
                        <span className="text-white text-sm font-medium min-w-[60px] text-center bg-gray-700 px-3 py-2 rounded-lg">
                            {Math.round(zoom * 100)}%
                        </span>
                        
                        <Button
                            onClick={handleZoomIn}
                            disabled={zoom >= MAX_ZOOM}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Zoom avant"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                        </Button>
                        
                        <Button
                            onClick={handleResetZoom}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg ml-2"
                            title="Réinitialiser le zoom"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </Button>
                    </div>
                </div>

                {/* Image Container */}
                <div 
                    ref={containerRef}
                    className="flex-grow overflow-hidden flex items-center justify-center bg-gray-950 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    <img
                        src={imageUrl}
                        alt={imageTitle}
                        className="max-w-full max-h-full object-contain select-none transition-transform duration-100"
                        style={{
                            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                        }}
                        draggable={false}
                        onError={(e) => {
                            console.error("Failed to load image:", imageUrl);
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23334155' width='200' height='200'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='14' text-anchor='middle' x='100' y='100'%3EImage non disponible%3C/text%3E%3C/svg%3E";
                        }}
                    />
                </div>

                {/* Footer with instructions and close button */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700">
                    <p className="text-gray-400 text-sm">
                        {zoom > 1 
                            ? "🖱️ Glissez pour déplacer l'image • Molette pour zoomer" 
                            : "🖱️ Utilisez la molette ou les boutons pour zoomer"}
                    </p>
                    
                    <Button
                        onClick={onClose}
                        className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        ✕ Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
};