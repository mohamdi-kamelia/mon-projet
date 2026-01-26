import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";

interface BBBWrapperProps {
  roomName: string;
}

/**
 * Composant BBB - Version PLAYER FLOTTANT
 * Affiche BBB dans un player redimensionnable par-dessus Unity
 */
const BBBWrapper = forwardRef(({ roomName }: BBBWrapperProps, ref) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [bbbUrl, setBbbUrl] = useState<string>("");
  const [isInMeeting, setIsInMeeting] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

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
      setBbbUrl("");
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
        setBbbUrl(data.url);
        setIsInMeeting(true);
        setLoading(false);
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
    setBbbUrl("");
    setIsInMeeting(false);
    setIsMinimized(false);
    setError("");
    setLoading(false);
  };

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.bbb-resize-handle')) return;
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  // Méthodes de compatibilité
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
    setUserName(newUserName);
  };

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
  }, [roomName]);

  // Ne rien afficher si pas de réunion active
  if (!isInMeeting || !bbbUrl) {
    return null;
  }

  // Mode minimisé
  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#1976d2',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
        onClick={() => setIsMinimized(false)}
      >
        <span style={{ fontSize: '20px' }}>💬</span>
        <span style={{ fontWeight: 'bold' }}>Réunion BBB en cours</span>
      </div>
    );
  }

  // Player flottant
  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '2px solid #1976d2'
      }}
    >
      {/* Barre de titre */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          backgroundColor: '#1976d2',
          color: 'white',
          padding: '10px 15px',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>💬</span>
          <span style={{ fontWeight: 'bold' }}>Réunion BBB</span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Bouton minimiser */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Minimiser"
          >
            −
          </button>
          
          {/* Bouton quitter */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              leaveRoom();
            }}
            style={{
              background: '#f44336',
              border: 'none',
              color: 'white',
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Quitter"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Contenu iframe */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading ? (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#f0f0f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p>Connexion...</p>
            </div>
          </div>
        ) : error ? (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#ffebee', padding: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <p style={{ color: '#c62828', marginBottom: '16px' }}>{error}</p>
              <button
                onClick={() => joinRoom(roomName)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : (
          <iframe
            src={bbbUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="BigBlueButton Meeting"
          />
        )}
      </div>

      {/* Poignée de redimensionnement */}
      <div
        className="bbb-resize-handle"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = size.width;
          const startHeight = size.height;

          const handleResize = (e: MouseEvent) => {
            const newWidth = Math.max(400, startWidth + (e.clientX - startX));
            const newHeight = Math.max(300, startHeight + (e.clientY - startY));
            setSize({ width: newWidth, height: newHeight });
          };

          const handleResizeEnd = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', handleResizeEnd);
          };

          document.addEventListener('mousemove', handleResize);
          document.addEventListener('mouseup', handleResizeEnd);
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          cursor: 'nwse-resize',
          backgroundColor: '#1976d2',
          borderTopLeftRadius: '4px'
        }}
      />
    </div>
  );
});

export default BBBWrapper;