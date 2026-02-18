import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute, PublicRoute } from './contexts/PrivateRoute';
import { LoginPage, ForgotPasswordPage } from './pages/auth';
import UnityGame from './components/UnityGame/UnityGame';
import Footer from './components/Footer';
import { Webrtc } from './components/Webrtc';
import { useRef, useCallback, useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useWebSocket } from './hooks/webRTC/use-websocket';
import { useProximity } from './hooks/webRTC/use-proximity';
import { useWebRTCControls } from './hooks/webRTC/use-webrtc-controls';

function UnityGameWithFooter() {
  const jitsiRef = useRef<any>(null);
  const { user, logout } = useAuth();

  const ws = useWebSocket();
  const { handleJoinWebRTC, handleLeaveWebRTC } = useProximity(ws);
  const { setLocalStream, setWs, toggleMic, toggleCamera } = useWebRTCControls();

  const [localStream, setLocalStreamState] = useState<MediaStream | null>(null);
  const [inBBBMeeting, setInBBBMeeting] = useState(false);

  // ✅ États mic/cam partagés entre Footer et LocalVideo
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const handleLocalStream = useCallback((stream: MediaStream | null) => {
    setLocalStream(stream);
    setLocalStreamState(stream);
  }, [setLocalStream]);

  // ✅ Handlers qui mettent à jour l'état local en plus du toggle
  const handleMute = useCallback(() => {
    const result = toggleMic();
    setIsMuted(result);
    return result;
  }, [toggleMic]);

  const handleVideo = useCallback(() => {
    const result = toggleCamera();
    setIsCameraOff(result);
    return result;
  }, [toggleCamera]);

  useEffect(() => {
    setWs(ws, user?.id.toString() ?? '');
  }, [ws, user, setWs]);

  const getPlayerPosition = useCallback(() => ({ x: 0, y: 0, z: 0 }), []);
  const getPlayerDistance = useCallback((_playerId: string) => 5.0, []);

  const handleChangeRoom = useCallback((newRoom: string) => {
    console.log('App: Room changed to:', newRoom);
  }, []);

  const handleChangeUserName = useCallback((newUserName: string) => {
    jitsiRef.current?.userNameChange(newUserName);
  }, []);

  const handleJoinBBB = useCallback(() => {
    console.log('[BBB] Réunion démarrée → WebRTC suspendu');
    setInBBBMeeting(true);
  }, []);

  const handleLeaveBBB = useCallback(() => {
    console.log('[BBB] Réunion fermée → WebRTC réactivé');
    setInBBBMeeting(false);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 relative bg-gray-100">
          <UnityGame
            onChangeJitsiRoom={handleChangeRoom}
            conferenceUrl="https://phm.cdnvideo.phm.education.gouv.fr/79b6d082f124/smil:mystreamhd.smil/playlist.m3u8"
            bbbRef={jitsiRef}
            userName={user?.name || ""}
            onJoinWebRTC={handleJoinWebRTC}
            onLeaveWebRTC={handleLeaveWebRTC}
            onJoinBBB={handleJoinBBB}
            onLeaveBBB={handleLeaveBBB}
          />
        </div>
      </div>

      {user && ws && (
        <div className="fixed bottom-20 right-5 z-[9999] pointer-events-none">
          <div className="pointer-events-auto">
            {!inBBBMeeting && (
              <Webrtc
                ws={ws}
                playerId={user.id.toString()}
                getPlayerPosition={getPlayerPosition}
                getPlayerDistance={getPlayerDistance}
                videoPosition="top-right"
                enabled={true}
                onLocalStream={handleLocalStream}
                micEnabled={!isMuted}
                camEnabled={!isCameraOff}
              />
            )}
          </div>
        </div>
      )}

      {inBBBMeeting && (
        <div className="fixed bottom-20 right-5 z-[9999] bg-blue-600/90 text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          En réunion BBB — WebRTC suspendu
        </div>
      )}

      <footer className="w-full bg-gray-900 text-white flex-shrink-0">
        <Footer
          onMute={handleMute}
          onVideo={handleVideo}
          OnUserNameChange={handleChangeUserName}
          userName={user?.name || ""}
          userEmail={user?.email || ""}
          onLogout={logout}
          localStream={localStream}
        />
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><UnityGameWithFooter /></PrivateRoute>} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;