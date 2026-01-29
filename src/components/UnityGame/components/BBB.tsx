import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";

interface BBBWrapperProps {
  roomName: string;
  userName?: string;  
}

const BBBWrapper = forwardRef(({ roomName, userName: userNameProp }: BBBWrapperProps, ref) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [bbbUrl, setBbbUrl] = useState<string>("");
  const [isInMeeting, setIsInMeeting] = useState<boolean>(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 700, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraMuted, setIsCameraMuted] = useState(true);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
  const [userName, setUserName] = useState<string>(userNameProp || "Guest");
  const isJoiningRef = useRef<boolean>(false);
  const currentRoomRef = useRef<string>("");
  const hasJoinedRef = useRef<boolean>(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

  const joinRoom = async (roomName: string) => {
    if (!roomName || roomName === "") {
      setLoading(false);
      setError("");
      setIsInMeeting(false);
      setBbbUrl("");
      currentRoomRef.current = "";
      isJoiningRef.current = false;
      hasJoinedRef.current = false;
      return;
    }

    if (isJoiningRef.current) {
      console.log("🚫 Appel joinRoom déjà en cours, ignoré");
      return;
    }

    if (currentRoomRef.current === roomName && hasJoinedRef.current) {
      console.log("🚫 Déjà dans cette room:", roomName);
      return;
    }

    console.log("✅ Joining BBB room:", roomName);
    isJoiningRef.current = true;
    currentRoomRef.current = roomName;
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
        hasJoinedRef.current = true;
        setLoading(false);
        console.log("✅ BBB room joined successfully");
      } else {
        setError(data.error || "Impossible de rejoindre la réunion");
        setLoading(false);
        hasJoinedRef.current = false;
      }
    } catch (err) {
      console.error("Erreur BBB:", err);
      setError("Erreur de connexion au serveur backend");
      setLoading(false);
      hasJoinedRef.current = false;
    } finally {
      isJoiningRef.current = false;
    }
  };

  const leaveRoom = () => {
    console.log("🚪 Leaving BBB room");
    setBbbUrl("");
    setIsInMeeting(false);
    setError("");
    setLoading(false);
    currentRoomRef.current = "";
    isJoiningRef.current = false;
    hasJoinedRef.current = false;
  };

  const handleDragMouseDown = (e: React.MouseEvent) => {
    console.log("🖱️ Drag initiated");
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
    e.stopPropagation();
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
    if (isDragging) {
      console.log("🛑 Drag ended");
    }
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
  const userNameChange = (newUserName: string) => { 
    console.log("👤 userNameChange called:", newUserName);
    setUserName(newUserName);
    
    // Si on est déjà dans une réunion, rejoindre avec le nouveau nom
    if (isInMeeting && roomName) {
      console.log("🔄 Reconnexion avec le nouveau nom...");
      hasJoinedRef.current = false;
      setTimeout(() => {
        joinRoom(roomName);
      }, 100);
    }
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
    console.log(" roomName changed:", roomName, "- Current:", currentRoomRef.current);
    
    if (roomName && roomName !== "") {
      if (currentRoomRef.current !== roomName) {
        joinRoom(roomName);
      }
    } else {
      if (currentRoomRef.current !== "") {
        leaveRoom();
      }
    }
  }, [roomName]);

  useEffect(() => {
    if (userNameProp && userNameProp !== userName) {
      console.log("👤 userName updated from prop:", userNameProp);
      setUserName(userNameProp);
    }
  }, [userNameProp]);

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
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        onMouseDown={handleDragMouseDown}
        style={{
          height: '40px',
          backgroundColor: '#1f2937',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10003
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          BBB Meeting
        </div>
        
        {/* Bouton fermer */}
        <button
          onClick={leaveRoom}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* IFRAME BBB */}
      <iframe
        src={bbbUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        style={{
          width: '100%',
          flex: 1,
          border: 'none',
          display: 'block'
        }}
        title="BigBlueButton Meeting"
      />

      {/* Poignée de redimensionnement - EN BAS À DROITE */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
          width: '40px',
          height: '40px',
          cursor: 'nwse-resize',
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderTopLeftRadius: '8px',
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </div>
    </div>
  );
});

export default BBBWrapper;