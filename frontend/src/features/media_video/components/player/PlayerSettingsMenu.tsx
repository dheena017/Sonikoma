import React from "react";
import { X } from "lucide-react";

interface PlayerSettingsMenuProps {
  show: boolean;
  onClose: () => void;
  isLooping: boolean;
  setIsLooping: (val: boolean) => void;
  cinematicBars: boolean;
  setCinematicBars: (val: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (val: number) => void;
  subtitleSize: "small" | "normal" | "large";
  setSubtitleSize: (val: "small" | "normal" | "large") => void;
  videoQuality: string;
  setVideoQuality: (val: string) => void;
  subtitlesStyle: string;
  setSubtitlesStyle: (val: string) => void;
  baseSpeedRef: React.MutableRefObject<number>;
}

export const PlayerSettingsMenu: React.FC<PlayerSettingsMenuProps> = ({
  show,
  onClose,
  isLooping,
  setIsLooping,
  cinematicBars,
  setCinematicBars,
  playbackSpeed,
  setPlaybackSpeed,
  subtitleSize,
  setSubtitleSize,
  videoQuality,
  setVideoQuality,
  subtitlesStyle,
  setSubtitlesStyle,
  baseSpeedRef,
}) => {
  if (!show) return null;

  return (
    <div className="absolute bottom-20 right-6 bg-neutral-950/98 border border-neutral-800/85 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md w-60 flex flex-col gap-2.5 z-50 animate-fade-in pointer-events-auto">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-black block">
          Player Settings
        </span>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400">
        {/* Loop Toggle */}
        <div className="flex flex-col gap-1 bg-neutral-900/60 p-2 rounded-lg border border-white/5">
          <span className="font-bold text-[9px] uppercase text-neutral-500">Loop</span>
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`py-1 rounded text-[9px] font-bold border transition-all ${
              isLooping
                ? "bg-purple-950/40 border-purple-800/40 text-purple-400"
                : "bg-neutral-950 border-neutral-800 text-neutral-500"
            }`}
          >
            {isLooping ? "ON" : "OFF"}
          </button>
        </div>

        {/* Widescreen bars */}
        <div className="flex flex-col gap-1 bg-neutral-900/60 p-2 rounded-lg border border-white/5">
          <span className="font-bold text-[9px] uppercase text-neutral-500">Widescreen</span>
          <button
            onClick={() => setCinematicBars(!cinematicBars)}
            className={`py-1 rounded text-[9px] font-bold border transition-all ${
              cinematicBars
                ? "bg-purple-950/40 border-purple-800/40 text-purple-400"
                : "bg-neutral-950 border-neutral-800 text-neutral-500"
            }`}
          >
            {cinematicBars ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Selects */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-neutral-400 font-bold font-mono">Speed</span>
          <select
            value={playbackSpeed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setPlaybackSpeed(val);
              baseSpeedRef.current = val;
            }}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-[10px] text-neutral-300 focus:outline-none cursor-pointer font-sans"
          >
            <option value="0.5">0.5x</option>
            <option value="1.0">Normal</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2.0x</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-neutral-400 font-bold font-mono">Sub Size</span>
          <select
            value={subtitleSize}
            onChange={(e) => setSubtitleSize(e.target.value as any)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-[10px] text-neutral-300 focus:outline-none cursor-pointer font-sans"
          >
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-neutral-400 font-bold font-mono">Quality</span>
          <select
            value={videoQuality}
            onChange={(e) => setVideoQuality(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-[10px] text-neutral-300 focus:outline-none cursor-pointer font-sans"
          >
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-neutral-400 font-bold font-mono">Sub Format</span>
          <select
            value={subtitlesStyle}
            onChange={(e) => setSubtitlesStyle(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-[10px] text-neutral-300 focus:outline-none cursor-pointer font-sans"
          >
            <option value="classic">Classic</option>
            <option value="karaoke">Comic</option>
          </select>
        </div>
      </div>
    </div>
  );
};
