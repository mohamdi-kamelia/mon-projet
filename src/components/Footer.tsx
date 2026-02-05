import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Mic, MicOff, Camera, CameraOff, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { NameModal } from "./NameModal";

type Device = {
  deviceId: string;
  label: string;
};

function Footer({
  onMute,
  onVideo,
  onScreenShare,
  OnAudioInputChange,
  OnVideoInputChange,
  OnUserNameChange,
  onGetApi,
  onForceJoin,
  onForceQuit,
  userName,
}: {
  onMute: () => boolean;
  onVideo: () => boolean;
  onScreenShare: () => void;
  OnAudioInputChange: (deviceName: string) => void;
  OnVideoInputChange: (deviceName: string) => void;
  OnUserNameChange: (newUserName: string) => void;
  onGetApi: () => void;
  onForceJoin: () => void;
  onForceQuit: () => void;
  userName?: string;
}) {
  const [audioInputDevices, setAudioInputDevices] = useState<Device[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<Device[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("default");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("default");

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraMuted, setIsCameraOn] = useState(true);

  useEffect(() => {
    const loadDevices = async () => {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();

      setAudioInputDevices(
        devices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || "Micro inconnu",
          }))
      );
      setVideoInputDevices(
        devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || "Camera inconnue",
          }))
      );
    };

    loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, []);

  useEffect(() => {
    if (audioInputDevices.length > 0) {
      handleAudioChange(audioInputDevices.find((d) => d.deviceId === "default")?.label ||audioInputDevices[0].label);
    }
  }, [audioInputDevices]);

  useEffect(() => {
    if (videoInputDevices.length > 0) {
      handleVideoChange(videoInputDevices[0].label);
    }
   }, [videoInputDevices]);

  const toggleMute = ({ _isMuted }: { _isMuted: boolean }) => {
    setIsMuted(_isMuted);
    console.log(isMuted);
  };

  const toggleCamera = ({ _isMuted }: { _isMuted: boolean }) => {
    setIsCameraOn(_isMuted);
  };

  const handleAudioChange = (deviceName: string) => {
    setSelectedAudioInput(deviceName);
    OnAudioInputChange(deviceName);
    console.log("Audio : " + deviceName);
  };

  const handleVideoChange = (deviceName: string) => {
    setSelectedVideoInput(deviceName);
    OnVideoInputChange(deviceName);
    console.log("Video : " + deviceName);
  };

  return (
    <div className="h-15 flex p-2">
      <NameModal userName={userName != null ? userName : ""} onUserNameChange={OnUserNameChange} />


      <div className="flex px-3">
        <div className="flex h-full px-2 mx-2 ">
          <Button
            onClick={() => {
              toggleMute({ _isMuted: onMute() });
            }}
            variant="secondary"
            className={`rounded-r-none h-full ${isMuted ? "bg-MainPinkMAM" : "bg-MainGreenMAM"}`}
          >
            {isMuted ? (<MicOff className="w-5 h-5" />) : (<Mic className="w-5 h-5" />)}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="secondary"
                className={`rounded-l-none h-full ${isMuted ? "bg-MainPinkMAM" : "bg-MainGreenMAM"}`}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={selectedAudioInput}>
                {audioInputDevices.map((d) => (
                  <DropdownMenuRadioItem
                    value={d.label}
                    key={d.deviceId}
                    onClick={() => handleAudioChange(d.label)}
                  >
                    {d.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex h-full px-2 mx-2">
          <Button
            onClick={() => {
              toggleCamera({ _isMuted: onVideo() });
            }}
            variant="secondary"
            className={`rounded-r-none h-full ${isCameraMuted ? "bg-MainPinkMAM" : "bg-MainGreenMAM"}`}
          >
            {isCameraMuted ? (<CameraOff className="w-5 h-5" />) : (<Camera className="w-5 h-5" />)}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="secondary"
                className={`rounded-l-none h-full ${isCameraMuted ? "bg-MainPinkMAM" : "bg-MainGreenMAM"}`}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuRadioGroup value={selectedVideoInput}>
                    {videoInputDevices.map((d) => (
                        <DropdownMenuRadioItem
                        value={d.label}
                        key={d.deviceId}
                        onClick={() => handleVideoChange(d.label)}
                        >
                        {d.label}
                        </DropdownMenuRadioItem>
                    ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          className="h-full px-2 mx-2 bg-MainGreenMAM"
          onClick={onScreenShare}
        >
          Partage
        </Button>


      </div>
    </div>
  );
}
export default Footer;
