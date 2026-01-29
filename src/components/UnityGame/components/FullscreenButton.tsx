import { Maximize, Minimize } from 'lucide-react';

interface FullscreenButtonProps {
    isFullscreen: boolean;
    onClick: () => void;
}

export const FullscreenButton = ({ isFullscreen, onClick }: FullscreenButtonProps) => {
    return (
        <button
            onClick={onClick}
            className="absolute top-10 left-16 z-40 p-2.5 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors duration-150 shadow-lg group"
            aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
        >
            {isFullscreen ? (
                <Minimize className="w-12 h-12 text-white group-hover:text-blue-400 transition-colors" />
            ) : (
                <Maximize className="w-12 h-12 text-white group-hover:text-blue-400 transition-colors" />
            )}
        </button>
    );
};