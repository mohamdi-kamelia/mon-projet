import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute, PublicRoute } from './contexts/PrivateRoute';
import { LoginPage, ForgotPasswordPage } from './pages/auth';
import UnityGame from './components/UnityGame/UnityGame';
import Footer from './components/Footer';
import { Webrtc } from './components/Webrtc';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';

function UnityGameWithFooter() {
  const jitsiRef = useRef<any>(null);
  const [roomName, setRoomName] = useState<string>("");
  const { user } = useAuth();

  // WebRTC WebSocket et état
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [playerDistances, setPlayerDistances] = useState<Map<string, number>>(new Map());

  // WebRTC Connexion WebSocket au serveur
  useEffect(() => {
    if (!user) return;

    const websocket = new WebSocket('ws://localhost:8081/ws');

    websocket.onopen = () => {
      console.log('WebSocket connecté');

      // Envoie le join avec l'ID du joueur
      websocket.send(JSON.stringify({
        type: 'join',
        playerId: user.id.toString(),
      }));

      setWs(websocket);
    };

    websocket.onclose = () => {
      console.log('WebSocket déconnecté');
      setWs(null);
    };

    websocket.onerror = (error) => {
      console.error(' WebSocket error:', error);
    };

    return () => {
      websocket.close();
    };
  }, [user]);

  //  WebRTC Écoute les événements Unity (JoinWebRTC / LeaveWebRTC)
  useEffect(() => {
    if (!ws || !user) return;

    // Quand Unity détecte qu'un joueur est proche
    const handleJoinWebRTC = (event: Event) => {
      console.log(event);
      const targetPlayerID = (event as CustomEvent).detail;
      console.log('Unity: JoinWebRTC', targetPlayerID);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'proximity_connect',
          playerId: user.id.toString(),
          targetPlayerId: targetPlayerID,
          distance: 4.0,
        }));
      }
    };

    // Quand Unity détecte qu'un joueur s'éloigne
    const handleLeaveWebRTC = (event: Event) => {
      const targetPlayerID = (event as CustomEvent).detail;
      console.log('Unity: LeaveWebRTC', targetPlayerID);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'proximity_disconnect',
          playerId: user.id.toString(),
          targetPlayerId: targetPlayerID,
          distance: 10.0,
        }));
      }
    };

    window.addEventListener('JoinWebRTC', handleJoinWebRTC);
    window.addEventListener('LeaveWebRTC', handleLeaveWebRTC);

    return () => {
      window.removeEventListener('JoinWebRTC', handleJoinWebRTC);
      window.removeEventListener('LeaveWebRTC', handleLeaveWebRTC);
    };
  }, [ws, user]);

  // WebRTC Récupère la position du joueur (depuis Unity)
  const getPlayerPosition = useCallback(() => {
    return { x: 0, y: 0, z: 0 };
  }, []);

  // WebRTC Récupère la distance avec un joueur
  const getPlayerDistance = useCallback((playerId: string) => {
    return playerDistances.get(playerId) ?? 5.0;
  }, [playerDistances]);

  // Gestion des rooms
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
            userName={user?.name || ""}
          />

          {/* WebRTC - Overlay vidéo */}
          {user && ws && (
            <Webrtc
              ws={ws}
              playerId={user.id.toString()}
              getPlayerPosition={getPlayerPosition}
              getPlayerDistance={getPlayerDistance}
              videoPosition="top-right"
              enabled={true}
            />
          )}
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
          userName={user?.name || ""}
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

          <Route
            path="/"
            element={
              <PrivateRoute>
                <UnityGameWithFooter />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;