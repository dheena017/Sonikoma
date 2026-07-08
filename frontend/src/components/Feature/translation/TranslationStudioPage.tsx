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
