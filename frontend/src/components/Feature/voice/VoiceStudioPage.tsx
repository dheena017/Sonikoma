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
    if (panels.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[60vh] max-w-xl mx-auto space-y-5 animate-fade-in">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-650 to-indigo-650 flex items-center justify-center shadow-lg shadow-purple-950/40">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Voice Studio Locked
            </h3>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed max-w-sm">
              This module generates voice transcripts, matches audio guidelines,
              and casts voices for active timeline dialogue.
            </p>
          </div>
          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-900 text-left text-[11px] text-neutral-500 font-mono space-y-1.5 w-full">
            <div className="text-neutral-400 font-bold mb-1">
              💡 How to unlock:
            </div>
            <div>1. Go to the main Workspace</div>
            <div>2. Enter a link to import images</div>
            <div>3. Add the images to the timeline</div>
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
    const [activeTab, setActiveTab] = useState<"dramatize" | "cast">(
      "dramatize"
    );

    return (
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={onNavigateHome}
              >
                Dashboard
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">Voice Studio</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="icon-pill icon-pill--purple">
                <Mic className="h-5 w-5" />
              </div>
              Voice & Text Studio
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Dramatize dialogues and cast the perfect voice actors for your narration
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </button>
        </div>

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
