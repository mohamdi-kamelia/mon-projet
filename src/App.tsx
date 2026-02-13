import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute, PublicRoute } from './contexts/PrivateRoute';
import { LoginPage, ForgotPasswordPage } from './pages/auth';
import UnityGame from './components/UnityGame/UnityGame';
import Footer from './components/Footer';
import { Webrtc } from './components/Webrtc';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';

// URL relative : Vite proxifie /ws vers ws://localhost:8080/ws
// URL relative : passe toujours par le proxy Vite (vite.config.ts /ws -> ws://localhost:8080)
// Vite proxifie la connexion wss -> ws, le backend Go n'a pas besoin de TLS
const WS_URL = import.meta.env.VITE_WS_URL ?? '/ws';

function UnityGameWithFooter() {
  const jitsiRef = useRef<any>(null);
  const [roomName, setRoomName] = useState<string>("");
  const { user } = useAuth();

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [playerDistances, setPlayerDistances] = useState<Map<string, number>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WebSocket avec reconnexion automatique
  useEffect(() => {
    if (!user) return;

    let websocket: WebSocket;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      websocket = new WebSocket(WS_URL);

      websocket.onopen = () => {
        console.log('WebSocket connecte');
        websocket.send(JSON.stringify({
          type: 'join',
          playerId: user.id.toString(),
        }));
        setWs(websocket);
      };

      websocket.onclose = () => {
        console.log('WebSocket deconnecte - reconnexion dans 3s...');
        setWs(null);
        if (!cancelled) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      websocket?.close();
    };
  }, [user]);

  // Callbacks passes a UnityGame
  // react-unity-webgl dispatche ses evenements en interne (pas via window)
  // donc on passe les handlers directement a UnityGame qui a acces a addEventListener Unity
  const handleJoinWebRTC = useCallback((targetPlayerId: string) => {
    console.log('Unity: JoinWebRTCStream ->', targetPlayerId);
    if (ws && ws.readyState === WebSocket.OPEN && user) {
      ws.send(JSON.stringify({
        type: 'proximity_connect',
        playerId: user.id.toString(),
        targetPlayerId,
        distance: 4.0,
      }));
    }
  }, [ws, user]);

  const handleLeaveWebRTC = useCallback((targetPlayerId: string) => {
    console.log('Unity: LeaveWebRTCStream ->', targetPlayerId);
    if (ws && ws.readyState === WebSocket.OPEN && user) {
      ws.send(JSON.stringify({
        type: 'proximity_disconnect',
        playerId: user.id.toString(),
        targetPlayerId,
        distance: 10.0,
      }));
    }
  }, [ws, user]);

  const getPlayerPosition = useCallback(() => {
    return { x: 0, y: 0, z: 0 };
  }, []);

  const getPlayerDistance = useCallback((playerId: string) => {
    return playerDistances.get(playerId) ?? 5.0;
  }, [playerDistances]);

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
            onJoinWebRTC={handleJoinWebRTC}
            onLeaveWebRTC={handleLeaveWebRTC}
          />

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