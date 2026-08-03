import React, { useState, useRef, useEffect } from "react";
import { Sparkles, BookOpenText, ChevronLeft, ChevronRight, Languages } from "lucide-react";
import { GeneratedPanel } from "@/types";

import PanelTranslationTool from "@/features/panel_assistant/components/PanelTranslationTool";

interface PanelAssistantPageProps {
  panels?: GeneratedPanel[];
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome?: () => void;
  addNotification?: (msg: string, type: any) => void;
}

const PanelAssistantPage = React.memo(
  ({
    panels = [],
    setPanels = () => {},
    onNavigateHome = () => {},
    addNotification,
  }: PanelAssistantPageProps) => {
    const safePanels = Array.isArray(panels) ? panels : [];
    const [selectedIdx, setSelectedIdx] = useState(0);

    const filmstripRef = useRef<HTMLDivElement>(null);

    const scrollFilmstrip = (direction: "left" | "right") => {
      if (filmstripRef.current) {
        const scrollAmount = direction === "left" ? -240 : 240;
        filmstripRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    };

    // Sync index from URL query param if present
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const idxVal = params.get("idx");
      if (idxVal !== null) {
        const parsed = parseInt(idxVal, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < safePanels.length) {
          setSelectedIdx(parsed);
        }
      }
    }, [safePanels.length]);

    if (safePanels.length === 0) {
      return (
        <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <Sparkles className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to start editing.
          </p>
        </div>
      );
    }

    const activePanel = safePanels[selectedIdx] || ({} as GeneratedPanel);

    const handleUpdateDialogue = (val: string) => {
      if (typeof setPanels === "function") {
        setPanels((prev) =>
          (prev || []).map((p, idx) =>
            idx === selectedIdx ? { ...p, speech_text: val } : p
          )
        );
      }
    };

    return (
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-[#1f1b2e] bg-[#09080e] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b172b] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#181229] border border-purple-500/30 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/50">
              <Languages className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  VISUAL STUDIO • TRANSLATION
                </span>
                <span className="text-xs text-purple-400 font-mono">• Panel #{selectedIdx + 1} Selected</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Translation Studio
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Multi-language dialogue translator and narrative editor per comic panel frame.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-full bg-[#12101d] border border-[#231e38] text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Total Panels: {safePanels.length}</span>
            </div>
          </div>
        </div>

        {/* FILMSTRIP THUMBNAIL TRACK */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
              STORYBOARD TIMELINE ({safePanels.length} FRAMES)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => scrollFilmstrip("left")}
                className="p-1 rounded-lg border border-[#1f1b2e] bg-[#0c0a15] hover:bg-[#161224] text-neutral-400 hover:text-white transition-all cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollFilmstrip("right")}
                className="p-1 rounded-lg border border-[#1f1b2e] bg-[#0c0a15] hover:bg-[#161224] text-neutral-400 hover:text-white transition-all cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={filmstripRef}
            className="flex items-center gap-3 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-purple-900/50 scrollbar-track-transparent"
          >
            {safePanels.map((p, idx) => {
              const isSel = idx === selectedIdx;
              return (
                <button
                  key={p?.id || idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative flex-shrink-0 w-24 h-28 rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                    isSel
                      ? "border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105"
                      : "border-[#1e1a2e] opacity-60 hover:opacity-100 hover:border-purple-500/50"
                  }`}
                >
                  {p?.image_url ? (
                    <img
                      src={p.image_url}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0c0a15] flex items-center justify-center text-[10px] text-neutral-600 font-mono">
                      Panel #{idx + 1}
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-black/80 text-[8px] font-mono font-bold text-white px-1.5 py-0.5 rounded border border-white/10">
                    #{idx + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* TWO-COLUMN STUDIO WORKSPACE GRID (4 : 8) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* COLUMN 1 (LEFT - 4 COLS / 33% WIDTH): ACTIVE PANEL DETAILS */}
          <div className="lg:col-span-4 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-5 space-y-4 shadow-xl">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
              FRAME PREVIEW
            </span>
            <div className="h-56 sm:h-64 rounded-xl overflow-hidden border border-[#221d33] bg-[#06050a] flex items-center justify-center p-2 relative shadow-inner">
              {activePanel?.image_url ? (
                <img
                  src={activePanel.image_url}
                  alt={`Panel #${activePanel.id || selectedIdx + 1}`}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-600">
                  <Sparkles className="w-8 h-8" />
                  <span className="text-[10px] font-mono">No image rendered</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold text-purple-300 border border-purple-500/20 shadow-md">
                PANEL #{activePanel?.id || selectedIdx + 1}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                SPEECH & DIALOGUE
              </span>
              <div className="p-3.5 bg-[#06050a] border border-[#1d182e] rounded-xl text-xs text-neutral-200 font-sans leading-relaxed min-h-[70px]">
                {activePanel?.speech_text || (
                  <span className="text-neutral-600 italic">No speech text recorded for this panel.</span>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2 (RIGHT - 8 COLS / 67% WIDTH): TRANSLATION WORKFLOW CANVAS */}
          <div className="lg:col-span-8 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-6 shadow-xl flex flex-col min-h-[480px]">
            <div className="flex items-center justify-between gap-3 border-b border-[#1b172b] pb-3 mb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                  ACTIVE WORKFLOW
                </p>
                <h4 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <BookOpenText className="w-4 h-4 text-purple-400" /> Translation & Localization Studio
                </h4>
                <p className="mt-0.5 text-xs text-neutral-400 font-mono">
                  Translate dialogue and narrative text to target languages with 1-click batch processing.
                </p>
              </div>
              <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-purple-300">
                PANEL #{selectedIdx + 1}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <PanelTranslationTool
                panel={activePanel}
                panels={safePanels}
                onUpdateDialogue={handleUpdateDialogue}
                addNotification={addNotification}
              />
            </div>
          </div>

        </div>
      </div>
    );
  }
);

export default PanelAssistantPage;
