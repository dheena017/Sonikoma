import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Languages,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import { cleanDialogueDisplay } from "@/utils";

import PanelTranslationTool from "@/features/creative_panel_assistant/components/PanelTranslationTool";

import { useProjectStore } from "@/shared/hooks/useProjectStore";

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
    const activeProjectData = useProjectStore(
      (state) => state.activeProjectData
    );
    const storePanels = activeProjectData?.panels || [];
    const safePanels = (
      panels && panels.length > 0
        ? panels
        : Array.isArray(storePanels)
        ? storePanels
        : []
    ) as unknown as GeneratedPanel[];
    const [selectedIdx, setSelectedIdx] = useState(0);

    const filmstripRef = useRef<HTMLDivElement>(null);

    const scrollFilmstrip = (direction: "left" | "right") => {
      if (filmstripRef.current) {
        const scrollAmount = direction === "left" ? -240 : 240;
        filmstripRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
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

    const handleLoadDemoPanels = () => {
      if (typeof setPanels === "function") {
        setPanels([
          {
            id: 1,
            prompt: "Mystic runes glowing across the ancient temple chamber",
            duration: 3.5,
            speech_text: "The awakening of the ancient realm begins now.",
            visual_description:
              "Mystic runes glow across the temple chamber.",
            image_url: "",
            sfx: "Magic Hum",
            motion_type: "zoom_in",
          },
          {
            id: 2,
            prompt: "Warriors raising shields against approaching shadows",
            duration: 4.0,
            speech_text: "We must protect the artifact at all costs!",
            visual_description:
              "Warriors raise their shields as shadowy beasts approach.",
            image_url: "",
            sfx: "Shield Clang",
            motion_type: "pan_left",
          },
        ]);
        addNotification?.("Loaded demo panels for Translation Studio!", "success");
      }
    };

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
      <div className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 animate-fade-in text-left text-[#E5E5E5]">
        {/* ── MAIN COVER WRAPPER CARD ── */}
        <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
          {/* PAGE HERO HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2F2F2F] pb-6">
            <div className="space-y-2 max-w-2xl text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-[#E5E5E5] tracking-tight leading-tight">
                Translation{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#3B82F6]">
                  Studio
                </span>
              </h1>
              <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed">
                Multi-language dialogue translator and narrative editor per comic panel frame.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center">
              <div className="px-3.5 py-1.5 rounded-full bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <span>Total Panels: {safePanels.length}</span>
              </div>
            </div>
          </div>

          {safePanels.length === 0 ? (
            /* ── EMPTY STATE INSIDE COVER FRAME ── */
            <div className="p-10 sm:p-14 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] flex flex-col items-center justify-center text-center shadow-lg animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-[#121212] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] mb-4 shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#E5E5E5] font-sans tracking-tight mb-2">
                No Storyboard Panels Loaded
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-md mx-auto leading-relaxed mb-6 font-sans">
                Please import a series or add panels to your storyboard timeline to translate dialogue and narrative text.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onNavigateHome}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs"
                >
                  <span>Open Dashboard Projects</span>
                </button>
                <button
                  onClick={handleLoadDemoPanels}
                  className="btn-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Load Interactive Demo Panels</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TOP SECTION: HORIZONTAL PANEL CAROUSEL RIBBON */}
              <div className="relative flex items-center gap-4 bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-3 shadow-md">
          <button
            onClick={() => scrollFilmstrip("left")}
            className="p-2.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-[#3B82F6]/50 rounded-xl transition-all shrink-0 cursor-pointer mr-3 shadow-md"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={filmstripRef}
            className="flex items-center gap-3.5 overflow-x-auto py-1.5 scrollbar-none flex-1 scroll-smooth px-1"
          >
            {safePanels.map((p, idx) => {
              const isSel = idx === selectedIdx;
              return (
                <button
                  key={p?.id || idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer group bg-black/60 flex items-center justify-center ${
                    isSel
                      ? "border-2 border-[#3B82F6]  scale-105 bg-[#3B82F6]/10"
                      : "border-neutral-850 opacity-60 hover:opacity-100 hover:border-[#3B82F6]/50"
                  }`}
                >
                  {p?.image_url ? (
                    <img
                      src={p.image_url}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-950 flex items-center justify-center text-[10px] text-neutral-600 font-mono">
                      Panel #{idx + 1}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-neutral-300 border border-neutral-800">
                    #{idx + 1}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollFilmstrip("right")}
            className="p-2.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-[#3B82F6]/50 rounded-xl transition-all shrink-0 cursor-pointer ml-3 shadow-md"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* TWO-COLUMN STUDIO WORKSPACE GRID (4 : 8) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* COLUMN 1 (LEFT - 4 COLS / 33% WIDTH): ACTIVE PANEL DETAILS */}
          <div className="lg:col-span-4 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-5 space-y-4 shadow-xl">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
              FRAME PREVIEW
            </span>
            <div className="h-56 sm:h-64 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center p-2 relative shadow-inner">
              {activePanel?.image_url ? (
                <img
                  src={activePanel.image_url}
                  alt={`Panel #${selectedIdx + 1}`}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-600">
                  <Sparkles className="w-8 h-8" />
                  <span className="text-[10px] font-mono">
                    No image rendered
                  </span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold text-[#60A5FA] border border-[#3B82F6]/20 shadow-md">
                PANEL #{selectedIdx + 1}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                SPEECH & DIALOGUE
              </span>
              <div className="p-3.5 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-neutral-200 font-sans leading-relaxed min-h-[70px]">
                {cleanDialogueDisplay(activePanel?.speech_text).speech ? (
                  <div className="space-y-1.5">
                    {cleanDialogueDisplay(activePanel?.speech_text).tone && (
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                        Tone:{" "}
                        {cleanDialogueDisplay(activePanel?.speech_text).tone}
                      </span>
                    )}
                    <p>
                      {cleanDialogueDisplay(activePanel?.speech_text).speech}
                    </p>
                  </div>
                ) : (
                  <span className="text-neutral-600 italic">
                    No speech text recorded for this panel.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                NARRATIVE TEXT
              </span>
              <div className="p-3.5 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-neutral-200 font-sans leading-relaxed min-h-[70px]">
                {activePanel?.visual_description || (
                  <span className="text-neutral-600 italic">
                    No narrative text recorded for this panel.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2 (RIGHT - 8 COLS / 67% WIDTH): TRANSLATION WORKFLOW CANVAS */}
          <div className="lg:col-span-8 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-xl flex flex-col min-h-[480px]">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-850 pb-3 mb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                  ACTIVE WORKFLOW
                </p>
                <h4 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <BookOpenText className="w-4 h-4 text-[#3B82F6]" />{" "}
                  Translation & Localization Studio
                </h4>
                <p className="mt-0.5 text-xs text-neutral-400 font-mono">
                  Translate dialogue and narrative text to target languages with
                  1-click batch processing.
                </p>
              </div>
              <div className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-[#60A5FA]">
                PANEL #{selectedIdx + 1}
              </div>
            </div>

            <div className="flex-1">
              <PanelTranslationTool
                panel={activePanel}
                panels={safePanels}
                onUpdateDialogue={handleUpdateDialogue}
                addNotification={addNotification}
              />
            </div>
          </div>
        </div>
            </>
          )}
        </div>
      </div>
  );
}
);

export default PanelAssistantPage;
