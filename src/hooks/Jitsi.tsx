import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";

const JitsiWrapper = forwardRef(({ roomName } : {roomName : string}, ref) => {
  const jitsiContainerRef = useRef(null);
  let jitsiApi = useRef<any>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraMuted, setIsCameraMuted] = useState(true);

  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");

  const [userName, setUserName] = useState<string>("Guest");


  const joinRoom = (roomName : string) => {
    leaveRoom();

    if (roomName === "") {
      return;
    }

    const domain = "jitsi.atelier.ovh";
    const options = {
      roomName: roomName,
      width: "100%",
      height: "100%",
      parentNode: jitsiContainerRef.current,
      interfaceConfigOverwrite: {
        DISABLE_VIDEO_BACKGROUND: true,
        VERTICAL_FILMSTRIP: true,
        FILM_STRIP_ONLY: false,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
        MOBILE_APP_PROMO: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        
        SHOW_JITSI_WATERMARK: false,
      },
      configOverwrite: {
        startWithAudioMuted: isMuted,
        startWithVideoMuted: isCameraMuted,
        disableSimulcast: false,
        prejoinConfig: {
          enabled: false
        },
        filmstrip:{
          disabled: false
        },
        tileView: {
          disabled: false,
        },

        disabledNotifications: ['notify.newDeviceAudioTitle', 'notify.newDeviceVideoTitle'],      

        toolbarButtons:[
          'desktop',  'chat', 'settings', 'raisehand'
        ],

        defaultBackground: "transparent",
        backgroundAlpha:0,  

      },
      userInfo: {
        displayName: userName
      },
      devices: {
          audioInput: selectedAudioInput,
          videoInput: selectedVideoInput
      },
    };

    jitsiApi.current = new window.JitsiMeetExternalAPI(domain, options);
  }

  const leaveRoom = () => {
    if (jitsiApi.current) {
      jitsiApi.current.dispose();
      jitsiApi.current = null;
    }
  };

  // Contrôles Jitsi
  const toggleAudio = () => {
    jitsiApi.current?.executeCommand('toggleAudio');

    if (isMuted) {
      setIsMuted(false);
      return false;
      
    }else{
      setIsMuted(true);
      return true;
    }


  };
  const toggleVideo = () => {
    jitsiApi.current?.executeCommand('toggleVideo');

    if (isCameraMuted) {
      setIsCameraMuted(false);
      return false;
      
    }else{
      setIsCameraMuted(true);
      return true;
    }
  };
  const toggleShareScreen = () => {
    jitsiApi.current?.executeCommand('toggleShareScreen');
  };

  const setAudioInput = (deviceName: string) => {
    setSelectedAudioInput(deviceName);
    jitsiApi.current?.setAudioInputDevice(deviceName);
  }

  const setVideoInput = (deviceName : string) => {
    setSelectedVideoInput(deviceName);
    jitsiApi.current?.setVideoInputDevice(deviceName);
    console.log("Video input set to " + deviceName);
  }

  const userNameChange = (newUserName : string) => {
    setUserName(newUserName);
    jitsiApi.current?.executeCommand('displayName', newUserName);
  }

  useImperativeHandle(ref, () => ({
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    toggleShareScreen,
    setAudioInput,
    setVideoInput,
    userNameChange,
    getApi: () => jitsiApi.current,
  }));

  useEffect(() => {
    joinRoom(roomName);
    return () => {
      leaveRoom();
    };
  }, [roomName])

  return (
    <div
      className="pb-5"
      ref={jitsiContainerRef}
      style={{
        width: "100%",
        height: "100%",
        //pointerEvents: "none", // Pour laisser passer les clics si besoin
        zIndex: 50,
      }}
    />
  )
});

export default JitsiWrapper;