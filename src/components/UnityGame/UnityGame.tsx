import { Unity, useUnityContext } from 'react-unity-webgl';
import { useUnitySettings, SettingsButton, SettingsModal } from '../UnitySettings';
import { useUnityInteractionPrompt, InteractionPrompt } from '../InteractionPrompt';
import { useUnityMap, MapModal, MapButton } from '../UnityMap';
import { EViewType } from '../UnitySettings/types/settings.types';
import { CursorHelp } from './components/CursorHelp';
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
    useUnityNewsStand,
    useUnityMedia,
    // ❌ useUnityProximityVoc supprimé — App.tsx gère le WebRTC via window events
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
    // Callbacks WebRTC branchés directement sur les events Unity
    onJoinWebRTC?: (targetPlayerId: string) => void;
    onLeaveWebRTC?: (targetPlayerId: string) => void;
}

function UnityGame({ 
    onChangeJitsiRoom, 
    conferenceUrl: webConferenceUrl,
    bbbRef: externalBbbRef,
    userName,
    onJoinWebRTC,
    onLeaveWebRTC,
}: UnityGameProps) {
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

    const bbbRef = useRef<any>(null);
    const finalBbbRef = externalBbbRef || bbbRef;

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

    // ✅ useUnityProximityVoc supprimé d'ici
    // La gestion WebRTC est faite dans App.tsx via :
    //   window.addEventListener('JoinWebRTCStream', ...)
    //   window.addEventListener('LeaveWebRTCStream', ...)

    useUnityInitialFocus({ isLoaded });

    // Branche les callbacks WebRTC sur les événements Unity
    // react-unity-webgl dispatche via son propre système, pas window
    useEffect(() => {
        if (!isLoaded) return;

        const handleJoin = (targetPlayerId: string) => {
            console.log('Unity: JoinWebRTCStream ->', targetPlayerId);
            onJoinWebRTC?.(targetPlayerId);
        };

        const handleLeave = (targetPlayerId: string) => {
            console.log('Unity: LeaveWebRTCStream ->', targetPlayerId);
            onLeaveWebRTC?.(targetPlayerId ?? '');
        };

        addEventListener('JoinWebRTC', handleJoin);
        addEventListener('LeaveWebRTC', handleLeave);

        return () => {
            removeEventListener('JoinWebRTC', handleJoin);
            removeEventListener('LeaveWebRTC', handleLeave);
        };
    }, [isLoaded, addEventListener, removeEventListener, onJoinWebRTC, onLeaveWebRTC]);

    useEffect(() => {
        if (isLoaded && UNSAFE__unityInstance) {
            (window as any).UNSAFE__unityInstance = UNSAFE__unityInstance;
            console.log("Unity instance exposed globally");
        }
    }, [isLoaded, UNSAFE__unityInstance]);

    const isAnyModalOpen = 
        tvModal.isOpen || 
        signModal.isOpen || 
        libraryDeskModal.isOpen || 
        newsStandModal.isOpen || 
        mediaModal.isOpen || 
        settingsHook.isOpen ||
        mapHook.isOpen;

    return (
        <div className="flex flex-col place-self-center bg-gradient-to-br from-[#212952] to-[#a9bcdb] bg-[url(/images/header_background.png)] bg-cover h-full w-full">

            {!isLoaded && <LoadingScreen progress={loadingProgression} />}

            <div
                ref={fullscreen.containerRef}
                className={`relative flex-grow ${!isLoaded ? "hidden" : "block"}`}
            >
                <Unity
                    id="unity-canvas"
                    unityProvider={unityProvider}
                    className="absolute inset-0 w-full h-full"
                    tabIndex={0}
                />

                <TVModal {...tvModal} />
                <SignModal {...signModal} />
                <ConferenceIframe {...conference} />
                <LibraryDeskModal {...libraryDeskModal} />
                <NewsStandModal {...newsStandModal} />
                <MediaModal {...mediaModal} />

                <BBBWrapper 
                    ref={finalBbbRef}
                    roomName={roomName}
                    userName={userName}
                />

                <SettingsModal 
                    settingsHook={settingsHook} 
                    portalContainer={fullscreen.containerRef.current}
                />

                <MapModal 
                    isOpen={mapHook.isOpen}
                    onClose={mapHook.closeMap}
                    onNavigate={mapHook.handleNavigate}
                    playerData={mapHook.playerPos}
                    currentSceneIndex={mapHook.currentSceneIndex}
                />

                {isLoaded && !conference.isFullscreen && mapHook.currentSceneIndex > 1 && (
                    <CursorHelp isVisible={settingsHook.settings.viewType === EViewType.THIRD_PERSON} />
                )}

                {isLoaded && !conference.isFullscreen && mapHook.currentSceneIndex > 1 && !isAnyModalOpen && !settingsHook.isLoading && (
                    <CameraRotationButtons
                        isLoaded={isLoaded}
                        unityInstance={UNSAFE__unityInstance}
                        viewType={settingsHook.settings.viewType}
                    />
                )}

                {isLoaded && !conference.isFullscreen && mapHook.currentSceneIndex > 1 && !mapHook.isOpen && !isAnyModalOpen && (
                    <MapButton onClick={mapHook.openMap} />
                )}

                {!isAnyModalOpen && mapHook.currentSceneIndex > 1 && (
                    <InteractionPrompt
                        isVisible={interactionPrompt.isVisible}
                        isMobile={interactionPrompt.isMobile}
                        onInteract={interactionPrompt.triggerInteraction}
                    />
                )}

                {isLoaded && !conference.isFullscreen && (
                    <FullscreenButton 
                        isFullscreen={fullscreen.isFullscreen}
                        onClick={fullscreen.toggle}
                    />
                )}

                {isLoaded && !conference.isFullscreen && mapHook.currentSceneIndex > 1 && !settingsHook.isOpen && (
                    <SettingsButton onClick={settingsHook.openModal} />
                )}
            </div>
        </div>
    );
}

export default UnityGame;