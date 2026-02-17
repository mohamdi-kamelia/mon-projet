import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Mic, MicOff, Camera, CameraOff, ChevronUp, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

type Device = { deviceId: string; label: string };

interface FooterProps {
  onMute: () => boolean;
  onVideo: () => boolean;
  OnUserNameChange: (newUserName: string) => void;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

function Footer({ onMute, onVideo, OnUserNameChange, userName, userEmail, onLogout }: FooterProps) {
  const [audioInputDevices, setAudioInputDevices] = useState<Device[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<Device[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState("default");
  const [selectedVideoInput, setSelectedVideoInput] = useState("default");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDevices = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) return;
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputDevices(devices.filter(d => d.kind === "audioinput").map(d => ({ deviceId: d.deviceId, label: d.label || "Micro inconnu" })));
        setVideoInputDevices(devices.filter(d => d.kind === "videoinput").map(d => ({ deviceId: d.deviceId, label: d.label || "Caméra inconnue" })));
      } catch (err) {
        console.error("Périphériques inaccessibles :", err);
      }
    };
    loadDevices();
    if (navigator?.mediaDevices) {
      navigator.mediaDevices.addEventListener("devicechange", loadDevices);
      return () => navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    }
  }, []);

  useEffect(() => {
    if (audioInputDevices.length > 0) setSelectedAudioInput(audioInputDevices[0].label);
  }, [audioInputDevices]);

  useEffect(() => {
    if (videoInputDevices.length > 0) setSelectedVideoInput(videoInputDevices[0].label);
  }, [videoInputDevices]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleMic = () => setIsMuted(onMute());
  const handleToggleCamera = () => setIsCameraOff(onVideo());

  const displayName = userName || "Utilisateur";

  return (
    <div className="h-14 flex items-center justify-between px-4 bg-gray-900 border-t border-white/5">

      {/* ── Gauche : nom + email cliquables ── */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors group"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
              {displayName}
            </span>
            <span className="text-xs text-gray-400">{userEmail}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Menu déroulant vers le haut */}
        {userMenuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-52 bg-gray-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="border-t border-white/10 px-2 py-1.5">
              <button
                onClick={() => { onLogout(); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Centre : micro + caméra ── */}
      <div className="flex items-center gap-2">

        {/* Micro */}
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          <button
            onClick={handleToggleMic}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
              isMuted ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/5 text-green-400 hover:bg-white/10"
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="text-xs hidden sm:inline">{isMuted ? "Muet" : "Micro"}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`px-1.5 border-l transition-colors ${
                isMuted ? "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
              }`}>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-white/10 text-white">
              <DropdownMenuRadioGroup value={selectedAudioInput}>
                {audioInputDevices.length === 0
                  ? <DropdownMenuRadioItem value="none" disabled>Aucun périphérique</DropdownMenuRadioItem>
                  : audioInputDevices.map(d => (
                    <DropdownMenuRadioItem key={d.deviceId} value={d.label} onClick={() => setSelectedAudioInput(d.label)}>
                      {d.label}
                    </DropdownMenuRadioItem>
                  ))
                }
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Caméra */}
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          <button
            onClick={handleToggleCamera}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
              isCameraOff ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/5 text-green-400 hover:bg-white/10"
            }`}
          >
            {isCameraOff ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span className="text-xs hidden sm:inline">{isCameraOff ? "Caméra off" : "Caméra"}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`px-1.5 border-l transition-colors ${
                isCameraOff ? "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
              }`}>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-white/10 text-white">
              <DropdownMenuRadioGroup value={selectedVideoInput}>
                {videoInputDevices.length === 0
                  ? <DropdownMenuRadioItem value="none" disabled>Aucun périphérique</DropdownMenuRadioItem>
                  : videoInputDevices.map(d => (
                    <DropdownMenuRadioItem key={d.deviceId} value={d.label} onClick={() => setSelectedVideoInput(d.label)}>
                      {d.label}
                    </DropdownMenuRadioItem>
                  ))
                }
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Droite : indicateur en ligne ── */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80] animate-pulse" />
        <span className="text-xs text-gray-500 hidden sm:inline">En ligne</span>
      </div>

    </div>
  );
}

export default Footer;