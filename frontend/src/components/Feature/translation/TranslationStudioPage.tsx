import React from "react";
import { Globe, Sparkles, ArrowLeft } from "lucide-react";
import { GeneratedPanel } from "@/types";
import TimelineScriptTable from "./TimelineScriptTable.js";
import BulkScrubberControl from "./BulkScrubberControl.js";

interface TranslationStudioPageProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

const TranslationStudioPage = React.memo(
  ({
    panels,
    setPanels,
    onNavigateHome,
    addNotification,
  }: TranslationStudioPageProps) => {
    if (panels.length === 0) {
      return (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <Globe className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to start translating dialogues.
          </p>
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
);

export default TranslationStudioPage;
