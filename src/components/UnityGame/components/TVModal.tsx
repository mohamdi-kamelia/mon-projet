import { Button } from "@/components/ui/button";

interface TVModalProps {
    isOpen: boolean;
    videoUrl: string;
    onClose: () => void;
}

export const TVModal = ({ isOpen, videoUrl, onClose }: TVModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="w-[80%] bg-transparent bg-opacity-75 rounded-lg overflow-hidden flex flex-col">
                <div className="w-full aspect-video">
                    <iframe
                        width="100%"
                        height="100%"
                        src={videoUrl + "?loop=1&autoplay=1"}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    ></iframe>
                </div>
                <div className="w-full py-4 flex justify-center">
                    <Button
                        onClick={onClose}
                        className="bg-white text-red-600 hover:bg-gray-200 px-6 py-2 rounded font-semibold"
                    >
                        Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
};