import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";

interface BBBWrapperProps {
  roomName: string;
}

/**
 * Composant BBB - Touche Alt pour déplacer (version finale)
 */
const BBBWrapper = forwardRef(({ roomName }: BBBWrapperProps, ref) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [bbbUrl, setBbbUrl] = useState<string>("");
  const [isInMeeting, setIsInMeeting] = useState<boolean>(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 700, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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
    setError("");
    setLoading(false);
  };

  // Détecter la touche Alt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(true);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAltPressed) return;
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
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
  const toggleAudio = () => { setIsMuted(!isMuted); return !isMuted; };
  const toggleVideo = () => { setIsCameraMuted(!isCameraMuted); return !isCameraMuted; };
  const toggleShareScreen = () => {};
  const setAudioInput = (deviceName: string) => { setSelectedAudioInput(deviceName); };
  const setVideoInput = (deviceName: string) => { setSelectedVideoInput(deviceName); };
  const userNameChange = (newUserName: string) => { setUserName(newUserName); };

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
    } catch (err) { return false; }
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
    } catch (err) { return false; }
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
    } catch (err) { return false; }
  };

  useImperativeHandle(ref, () => ({
    joinRoom, leaveRoom, toggleAudio, toggleVideo, toggleShareScreen,
    setAudioInput, setVideoInput, userNameChange, getApi: () => null,
    muteAllUsers, muteUser, ejectUser,
  }));

  useEffect(() => {
    if (roomName) {
      joinRoom(roomName);
    } else {
      leaveRoom();
    }
  }, [roomName]);

  if (!isInMeeting || !bbbUrl) {
    return null;
  }

  if (loading || error) {
    return (
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ textAlign: 'center', color: 'white' }}>
          {loading ? (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p style={{ fontSize: '16px' }}>Connexion...</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <p style={{ fontSize: '16px', marginBottom: '16px' }}>{error}</p>
              <button
                onClick={() => joinRoom(roomName)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Réessayer
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        borderRadius: '12px',
        boxShadow: isAltPressed 
          ? '0 15px 60px rgba(59, 130, 246, 0.6)' 
          : '0 10px 40px rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        overflow: 'hidden',
        border: isAltPressed ? '3px solid #3b82f6' : '2px solid rgba(255, 255, 255, 0.1)',
        transition: 'box-shadow 0.2s ease, border 0.2s ease'
      }}
    >
      {/* Overlay quand Alt pressé */}
      {isAltPressed && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            zIndex: 10001,
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            {isDragging ? '⋮⋮ Déplacement...' : '⋮⋮ Cliquez et glissez'}
          </div>
        </div>
      )}

      {/* IFRAME BBB */}
      <iframe
        src={bbbUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          pointerEvents: isAltPressed ? 'none' : 'auto'
        }}
        title="BigBlueButton Meeting"
      />

      {/* Poignée de redimensionnement - À GAUCHE */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizing(true);
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = size.width;
          const startHeight = size.height;
          const startPosX = position.x;

          const handleResize = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const newWidth = Math.max(400, startWidth - deltaX);
            const newHeight = Math.max(300, startHeight + (e.clientY - startY));
            
            const newX = startPosX + (startWidth - newWidth);
            
            setSize({ width: newWidth, height: newHeight });
            setPosition(prev => ({ ...prev, x: newX }));
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
          left: 0,
          width: '40px',
          height: '40px',
          cursor: 'nesw-resize',
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderTopRightRadius: '8px',
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 1)';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.8)';
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ transform: 'scaleX(-1)' }}>
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </div>

      {/* Indicateur Alt discret en bas */}
      {!isAltPressed && !isDragging && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          zIndex: 10000,
          opacity: 0.4,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          transition: 'opacity 0.3s ease'
        }}>
          Alt + glisser pour déplacer
        </div>
      )}
    </div>
  );
});

export default BBBWrapper;