import { useRef, useEffect,useState } from "react";
import ReactPlayer from "react-player";



function VideoPlayer({url} : {url : string}) {
  const playerRef = useRef<ReactPlayer | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [triedWithSound, setTriedWithSound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkLive() {
      try {
        const res = await fetch("https://stream.warlockproduction.fr/api/v3/paths/get/live/mamvirtuelle", { method: 'GET', cache: 'no-store' });
        const ok = true //res.ok;
        if (!cancelled) {
          if (ok && !isLive) {
            setTimeout(() => {
              setIsLive(ok); 
            }, 2000); 
          }
          else if (!ok) {
            setIsLive(ok);
          }
        }
      } catch (e) {
        if (!cancelled) setIsLive(false);
      }
    }
    checkLive();
    const id = setInterval(checkLive, 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    console.log("Live is " + (isLive ? "ON" : "OFF"));

  }, [isLive]);

  const handleError = () => {
    console.log("VideoPlayer: error detected");
    if (!triedWithSound) {
      setTriedWithSound(true);
      setMuted(true);       
      return;
    }
    setIsLive(false);      // stop trying
  };



  return (
     <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Poster quand pas de live */}
        {!isLive && (
          <img
            src={"images/waiting.jpg"}
            alt="Live hors ligne"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1,
            }}
          />
        )}
        {isLive && (
        <ReactPlayer
          ref={playerRef}
          src={url}
          width="100%"
          height="100%"
          playing={isLive} 
          muted={muted} 
          autoPlay={true}
          controls

          onError={handleError}
          onEnded={()=>console.log("onEnded ...")}
          onSeeked={()=>console.log("onSeeked ...")}
          onSeeking={()=>console.log("onSeeking ...")}
          onWaiting={()=>console.log("onWaiting ...")}
          onProgress={()=>console.log("onProgress ...")}
        />
        )}
      </div>

  );
}

export default VideoPlayer;
