import React from "react";
import { Headphones, Sparkles } from "lucide-react";
import { GeneratedPanel } from "@/types";
import SfxOverlayMixer from "./SfxOverlayMixer.js";
import AmbientSoundPicker from "./AmbientSoundPicker.js";

interface AudioLabPageProps {
  panels: GeneratedPanel[];
  setMusicTheme: (val: string) => void;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

const AudioLabPage = React.memo(({
  panels,
  setMusicTheme,
  onNavigateHome,
  addNotification,
}: AudioLabPageProps) => {
  if (panels.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[60vh] max-w-xl mx-auto space-y-5 animate-fade-in">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-650 to-indigo-650 flex items-center justify-center shadow-lg shadow-purple-950/40">
          <Sparkles className="h-8 w-8 text-white animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white tracking-tight">
            AI Audio Lab Locked
          </h3>
          <p className="text-xs text-neutral-400 font-mono leading-relaxed max-w-sm">
            This module matches background music loops and coordinates
            customized sound effect overlays to active narrative storyboard
            panels.
          </p>
        </div>
        <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-900 text-left text-[11px] text-neutral-500 font-mono space-y-1.5 w-full">
          <div className="text-neutral-400 font-bold mb-1">
            💡 How to unlock:
          </div>
          <div>1. Go to the main Workspace</div>
          <div>2. Enter a Webtoon URL to scrape image strips</div>
          <div>3. Slice the strips into storyboard panels</div>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
        >
          Go to Workspace
        </button>
      </div>
    );
  }
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
            Coordinate sound effects overlays, ambient loops, and relative
            volume mixes
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
});

export default AudioLabPage;
