import { Button } from "@/components/ui/button";
import VideoPlayer from '@/components/VideoPlayer';

interface ConferenceIframeProps {
    isActive: boolean;
    isFullscreen: boolean;
    conferenceUrl: string;
    onClose: () => void;
}

export const ConferenceIframe = ({ 
    isActive, 
    isFullscreen, 
    conferenceUrl, 
    onClose 
}: ConferenceIframeProps) => {
    if (!isActive || !conferenceUrl || conferenceUrl.trim() === "") {
        return null;
    }

    return (
        <div
            className={`absolute transition-all duration-300 ${
                isFullscreen
                    ? 'inset-0 z-50 bg-black bg-opacity-90 mx-[2%] my-2 rounded-2xl shadow-2xl'
                    : 'bottom-4 right-4 w-[400px] h-[225px] z-40'
            }`}
        >
            <div className={`w-full h-full flex flex-col ${isFullscreen ? 'p-4' : ''}`}>
                <div className={`bg-black overflow-hidden ${
                    isFullscreen
                        ? 'flex-grow rounded-lg mb-4'
                        : 'w-full h-full  rounded-lg shadow-2xl border-2 border-gray-600'
                }`}>
                    <VideoPlayer url={conferenceUrl} />
                </div>

                {isFullscreen && (
                    <div className="w-full flex justify-center">
                        <Button
                            onClick={onClose}
                            className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded font-semibold text-lg"
                        >
                            Fermer (Se lever)
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};