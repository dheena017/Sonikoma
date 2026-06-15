import React from "react";
import { Globe } from "lucide-react";
import { GeneratedPanel } from "../../types";
import TimelineScriptTable from "./TimelineScriptTable.js";
import BulkScrubberControl from "./BulkScrubberControl.js";

interface TranslationStudioPageProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function TranslationStudioPage({
  panels,
  setPanels,
  onNavigateHome,
  addNotification,
}: TranslationStudioPageProps) {
  const handleUpdatePanelText = (id: number, val: string) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, speech_text: val } : p))
    );
  };

  const handleApplyCleanScripts = (mappings: Record<number, string>) => {
    setPanels((prev) =>
      prev.map((p) =>
        mappings[p.id] !== undefined ? { ...p, speech_text: mappings[p.id] } : p
      )
    );
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            AI Translation Studio & Script Editor
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
}
