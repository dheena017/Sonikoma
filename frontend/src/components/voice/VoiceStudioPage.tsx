import React, { useState } from "react";
import { Mic, ArrowLeft } from "lucide-react";
import { GeneratedPanel } from "../../types";
import ScriptDramatizerForm from "./ScriptDramatizerForm.js";
import VoiceSettingsPanel from "./VoiceSettingsPanel.js";

interface VoiceStudioPageProps {
  panels: GeneratedPanel[];
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function VoiceStudioPage({ panels, onNavigateHome, addNotification }: VoiceStudioPageProps) {
  const [activeTab, setActiveTab] = useState<"dramatize" | "cast">("dramatize");

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Mic className="h-5 w-5 text-purple-400" />
            AI Voice Casting & Script Studio
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Dramatize dialogues and cast the perfect voice actors for your narration
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-855 cursor-pointer"
        >
          ← Dashboard
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
          <ScriptDramatizerForm panels={panels} />
        )}
        {activeTab === "cast" && (
          <VoiceSettingsPanel addNotification={addNotification} />
        )}
      </div>
    </div>
  );
}
