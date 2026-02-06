import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute, PublicRoute } from './contexts/PrivateRoute';
import { LoginPage, ForgotPasswordPage } from './pages/auth';
import UnityGame from './components/UnityGame/UnityGame';
import Footer from './components/Footer';
import { useRef, useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';

function UnityGameWithFooter() {
  const jitsiRef = useRef<any>(null);
  const [roomName, setRoomName] = useState<string>("");
  const { user } = useAuth(); // ← Récupérer l'utilisateur connecté

  const handleChangeRoom = useCallback((newRoom: string) => {
    setRoomName(newRoom);
    console.log("App: Room changed to:", newRoom);
  }, []);

  const handleChangeUserName = useCallback((newUserName: string) => {
    console.log("UserName Change ! " + newUserName);
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
            userName={user?.name || ""} // ← Passer le nom de l'utilisateur connecté
          />
        </div>
      </div>

      <footer className="w-full bg-gray-900 text-white flex-shrink-0">
        <Footer
          onMute={() => jitsiRef.current?.toggleAudio()}
          onVideo={() => jitsiRef.current?.toggleVideo()}
          onScreenShare={() => jitsiRef.current?.toggleShareScreen()}
          OnAudioInputChange={(deviceName: string) => jitsiRef.current?.setAudioInput(deviceName)}
          OnVideoInputChange={(deviceName: string) => jitsiRef.current?.setVideoInput(deviceName)}
          OnUserNameChange={handleChangeUserName}
          onGetApi={() => jitsiRef.current?.getApi()}
          userName={user?.name || ""} // ← Passer le nom de l'utilisateur connecté au Footer
          onForceJoin={() => handleChangeRoom("test" + Date.now())}
          onForceQuit={() => jitsiRef.current?.leaveRoom()}
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
          {/* Routes publiques - redirigent vers / si déjà connecté */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />

          {/* Route protégée - Unity - nécessite authentification */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <UnityGameWithFooter />
              </PrivateRoute>
            }
          />

          {/* Route 404 - rediriger vers login */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;