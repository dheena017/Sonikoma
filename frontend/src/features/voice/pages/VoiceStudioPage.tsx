import React, { useState } from "react";
import { Mic, ArrowLeft, Sparkles } from "lucide-react";
import { GeneratedPanel } from "@/types";
import ScriptDramatizerForm from "@/features/voice/components/ScriptDramatizerForm";
import VoiceSettingsPanel from "@/features/voice/components/VoiceSettingsPanel";

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

    if (panels.length === 0) {
      return (
        <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <Mic className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to start voice dramaturgy.
          </p>
        </div>
      );
    }


    return (
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-[#1f1b2e] bg-[#09080e] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b172b] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#181229] border border-purple-500/30 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/50">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  AUDIO PRODUCTION
                </span>
                <span className="text-xs text-neutral-400 font-mono">• {panels.length} panels for TTS</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Voice Studio
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Character voice actor casting, script dramatization, emotional inflection, and neural audio synthesis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-full bg-[#12101d] border border-[#231e38] text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              <span>Genre: {scrapedGenre || "Fantasy Action"}</span>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-[#1b172b] overflow-x-auto scrollbar-none font-mono">
          <button
            onClick={() => setActiveTab("dramatize")}
            className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "dramatize"
                ? "border-purple-500 text-purple-300 bg-purple-500/10"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            ✦ Dialogue Dramatizer
          </button>
          <button
            onClick={() => setActiveTab("cast")}
            className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "cast"
                ? "border-purple-500 text-purple-300 bg-purple-500/10"
                : "border-transparent text-neutral-400 hover:text-white"
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
