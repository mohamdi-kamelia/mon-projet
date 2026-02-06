import { Unity, useUnityContext } from 'react-unity-webgl';
import { useUnitySettings, SettingsButton, SettingsModal } from '../UnitySettings';
import { useUnityInteractionPrompt, InteractionPrompt } from '../InteractionPrompt';
import { useUnityMap, MapModal, MapButton } from '../UnityMap';
import { EViewType } from '../UnitySettings/types/settings.types';
import { CursorHelp } from './components/CursorHelp';
import { useUnityProjectSelection } from './hooks/useUnityProjectSelection';
import { ProjectSelectionModal } from './components/ProjectSelectionModal';
import { useEffect, useRef, useCallback } from 'react';

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
    useUnityNewsStand,
    useUnityMedia
} from './hooks';

// Components
import {
    TVModal,
    SignModal,
    ConferenceIframe,
    LoadingScreen,
    FullscreenButton,
    LibraryDeskModal,
    NewsStandModal,
    MediaModal
} from './components';

import BBBWrapper from './components/BBB';

// Camera rotation buttons for isometric view
import { CameraRotationButtons } from '../CameraRotation/CameraRotationButtons';


interface UnityGameProps {
    onChangeJitsiRoom: (newRoom: string) => void;
    conferenceUrl?: string;
    bbbRef?: React.RefObject<any>;
    userName?: string;
}

function UnityGame({ 
    onChangeJitsiRoom, 
    conferenceUrl: webConferenceUrl,
    bbbRef: externalBbbRef,
    userName 
}: UnityGameProps) {
    // Unity context setup
    //const baseUnity = "https://mam-virtuelle.s3.fr-par.scw.cloud/UnityBuild/Build/";
    const baseUnity = "/UnityBuild/Build/"; // Use this for local builds
    const buildName = "UnityBuild";
    
    const { 
        unityProvider, 
        isLoaded, 
        loadingProgression, 
        UNSAFE__unityInstance,
        sendMessage,
        addEventListener, 
        removeEventListener 
    } = useUnityContext({
        loaderUrl: baseUnity + buildName + ".loader.js",
        dataUrl: baseUnity + buildName + ".data",
        frameworkUrl: baseUnity + buildName + ".framework.js",
        codeUrl: baseUnity + buildName + ".wasm",
    });

    // Function to focus the Unity canvas (used by modals after closing)
    const focusUnityCanvas = useCallback(() => {
        const canvas = document.getElementById('unity-canvas') as HTMLCanvasElement;
        if (canvas) {
            canvas.focus();
        }
    }, []);

    // Project Selection Hook
    const projectSelection = useUnityProjectSelection(
        sendMessage,
        addEventListener,
        removeEventListener
    );

    const bbbRef = useRef<any>(null);
    const finalBbbRef = externalBbbRef || bbbRef;

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

    const mediaModal = useUnityMedia({
        addEventListener,
        removeEventListener,
        isLoaded,
        unityInstance: UNSAFE__unityInstance
    });

    const settingsHook = useUnitySettings({
        addEventListener,
        removeEventListener,
        isLoaded,
        unityInstance: UNSAFE__unityInstance
    });

    const interactionPrompt = useUnityInteractionPrompt({
        addEventListener,
        removeEventListener,
        isLoaded,
        unityInstance: UNSAFE__unityInstance
    });

    const mapHook = useUnityMap({
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

    // Determine if any modal is open (to hide interaction prompt)
    const isAnyModalOpen = 
        tvModal.isOpen || 
        signModal.isOpen || 
        libraryDeskModal.isOpen || 
        newsStandModal.isOpen || 
        mediaModal.isOpen || 
        settingsHook.isOpen ||
        mapHook.isOpen ||
        projectSelection.isOpen; // <-- ADD THIS: include project selection modal

    return (
        <div className="flex flex-col place-self-center bg-gradient-to-br from-[#212952] to-[#a9bcdb] bg-[url(/images/header_background.png)] bg-cover h-full w-full">


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

                {/* Media/Poster Modal */}
                <MediaModal {...mediaModal} />

                {/* BBB Wrapper */}
                <BBBWrapper 
                    ref={finalBbbRef}
                    roomName={roomName}
                    userName={userName}
                />

                {/* Settings Modal */}
                <SettingsModal 
                    settingsHook={settingsHook} 
                    portalContainer={fullscreen.containerRef.current}
                />

                {/* Map Modal */}
                <MapModal 
                    isOpen={mapHook.isOpen}
                    onClose={mapHook.closeMap}
                    onNavigate={mapHook.handleNavigate}
                    playerData={mapHook.playerPos}
                    currentSceneIndex={mapHook.currentSceneIndex}
                />

                {/* Project Selection Modal */}
                <ProjectSelectionModal
                    isOpen={projectSelection.isOpen}
                    projects={projectSelection.projects}
                    selectedProject={projectSelection.selectedProject}
                    error={projectSelection.error}
                    isLoading={projectSelection.isLoading}
                    onSelectProject={projectSelection.selectProject}
                    onConfirm={projectSelection.confirmSelection}
                    onClose={projectSelection.closeModal}
                    focusUnityCanvas={focusUnityCanvas}
                />

                {/* Only show when in Third Person View AND loaded */}
                {isLoaded && !conference.isFullscreen && mapHook.currentSceneIndex > 1 && (
                    <CursorHelp isVisible={settingsHook.settings.viewType === EViewType.THIRD_PERSON} />
                )}

                {/* Camera Rotation Buttons - Only visible in Isometric view, after settings loaded */}
                {isLoaded && !conference.isFullscreen && mapHook.currentSceneIndex > 1 && !isAnyModalOpen && !settingsHook.isLoading && (
                    <CameraRotationButtons
                        isLoaded={isLoaded}
                        unityInstance={UNSAFE__unityInstance}
                        viewType={settingsHook.settings.viewType}
                    />
                )}

                {/* Map Button - Displayed when no other blocking UI is active */}
                {isLoaded && !conference.isFullscreen && mapHook.currentSceneIndex > 1 && !mapHook.isOpen && !isAnyModalOpen && (
                    <MapButton onClick={mapHook.openMap} />
                )}

                {/*Interaction Prompt - only show when no modal is open */}
                {!isAnyModalOpen && mapHook.currentSceneIndex > 1 && (
                    <InteractionPrompt
                        isVisible={interactionPrompt.isVisible}
                        isMobile={interactionPrompt.isMobile}
                        onInteract={interactionPrompt.triggerInteraction}
                    />
                )}

                {/* Fullscreen button */}
                {isLoaded && !conference.isFullscreen && (
                    <FullscreenButton 
                        isFullscreen={fullscreen.isFullscreen}
                        onClick={fullscreen.toggle}
                    />
                )}

                {/* Settings button (web-triggered) */}
                {isLoaded && !conference.isFullscreen && mapHook.currentSceneIndex > 1 && !settingsHook.isOpen && (
                    <SettingsButton onClick={settingsHook.openModal} />
                )}
            </div>
        </div>
    );
}

export default UnityGame;