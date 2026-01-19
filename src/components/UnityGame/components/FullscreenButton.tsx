import { Button } from "@/components/ui/button";

interface FullscreenButtonProps {
    isFullscreen: boolean;
    onClick: () => void;
}

export const FullscreenButton = ({ isFullscreen, onClick }: FullscreenButtonProps) => {
    return (
        <div className="absolute top-4 left-[1%] z-40">
            <Button
                onClick={onClick}
                className="bg-MainBlueMAM hover:bg-blue-600 text-white px-4 py-2 rounded shadow-lg"
            >
                {isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            </Button>
        </div>
    );
};