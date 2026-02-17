import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute, PublicRoute } from './contexts/PrivateRoute';
import { LoginPage, ForgotPasswordPage } from './pages/auth';
import UnityGame from './components/UnityGame/UnityGame';
import Footer from './components/Footer';
import { Webrtc } from './components/Webrtc';
import { useRef, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useWebSocket } from './hooks/webRTC/use-websocket';
import { useProximity } from './hooks/webRTC/use-proximity';
import { useWebRTCControls } from './hooks/webRTC/use-webrtc-controls';

function UnityGameWithFooter() {
  const jitsiRef = useRef<any>(null);
  const { user, logout } = useAuth();

  const ws = useWebSocket();
  const { handleJoinWebRTC, handleLeaveWebRTC } = useProximity(ws);
  const { setLocalStream, toggleMic, toggleCamera } = useWebRTCControls();

  const getPlayerPosition = useCallback(() => ({ x: 0, y: 0, z: 0 }), []);
  const getPlayerDistance = useCallback((_playerId: string) => 5.0, []);

  const handleChangeRoom = useCallback((newRoom: string) => {
    console.log('App: Room changed to:', newRoom);
  }, []);

  const handleChangeUserName = useCallback((newUserName: string) => {
    jitsiRef.current?.userNameChange(newUserName);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 relative bg-gray-100">
          <UnityGame
            onChangeJitsiRoom={handleChangeRoom}
            conferenceUrl="https://stream.warlockproduction.fr/hls/live/mamvirtuelle/index.m3u8"
            bbbRef={jitsiRef}
            userName={user?.name || ""}
            onJoinWebRTC={handleJoinWebRTC}
            onLeaveWebRTC={handleLeaveWebRTC}
          />
        </div>
      </div>

      {user && ws && (
        <div className="fixed bottom-20 right-5 z-[9999] pointer-events-none">
          <div className="pointer-events-auto">
            <Webrtc
              ws={ws}
              playerId={user.id.toString()}
              getPlayerPosition={getPlayerPosition}
              getPlayerDistance={getPlayerDistance}
              videoPosition="top-right"
              enabled={true}
              onLocalStream={setLocalStream}
            />
          </div>
        </div>
      )}

      <footer className="w-full bg-gray-900 text-white flex-shrink-0">
        <Footer
          onMute={toggleMic}
          onVideo={toggleCamera}
          OnUserNameChange={handleChangeUserName}
          userName={user?.name || ""}
          userEmail={user?.email || ""}
          onLogout={logout}
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