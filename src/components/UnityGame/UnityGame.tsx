// UnityGame.tsx - COMPLETE WITH CURSOR MANAGEMENT
import { Unity, useUnityContext } from 'react-unity-webgl';
import { useEffect } from 'react';

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

interface UnityGameProps {
    onChangeJitsiRoom: (newRoom: string) => void;
    conferenceUrl?: string;
}

function UnityGame({ onChangeJitsiRoom, conferenceUrl: webConferenceUrl }: UnityGameProps) {
    // Unity context setup
    //const baseUnity = "https://mam-virtuelle.s3.fr-par.scw.cloud/UnityBuild/Build/";
    const baseUnity = "/UnityBuild/Build/"; // Use this for local builds
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

    // Custom hooks - all modal and interaction logic extracted
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

    useUnityBBB({
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

    // Automatically focus Unity canvas on initial load
    useUnityInitialFocus({ isLoaded });

    // Expose Unity instance globally for NameModal and other components
    useEffect(() => {
        if (isLoaded && UNSAFE__unityInstance) {
            (window as any).UNSAFE__unityInstance = UNSAFE__unityInstance;
            console.log("Unity instance exposed globally");
        }
    }, [isLoaded, UNSAFE__unityInstance]);

    return (
        <div className="flex flex-col place-self-center bg-gradient-to-br from-[#212952] to-[#a9bcdb] bg-[url(/images/header_background.png)] bg-cover h-full w-full">
            {/* Header */}
            <div className='py-2 w-full flex items-center px-4'>
                <div className='w-full'>
                    <h3 className='text-lg text-SecondaryGreenMAM text-center'>
                        Bienvenue dans la Maison des Mathématiques Virtuelles !
                    </h3>
                </div>
            </div>

            {/* Loading screen */}
            {!isLoaded && <LoadingScreen progress={loadingProgression} />}

            {/* Unity container */}
            <div
                ref={fullscreen.containerRef}
                className={`relative flex-grow ${!isLoaded ? "hidden" : "block"}`}
            >
                {/* Unity canvas */}
                <Unity
                    id="unity-canvas"
                    unityProvider={unityProvider}
                    className="absolute inset-0 w-full h-full"
                    tabIndex={0}
                />

                {/* TV Modal */}
                <TVModal {...tvModal} />

                {/* Sign Modal */}
                <SignModal {...signModal} />

                {/* Conference iframe */}
                <ConferenceIframe {...conference} />

                {/* Library Desk Modal */}
                <LibraryDeskModal {...libraryDeskModal} />

                {/* News Stand Modal */}
                <NewsStandModal {...newsStandModal} />

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