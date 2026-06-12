import React from "react";
import { Headphones } from "lucide-react";
import { GeneratedPanel } from "../../types";
import SfxOverlayMixer from "./SfxOverlayMixer.js";
import AmbientSoundPicker from "./AmbientSoundPicker.js";

interface AudioLabPageProps {
  panels: GeneratedPanel[];
  setMusicTheme: (val: string) => void;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function AudioLabPage({
  panels,
  setMusicTheme,
  onNavigateHome,
  addNotification
}: AudioLabPageProps) {

  const handleSelectMusicTheme = (theme: string) => {
    setMusicTheme(theme);
    if (addNotification) {
      addNotification(`Applied soundtrack theme: "${theme}"`, "success");
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Headphones className="h-5 w-5 text-purple-400" />
            AI Audio Production & Mixing Lab
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Coordinate sound effects overlays, ambient loops, and relative volume mixes
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-850 cursor-pointer"
        >
          ← Dashboard
        </button>
      </div>

      {/* Background loop matcher */}
      <AmbientSoundPicker onSelectMusicTheme={handleSelectMusicTheme} />

      {/* Sound overlay scheduler */}
      <SfxOverlayMixer panels={panels} />
    </div>
  );
}
