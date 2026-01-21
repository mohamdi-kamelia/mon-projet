import UnityGame from '@/components/UnityGame/UnityGame'
import Footer from './components/Footer'
import { useRef, useState, useCallback, useEffect } from 'react'
//import JitsiWrapper from './hooks/Jitsi';
import BBBWrapper from './components/UnityGame/components/BBB';



function App() {

  const jitsiRef = useRef<any>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Conference URL that can be set from the web side (optional)
  // If not set, Unity will provide the URL instead
  const [conferenceUrl, setConferenceUrl] = useState<string>("");


  // Fonction à passer à UnityGame pour changer de salle
  const handleChangeRoom = useCallback((newRoom: string) => {
    setRoomName(newRoom)
  }, [])

  const handleChangeUserName = useCallback((newUserName: string) => {
    setUserName(newUserName);
    console.log("UserName Change ! " + newUserName);
    jitsiRef.current?.userNameChange(newUserName);

  }, [])

  useEffect(() => {
    console.log(roomName);
  }, [roomName, userName])

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-1 min-h-0">
          {/* Panneau BBB à gauche - LARGEUR FIXE */}
          <div className="w-80 bg-gray-800 text-white p-4 flex-shrink-0">
            <h1 className="text-xl font-bold mb-4">Conversation</h1>
            <BBBWrapper ref={jitsiRef} roomName={roomName} />
          </div> 

          {/* Unity à droite - PREND TOUTE LA LARGEUR RESTANTE */}
          <div className="flex-1 min-w-0 relative bg-gray-100">
            <UnityGame 
              onChangeJitsiRoom={handleChangeRoom}
              conferenceUrl={"https://stream.warlockproduction.fr/hls/live/mamvirtuelle/index.m3u8"}
            />
          </div>
        </div>

        {/* Footer en bas */}
        <footer className="w-full bg-gray-900 text-white flex-shrink-0">
          <Footer
            onMute={() => { return jitsiRef.current?.toggleAudio() }}
            onVideo={() => { return jitsiRef.current?.toggleVideo() }}
            onScreenShare={() => jitsiRef.current?.toggleShareScreen()}
            OnAudioInputChange={(deviceName: string) => jitsiRef.current?.setAudioInput(deviceName)}
            OnVideoInputChange={(deviceName: string) => jitsiRef.current?.setVideoInput(deviceName)}
            OnUserNameChange={handleChangeUserName}
            onGetApi={() => { return jitsiRef.current?.getApi() }}

            userName={userName}

            onForceJoin={() => handleChangeRoom("test" + Date.now())}
            onForceQuit={() => jitsiRef.current?.leaveRoom()}
          />
        </footer> 
      </div>
    </>
  )
}

export default App