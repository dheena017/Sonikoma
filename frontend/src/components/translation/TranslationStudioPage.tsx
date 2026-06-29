import React from "react";
import { Globe, Sparkles } from "lucide-react";
import { GeneratedPanel } from "../../types";
import TimelineScriptTable from "./TimelineScriptTable.js";
import BulkScrubberControl from "./BulkScrubberControl.js";

interface TranslationStudioPageProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

const TranslationStudioPage = React.memo(({
  panels,
  setPanels,
  onNavigateHome,
  addNotification,
}: TranslationStudioPageProps) => {
  if (panels.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[60vh] max-w-xl mx-auto space-y-5 animate-fade-in">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-650 to-indigo-650 flex items-center justify-center shadow-lg shadow-purple-950/40">
          <Sparkles className="h-8 w-8 text-white animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Translation Studio Locked
          </h3>
          <p className="text-xs text-neutral-400 font-mono leading-relaxed max-w-sm">
            This module provides bulk compliance scanning, multi-language
            dialogue localization, and script scrubber controls for active
            timelines.
          </p>
        </div>
        <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-900 text-left text-[11px] text-neutral-500 font-mono space-y-1.5 w-full">
          <div className="text-neutral-400 font-bold mb-1">
            💡 How to unlock:
          </div>
          <div>1. Go to the main Workspace</div>
          <div>2. Enter a Webtoon URL to import image strips</div>
          <div>3. Slice the strips into timeline panels</div>
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
  const handleUpdatePanelText = (id: number, val: string) => {
    const words = val.trim().split(/\s+/).filter(Boolean).length;
    const newDuration = val.trim()
      ? Math.max(
          2.5,
          Math.min(12.0, parseFloat((words / 2.2 + 0.8).toFixed(1)))
        )
      : 3.0;

    setPanels((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, speech_text: val, duration: newDuration } : p
      )
    );
  };

  const handleApplyCleanScripts = (mappings: Record<number, string>) => {
    setPanels((prev) =>
      prev.map((p) => {
        if (mappings[p.id] !== undefined) {
          const val = mappings[p.id];
          const words = val.trim().split(/\s+/).filter(Boolean).length;
          const newDuration = val.trim()
            ? Math.max(
                2.5,
                Math.min(12.0, parseFloat((words / 2.2 + 0.8).toFixed(1)))
              )
            : 3.0;
          return { ...p, speech_text: val, duration: newDuration };
        }
        return p;
      })
    );
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            Translation Studio & Script Editor
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Manage translations, sanitize dialogues, and scrub scripts in bulk
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-850 cursor-pointer"
        >
          ← Dashboard
        </button>
      </div>

      {/* Bulk Scrubber */}
      <BulkScrubberControl
        panels={panels}
        onApplyCleanScripts={handleApplyCleanScripts}
        addNotification={addNotification}
      />

      {/* Script Table */}
      <TimelineScriptTable
        panels={panels}
        onUpdatePanelText={handleUpdatePanelText}
      />
    </div>
  );
});

export default TranslationStudioPage;
