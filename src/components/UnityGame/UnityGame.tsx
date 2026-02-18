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
    useUnityGame,
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
    MediaModal,
    GameModal,
} from './components';

import BBBWrapper from './components/BBB';
import { CameraRotationButtons } from '../CameraRotation/CameraRotationButtons';


interface UnityGameProps {
    onChangeJitsiRoom: (newRoom: string) => void;
    conferenceUrl?: string;
    bbbRef?: React.RefObject<any>;
    userName?: string;
    onJoinWebRTC?: (targetPlayerId: string) => void;
    onLeaveWebRTC?: (targetPlayerId: string) => void;
    onJoinBBB?: () => void;
    onLeaveBBB?: () => void;
}

function UnityGame({ 
    onChangeJitsiRoom, 
    conferenceUrl: webConferenceUrl,
    bbbRef: externalBbbRef,
    userName,
    onJoinWebRTC,
    onLeaveWebRTC,
    onJoinBBB,
    onLeaveBBB,
}: UnityGameProps) {
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

    const gameModal = useUnityGame({
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

    useUnityInitialFocus({ isLoaded });

    useEffect(() => {
        if (!isLoaded) return;

        const handleJoin = (targetPlayerId: string) => {
            console.log('Unity: JoinWebRTC ->', targetPlayerId);
            onJoinWebRTC?.(targetPlayerId);
        };

        const handleLeave = (targetPlayerId: string) => {
            console.log('Unity: LeaveWebRTC ->', targetPlayerId);
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
        if (!isLoaded) return;

        const handleJoinBBB = () => onJoinBBB?.();
        const handleLeaveBBB = () => onLeaveBBB?.();

        addEventListener('JoinBBB', handleJoinBBB);
        addEventListener('LeaveBBB', handleLeaveBBB);

        return () => {
            removeEventListener('JoinBBB', handleJoinBBB);
            removeEventListener('LeaveBBB', handleLeaveBBB);
        };
    }, [isLoaded, addEventListener, removeEventListener, onJoinBBB, onLeaveBBB]);

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
        gameModal.isOpen ||
        settingsHook.isOpen ||
        mapHook.isOpen;

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

                {/* Game Modal (Chess, Connect4, etc.)  */}
                <GameModal {...gameModal} playerName={userName} />

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

                {/* Interaction Prompt - only show when no modal is open */}
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

                {/* Settings button */}
                {isLoaded && !conference.isFullscreen && mapHook.currentSceneIndex > 1 && !settingsHook.isOpen && (
                    <SettingsButton onClick={settingsHook.openModal} />
                )}
            </div>
        </div>
    );
}

export default UnityGame;