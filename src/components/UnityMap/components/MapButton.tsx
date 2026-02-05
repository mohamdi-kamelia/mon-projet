import { Map } from 'lucide-react';

interface MapButtonProps {
    onClick: () => void;
}

export function MapButton({ onClick }: MapButtonProps) {
    return (
        <button
            onClick={onClick}
            className="absolute top-10 right-36 z-40 p-2.5 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors duration-150 shadow-lg group"
            aria-label="Carte"
            title="Ouvrir la carte"
        >
            <Map className="w-12 h-12 text-white group-hover:text-blue-400 transition-colors" />
        </button>
    );
}