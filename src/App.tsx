import UnityGame from './components/UnityGame/UnityGame'
import Footer from './components/Footer'
import { useRef, useState, useCallback } from 'react'

function App() {
  const jitsiRef = useRef<any>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Conference URL that can be set from the web side (optional)
  // If not set, Unity will provide the URL instead
  const [conferenceUrl, setConferenceUrl] = useState<string>("");

  // Fonction à passer à UnityGame pour changer de salle
  const handleChangeRoom = useCallback((newRoom: string) => {
    setRoomName(newRoom);
    console.log("App: Room changed to:", newRoom);
  }, []);

  const handleChangeUserName = useCallback((newUserName: string) => {
    setUserName(newUserName);
    console.log("UserName Change ! " + newUserName);
    jitsiRef.current?.userNameChange(newUserName);
  }, []);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 relative bg-gray-100">
            <UnityGame 
              onChangeJitsiRoom={handleChangeRoom}
              conferenceUrl={"https://stream.warlockproduction.fr/hls/live/mamvirtuelle/index.m3u8"}
              bbbRef={jitsiRef}
              userName={userName}
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