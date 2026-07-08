import React, { useState } from "react";
import { Mic, ArrowLeft, Sparkles } from "lucide-react";
import { GeneratedPanel } from "@/types";
import ScriptDramatizerForm from "./ScriptDramatizerForm.js";
import VoiceSettingsPanel from "./VoiceSettingsPanel.js";

interface VoiceStudioPageProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  scrapedGenre?: string;
}

const VoiceStudioPage = React.memo(
  ({
    panels,
    setPanels,
    onNavigateHome,
    addNotification,
    scrapedGenre,
  }: VoiceStudioPageProps) => {

    const [activeTab, setActiveTab] = useState<"dramatize" | "cast">(
      "dramatize"
    );

    return (
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">

        {/* TABS SELECTOR */}

        <div className="flex border-b border-neutral-800 overflow-x-auto scrollbar-none font-mono">
          <button
            onClick={() => setActiveTab("dramatize")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "dramatize"
                ? "border-purple-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-250"
            }`}
          >
            ✦ Dialogue Dramatizer
          </button>
          <button
            onClick={() => setActiveTab("cast")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "cast"
                ? "border-purple-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-250"
            }`}
          >
            ✦ Voice Casting Match
          </button>
        </div>

        {/* ACTIVE VIEW */}
        <div className="space-y-4">
          {activeTab === "dramatize" && (
            <ScriptDramatizerForm
              panels={panels}
              setPanels={setPanels}
              addNotification={addNotification}
              scrapedGenre={scrapedGenre}
            />
          )}
          {activeTab === "cast" && (
            <VoiceSettingsPanel addNotification={addNotification} />
          )}
        </div>
      </div>
    );
  }
);

export default VoiceStudioPage;
