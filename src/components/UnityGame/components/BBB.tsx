import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";

interface BBBWrapperProps {
  roomName: string;
}

/**
 * Composant BBB - Version POPUP WINDOW
 * Ouvre BBB dans une nouvelle fenêtre au lieu d'un iframe
 */
const BBBWrapper = forwardRef(({ roomName }: BBBWrapperProps, ref) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [bbbWindow, setBbbWindow] = useState<Window | null>(null);
  const [isInMeeting, setIsInMeeting] = useState<boolean>(false);

  // États compatibles avec Jitsi
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraMuted, setIsCameraMuted] = useState(true);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
  const [userName, setUserName] = useState<string>("Guest");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

  const joinRoom = async (roomName: string) => {
    if (!roomName || roomName === "") {
      setLoading(false);
      setError("");
      setIsInMeeting(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/bbb/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingID: roomName,
          userName: userName,
          isModerator: false
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.url) {
        // ✅ Ouvrir BBB dans une NOUVELLE FENÊTRE
        const width = 1200;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const popup = window.open(
          data.url,
          'BBB_Meeting',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no`
        );

        if (popup) {
          setBbbWindow(popup);
          setIsInMeeting(true);
          setLoading(false);

          // Surveiller la fermeture de la fenêtre
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              setBbbWindow(null);
              setIsInMeeting(false);
              console.log("Fenêtre BBB fermée");
            }
          }, 1000);
        } else {
          setError("Popup bloquée ! Autorise les popups pour ce site.");
          setLoading(false);
        }
      } else {
        setError(data.error || "Impossible de rejoindre la réunion");
        setLoading(false);
      }
    } catch (err) {
      console.error("Erreur BBB:", err);
      setError("Erreur de connexion au serveur backend");
      setLoading(false);
    }
  };

  const leaveRoom = () => {
    if (bbbWindow && !bbbWindow.closed) {
      bbbWindow.close();
    }
    setBbbWindow(null);
    setIsInMeeting(false);
    setError("");
    setLoading(false);
  };

  // Méthodes de compatibilité Jitsi
  const toggleAudio = () => {
    console.warn("toggleAudio: Non supporté avec BBB.");
    setIsMuted(!isMuted);
    return !isMuted;
  };

  const toggleVideo = () => {
    console.warn("toggleVideo: Non supporté avec BBB.");
    setIsCameraMuted(!isCameraMuted);
    return !isCameraMuted;
  };

  const toggleShareScreen = () => {
    console.warn("toggleShareScreen: Non supporté avec BBB.");
  };

  const setAudioInput = (deviceName: string) => {
    console.warn("setAudioInput: Non supporté avec BBB.");
    setSelectedAudioInput(deviceName);
  };

  const setVideoInput = (deviceName: string) => {
    console.warn("setVideoInput: Non supporté avec BBB.");
    setSelectedVideoInput(deviceName);
  };

  const userNameChange = (newUserName: string) => {
    console.warn("userNameChange: Non supporté avec BBB après connexion.");
    setUserName(newUserName);
  };

  // Nouvelles méthodes BBB
  const muteAllUsers = async () => {
    if (!roomName) return false;
    try {
      const response = await fetch(`${BACKEND_URL}/api/bbb/mute-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingID: roomName })
      });
      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error("Erreur mute all:", err);
      return false;
    }
  };

  const muteUser = async (userID: string) => {
    if (!roomName) return false;
    try {
      const response = await fetch(`${BACKEND_URL}/api/bbb/mute-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingID: roomName, userID })
      });
      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error("Erreur mute user:", err);
      return false;
    }
  };

  const ejectUser = async (userID: string) => {
    if (!roomName) return false;
    try {
      const response = await fetch(`${BACKEND_URL}/api/bbb/eject-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingID: roomName, userID })
      });
      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error("Erreur eject user:", err);
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    toggleShareScreen,
    setAudioInput,
    setVideoInput,
    userNameChange,
    getApi: () => null,
    muteAllUsers,
    muteUser,
    ejectUser,
  }));

  useEffect(() => {
    if (roomName) {
      joinRoom(roomName);
    } else {
      leaveRoom();
    }

    return () => {
      if (bbbWindow && !bbbWindow.closed) {
        bbbWindow.close();
      }
    };
  }, [roomName]);

  // UI
  if (loading) {
    return (
      <div className="pb-5" style={{
        width: "100%", height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#f0f0f0", zIndex: 50
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666" }}>
            Ouverture de la fenêtre BBB...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-5" style={{
        width: "100%", height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#ffebee", zIndex: 50
      }}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <p style={{ fontSize: "18px", color: "#c62828", fontWeight: "bold" }}>
            Erreur
          </p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
            {error}
          </p>
          {error.includes("Popup") && (
            <p style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
              💡 Astuce : Autorise les popups dans les paramètres de ton navigateur
            </p>
          )}
          <button
            onClick={() => joinRoom(roomName)}
            style={{
              marginTop: "16px", padding: "10px 20px",
              backgroundColor: "#2196F3", color: "white",
              border: "none", borderRadius: "4px",
              cursor: "pointer", fontSize: "14px"
            }}
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (isInMeeting) {
    return (
      <div className="pb-5" style={{
        width: "100%", height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#e3f2fd", zIndex: 50
      }}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>💬</div>
          <p style={{ fontSize: "20px", color: "#1976d2", fontWeight: "bold", marginBottom: "16px" }}>
            Réunion en cours
          </p>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
            La réunion BBB est ouverte dans une autre fenêtre
          </p>
          <button
            onClick={leaveRoom}
            style={{
              padding: "12px 24px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            🚪 Quitter la réunion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-5" style={{
      width: "100%", height: "100%", display: "flex",
      alignItems: "center", justifyContent: "center",
      backgroundColor: "#f5f5f5", zIndex: 50
    }}>
      <p style={{ color: "#999" }}>En attente d'une salle...</p>
    </div>
  );
});

export default BBBWrapper;