import React from "react";
import { Headphones, Sparkles, ArrowLeft } from "lucide-react";
import { GeneratedPanel } from "@/types";
import SfxOverlayMixer from "./SfxOverlayMixer.js";
import AmbientSoundPicker from "./AmbientSoundPicker.js";

interface AudioLabPageProps {
  panels: GeneratedPanel[];
  setMusicTheme: (val: string) => void;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

const AudioLabPage = React.memo(
  ({
    panels,
    setMusicTheme,
    onNavigateHome,
    addNotification,
  }: AudioLabPageProps) => {
    if (panels.length === 0) {
      return (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <Headphones className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to start sound design mixing.
          </p>
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

        {/* Background loop matcher */}

        <AmbientSoundPicker onSelectMusicTheme={handleSelectMusicTheme} />

        {/* Sound overlay scheduler */}
        <SfxOverlayMixer panels={panels} />
      </div>
    );
  }
);

export default AudioLabPage;
