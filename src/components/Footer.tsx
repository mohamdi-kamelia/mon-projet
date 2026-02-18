import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Mic, MicOff, Camera, CameraOff, ChevronUp, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

type Device = { deviceId: string; label: string };

type UserStatus = "online" | "away" | "dnd";

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
  online: { label: "En ligne",        color: "bg-green-400"  },
  away:   { label: "Absent",          color: "bg-yellow-400" },
  dnd:    { label: "Ne pas dÃ©ranger", color: "bg-red-500"    },
};

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
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [status, setStatus] = useState<UserStatus>("online");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDevices = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) return;
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputDevices(devices.filter(d => d.kind === "audioinput").map(d => ({ deviceId: d.deviceId, label: d.label || "Micro inconnu" })));
        setVideoInputDevices(devices.filter(d => d.kind === "videoinput").map(d => ({ deviceId: d.deviceId, label: d.label || "CamÃ©ra inconnue" })));
      } catch (err) {
        console.error("PÃ©riphÃ©riques inaccessibles :", err);
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
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleMic    = () => setIsMuted(onMute());
  const handleToggleCamera = () => setIsCameraOff(onVideo());

  const displayName   = userName || "Utilisateur";
  const currentStatus = STATUS_CONFIG[status];

  return (
    <div className="h-14 flex items-center justify-between px-4 bg-gray-900 border-t border-white/5">

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => { setUserMenuOpen(v => !v); setStatusMenuOpen(false); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors group"
        >
     
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold select-none">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${currentStatus.color}`} />
          </div>

          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
              {displayName}
            </span>
            <span className="text-xs text-gray-400">{userEmail}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-52 bg-gray-800 border border-white/10 rounded-xl shadow-2xl z-50">

            <div className="px-2 pt-2">
              <button
                onClick={() => setStatusMenuOpen(v => !v)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${currentStatus.color}`} />
                <span className="flex-1 text-left">{currentStatus.label}</span>
                <ChevronRight className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${statusMenuOpen ? "rotate-90" : ""}`} />
              </button>

              {/* Sous-menu statuts */}
              {statusMenuOpen && (
                <div className="ml-3 mt-1 mb-1 border-l-2 border-white/10 pl-2 flex flex-col gap-0.5">
                  {(["online", "away", "dnd"] as UserStatus[]).map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => { setStatus(s); setStatusMenuOpen(false); setUserMenuOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          status === s ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.color}`} />
                        {cfg.label}
                        {status === s && <span className="ml-auto text-indigo-400 text-xs">âœ“</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-2 py-1.5 mt-1">
              <button
                onClick={() => { onLogout(); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                DÃ©connexion
              </button>
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€ Droite : micro + camÃ©ra â”€â”€ */}
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
                  ? <DropdownMenuRadioItem value="none" disabled>Aucun pÃ©riphÃ©rique</DropdownMenuRadioItem>
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

        {/* CamÃ©ra */}
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          <button
            onClick={handleToggleCamera}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
              isCameraOff ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/5 text-green-400 hover:bg-white/10"
            }`}
          >
            {isCameraOff ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span className="text-xs hidden sm:inline">{isCameraOff ? "CamÃ©ra off" : "CamÃ©ra"}</span>
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
                  ? <DropdownMenuRadioItem value="none" disabled>Aucun pÃ©riphÃ©rique</DropdownMenuRadioItem>
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
    </div>
  );
}

export default Footer;