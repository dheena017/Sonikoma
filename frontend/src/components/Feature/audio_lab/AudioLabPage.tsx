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
