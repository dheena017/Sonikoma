import React from "react";
import { Globe, Sparkles, ArrowLeft } from "lucide-react";
import { GeneratedPanel } from "@/types";
import TimelineScriptTable from "@/features/ai_translation/components/TimelineScriptTable";
import BulkScrubberControl from "@/features/ai_translation/components/BulkScrubberControl";

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
        <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
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
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-white/10 bg-[#0b0b0e] p-5 sm:p-7 shadow-2xl">
        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-850 pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/30">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  CONTEXT &amp; SCRIPT
                </span>
                <span className="text-xs text-neutral-400 font-mono">• {panels.length} panels for localization</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Translation Studio
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Bulk AI script scrubbing, webtoon dialogue cleanup, language localization, and subtitle synchronization.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-full bg-neutral-950 border border-neutral-850 text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Multi-Language Ready</span>
            </div>
          </div>
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
);

export default TranslationStudioPage;
