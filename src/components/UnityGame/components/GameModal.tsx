import { Button } from "@/components/ui/button";

interface GameModalProps {
    isOpen: boolean;
    gameType: string;
    roomID: string;
    playerName?: string;
    onClose: () => void;
}

const GAME_URLS: Record<string, string> = {
    Chess: import.meta.env.VITE_BACKEND_GAME_CHESS,
    // Connect4: 'http://localhost:3001',
};

const GAME_LABELS: Record<string, string> = {
    Chess: 'Échecs',
    Connect4: 'Puissance 4',
};

export const GameModal = ({ isOpen, gameType, roomID, playerName, onClose }: GameModalProps) => {
    if (!isOpen) return null;

    const label = GAME_LABELS[gameType] ?? gameType;
    const baseUrl = GAME_URLS[gameType];

    // Chess auto-join requires BOTH roomID and playerName, fallback to a default
    const effectivePlayerName = playerName || 'Player';

    // Build iframe URL with room info as query params
    const iframeUrl = baseUrl
        ? `${baseUrl}?roomID=${encodeURIComponent(roomID)}&playerName=${encodeURIComponent(effectivePlayerName)}`
        : null;

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
            <div className="w-[90%] max-w-[1200px] h-[85%] bg-[#292929] rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a]">
                    <h2 className="text-white font-bold text-lg">
                        {label} — {roomID}
                    </h2>
                    <Button
                        onClick={onClose}
                        className="bg-red-600 text-white hover:bg-red-700 px-4 py-1 rounded font-semibold text-sm"
                    >
                        Quitter la table
                    </Button>
                </div>

                {/* Game iframe */}
                <div className="flex-1">
                    {iframeUrl ? (
                        <iframe
                            src={iframeUrl}
                            title={label}
                            className="w-full h-full border-0"
                            allow="clipboard-write"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-gray-400 text-lg">
                                Jeu non disponible : {label}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
