import { Unity, useUnityContext } from 'react-unity-webgl';
import { useEffect, useRef } from 'react';

// Custom hooks
import {
    useUnityTV,
    useUnitySign,
    useUnityConference,
    useUnityFullscreen,
    useUnityMobile,
    useUnityBBB,
    useUnityLibraryDesk,
    useUnityInitialFocus,
    useUnityNewsStand
} from './hooks';

// Components
import {
    TVModal,
    SignModal,
    ConferenceIframe,
    LoadingScreen,
    FullscreenButton,
    LibraryDeskModal,
    NewsStandModal
} from './components';

import BBBWrapper from './components/BBB';

interface UnityGameProps {
    onChangeJitsiRoom: (newRoom: string) => void;
    conferenceUrl?: string;
}

function UnityGame({ onChangeJitsiRoom, conferenceUrl: webConferenceUrl }: UnityGameProps) {
    // Unity context setup
    //const baseUnity = "https://mam-virtuelle.s3.fr-par.scw.cloud/UnityBuild/Build/";
    const baseUnity = "/UnityBuild/Build/";
    const buildName = "UnityBuild";
    
    const { 
        unityProvider, 
        isLoaded, 
        loadingProgression, 
        UNSAFE__unityInstance, 
        addEventListener, 
        removeEventListener 
    } = useUnityContext({
        loaderUrl: baseUnity + buildName + ".loader.js",
        dataUrl: baseUnity + buildName + ".data",
        frameworkUrl: baseUnity + buildName + ".framework.js",
        codeUrl: baseUnity + buildName + ".wasm",
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const bbbRef = useRef<any>(null);

    // Custom hooks
    const tvModal = useUnityTV({
        addEventListener,
        removeEventListener,
        isLoaded,
        unityInstance: UNSAFE__unityInstance
    });

    const signModal = useUnitySign({
        addEventListener,
        removeEventListener,
        isLoaded,
        unityInstance: UNSAFE__unityInstance
    });

    const conference = useUnityConference({
        addEventListener,
        removeEventListener,
        isLoaded,
        unityInstance: UNSAFE__unityInstance,
        webConferenceUrl
    });

    const fullscreen = useUnityFullscreen();

    const mobile = useUnityMobile({
        isLoaded,
        unityInstance: UNSAFE__unityInstance
    });

    const { roomName } = useUnityBBB({
        addEventListener,
        removeEventListener,
        onChangeJitsiRoom
    });

    const libraryDeskModal = useUnityLibraryDesk({
        addEventListener,
        removeEventListener,
        isLoaded,
        unityInstance: UNSAFE__unityInstance
    });

    const newsStandModal = useUnityNewsStand({
        addEventListener,
        removeEventListener,
        isLoaded,
        unityInstance: UNSAFE__unityInstance
    });

    useUnityInitialFocus({ isLoaded });

    // Expose Unity instance globally
    useEffect(() => {
        if (isLoaded && UNSAFE__unityInstance) {
            (window as any).UNSAFE__unityInstance = UNSAFE__unityInstance;
            console.log("Unity instance exposed globally");
        }
    }, [isLoaded, UNSAFE__unityInstance]);

    useEffect(() => {
        if (!isLoaded) return;

        const canvas = document.getElementById('unity-canvas') as HTMLCanvasElement;
        const container = containerRef.current;
        
        if (!canvas || !container) {
            console.warn("Canvas or container not found");
            return;
        }

        console.log("Unity 6 Fix: Setting up auto-resize for canvas");

        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            console.log(`Resizing canvas to: ${rect.width}x${rect.height}`);
            
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
            // Forcer le recalcul
            canvas.width = Math.floor(rect.width);
            canvas.height = Math.floor(rect.height);
            
            // Notifier Unity du changement de taille
            if (UNSAFE__unityInstance) {
                try {
                    UNSAFE__unityInstance.SendMessage(
                        'Canvas',
                        'OnResize',
                        `${rect.width},${rect.height}`
                    );
                } catch (e) {
                    // Ignore si la méthode n'existe pas dans Unity
                }
            }
        };

        resizeCanvas();
        const timeoutId = setTimeout(resizeCanvas, 100);
        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(container);
        window.addEventListener('resize', resizeCanvas);
        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [isLoaded, UNSAFE__unityInstance]);

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#212952] to-[#a9bcdb] bg-[url(/images/header_background.png)] bg-cover">
            <div className='py-2 w-full flex items-center px-4 flex-shrink-0'>
                <div className='w-full'>
                    <h3 className='text-lg text-SecondaryGreenMAM text-center'>
                        Bienvenue dans la Maison des Mathématiques Virtuelles !
                    </h3>
                </div>
            </div>

            {!isLoaded && <LoadingScreen progress={loadingProgression} />}

            <div
                ref={containerRef}
                className={`relative flex-1 w-full min-h-0 ${!isLoaded ? "hidden" : "block"}`}
            >
                <Unity
                    id="unity-canvas"
                    unityProvider={unityProvider}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'block'
                    }}
                    tabIndex={0}
                />

                <TVModal {...tvModal} />

                {/* Sign Modal */}
                <SignModal {...signModal} />

                {/* Conference iframe */}
                <ConferenceIframe {...conference} />

                {/* Library Desk Modal */}
                <LibraryDeskModal {...libraryDeskModal} />

                {/* News Stand Modal */}
                <NewsStandModal {...newsStandModal} />

                <BBBWrapper 
                    ref={bbbRef}
                    roomName={roomName}
                />

                {/* Fullscreen button */}
                {isLoaded && !conference.isFullscreen && (
                    <FullscreenButton 
                        isFullscreen={fullscreen.isFullscreen}
                        onClick={fullscreen.toggle}
                    />
                )}
            </div>
        </div>
    );
}

export default UnityGame;