import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Languages,
  Maximize2,
  X,
  Image,
  Plus,
} from "lucide-react";
import { GeneratedPanel } from "@/shared/types";
import { cleanDialogueDisplay } from "@/shared/utils";

import TranslationTool from "@/features/creative/translation/components/TranslationTool";

import { useProjectStore } from "@/features/platform/projects/store/useProjectStore";

interface TranslationPageProps {
  panels?: GeneratedPanel[];
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome?: () => void;
  addNotification?: (msg: string, type: any) => void;
}

export type PanelAssistantPageProps = TranslationPageProps;

export const TranslationPage = React.memo(
  ({
    panels = [],
    setPanels = () => {},
    onNavigateHome = () => {},
    addNotification,
  }: TranslationPageProps) => {
    const activeProjectData = useProjectStore(
      (state) => state.activeProjectData
    );
    const storePanels = activeProjectData?.panels || [];
    const safePanels = (panels && panels.length > 0
      ? panels
      : Array.isArray(storePanels)
      ? storePanels
      : []) as unknown as GeneratedPanel[];
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [previewPanel, setPreviewPanel] = useState<GeneratedPanel | null>(null);

    const filmstripRef = useRef<HTMLDivElement>(null);

    // Close preview modal on ESC key
    useEffect(() => {
      if (!previewPanel) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setPreviewPanel(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [previewPanel]);

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

    const handleCreatePanel = () => {
      if (typeof setPanels === "function") {
        const nextId =
          safePanels.length > 0
            ? Math.max(...safePanels.map((p) => p.id || 0)) + 1
            : 1;
        const newPanel: GeneratedPanel = {
          id: nextId,
          prompt: "",
          duration: 0,
          speech_text: "",
          visual_description: "",
          image_url: "",
          sfx: "",
          motion_type: "",
        };
        setPanels((prev) => [...(prev || []), newPanel]);
        setSelectedIdx(safePanels.length);
        addNotification?.(
          `Created new Frame #${safePanels.length + 1} for translation!`,
          "success"
        );
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

    const handleUpdateNarrative = (val: string) => {
      if (typeof setPanels === "function") {
        setPanels((prev) =>
          (prev || []).map((p, idx) =>
            idx === selectedIdx ? { ...p, visual_description: val } : p
          )
        );
      }
    };

    return (
      <>
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
                Multi-language dialogue translator and narrative editor per
                comic panel frame.
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
                Please import a series or add panels to your storyboard timeline
                to translate dialogue and narrative text.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onNavigateHome}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs"
                >
                  <span>Open Dashboard Projects</span>
                </button>
                <button
                  onClick={handleCreatePanel}
                  className="btn-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono"
                >
                  <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Create First Panel Frame</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TOP SECTION: HORIZONTAL PANEL CAROUSEL RIBBON */}
              <div className="bg-[#1A1A1A] border border-[#2F2F2F] rounded-2xl p-4 shadow-md space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5 text-[#3B82F6]" />
                      Storyboard Timeline ({safePanels.length} Frames)
                    </span>
                    <span className="text-[10px] font-mono text-[#60A5FA] bg-[#3B82F6]/10 border border-[#3B82F6]/30 px-2 py-0.5 rounded-full">
                      Active: Frame #{selectedIdx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCreatePanel}
                      className="px-2.5 py-1 text-xs font-mono font-semibold text-[#60A5FA] bg-[#3B82F6]/10 border border-[#3B82F6]/30 hover:bg-[#3B82F6]/20 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                      title="Add new storyboard frame"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Frame</span>
                    </button>
                    {safePanels.length > 4 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => scrollFilmstrip("left")}
                          className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-all cursor-pointer"
                          title="Scroll left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => scrollFilmstrip("right")}
                          className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-all cursor-pointer"
                          title="Scroll right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  ref={filmstripRef}
                  className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-neutral-800 scroll-smooth px-1"
                >
                  {safePanels.map((p, idx) => {
                    const isSel = idx === selectedIdx;
                    const speech = cleanDialogueDisplay(p?.speech_text).speech;
                    return (
                      <button
                        key={p?.id || idx}
                        onClick={() => setSelectedIdx(idx)}
                        className={`relative flex-shrink-0 w-28 sm:w-32 rounded-xl overflow-hidden border transition-all cursor-pointer group bg-black/80 flex flex-col p-1.5 ${
                          isSel
                            ? "border-2 border-[#3B82F6] bg-[#3B82F6]/10 shadow-lg shadow-[#3B82F6]/25 ring-2 ring-[#3B82F6]/30 scale-[1.02]"
                            : "border-neutral-800 opacity-70 hover:opacity-100 hover:border-neutral-600 hover:scale-[1.01]"
                        }`}
                      >
                        {/* Frame Header */}
                        <div className="flex items-center justify-between pb-1 px-0.5 text-[10px] font-mono">
                          <span className={isSel ? "text-[#60A5FA] font-bold" : "text-neutral-400"}>
                            Frame #{idx + 1}
                          </span>
                          {isSel && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                          )}
                        </div>

                        {/* Thumbnail Image (Vertical Comic Ratio 3:4) */}
                        <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-neutral-950 border border-neutral-900 flex items-center justify-center relative">
                          {p?.image_url ? (
                            <img
                              src={p.image_url}
                              alt={`Frame ${idx + 1}`}
                              className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-950 flex flex-col items-center justify-center text-[10px] text-neutral-600 font-mono gap-1">
                              <Image className="w-4 h-4 opacity-40" />
                              <span>#{idx + 1}</span>
                            </div>
                          )}
                        </div>

                        {/* Dialogue Preview Snippet */}
                        <div className="pt-1.5 px-0.5 text-[9px] font-mono text-neutral-400 truncate text-left w-full">
                          {speech ? `"${speech}"` : <span className="italic opacity-50">No dialogue</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TWO-COLUMN STUDIO WORKSPACE GRID (5 : 7) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* COLUMN 1 (LEFT - 5 COLS / 42% WIDTH): ACTIVE PANEL DETAILS & LARGE PREVIEW */}
                <div className="lg:col-span-5 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-5 space-y-4 shadow-xl flex flex-col justify-between h-full min-h-[620px]">
                  {/* Preview Header */}
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#60A5FA] uppercase tracking-widest font-bold bg-[#3B82F6]/15 border border-[#3B82F6]/30 px-2.5 py-1 rounded-lg">
                        FRAME #{selectedIdx + 1} OF {safePanels.length}
                      </span>
                    </div>
                    {activePanel?.image_url && (
                      <button
                        type="button"
                        onClick={() => setPreviewPanel(activePanel)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        title="Full-screen preview (Esc to close)"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>Expand</span>
                      </button>
                    )}
                  </div>

                  {/* Main Comic Panel Image Canvas */}
                  <div
                    className="flex-1 min-h-[380px] sm:min-h-[440px] max-h-[540px] rounded-xl overflow-hidden border border-neutral-800 bg-[#0C0C0C] flex items-center justify-center p-3 relative shadow-inner group cursor-pointer"
                    onClick={() => activePanel?.image_url && setPreviewPanel(activePanel)}
                  >
                    {activePanel?.image_url ? (
                      <>
                        <img
                          src={activePanel.image_url}
                          alt={`Panel #${selectedIdx + 1}`}
                          className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-[1.02] transition-transform duration-300 shadow-2xl"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                          <div className="p-3 rounded-xl bg-black/80 border border-white/20 text-white flex items-center gap-2 text-xs font-mono font-bold shadow-xl">
                            <Maximize2 className="w-4 h-4 text-[#3B82F6]" />
                            <span>Click to Zoom</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-neutral-600">
                        <Image className="w-10 h-10 opacity-40" />
                        <span className="text-xs font-mono">No image rendered for this frame</span>
                      </div>
                    )}
                  </div>

                  {/* Frame Navigation Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={selectedIdx <= 0}
                      onClick={() => setSelectedIdx((prev) => Math.max(0, prev - 1))}
                      className="py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev Frame</span>
                    </button>
                    <button
                      type="button"
                      disabled={selectedIdx >= safePanels.length - 1}
                      onClick={() => setSelectedIdx((prev) => Math.min(safePanels.length - 1, prev + 1))}
                      className="py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Next Frame</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Collated Script Overview for Active Panel */}
                  <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-2 text-xs font-sans">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-neutral-400">
                      <span>Panel Dialogue & Narrative</span>
                      {cleanDialogueDisplay(activePanel?.speech_text).tone && (
                        <span className="px-2 py-0.5 rounded text-[9px] bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                          {cleanDialogueDisplay(activePanel?.speech_text).tone}
                        </span>
                      )}
                    </div>
                    {cleanDialogueDisplay(activePanel?.speech_text).speech ? (
                      <p className="text-neutral-200 line-clamp-2 leading-relaxed">
                        <strong className="text-white font-mono text-[11px] mr-1.5">Dialogue:</strong>
                        "{cleanDialogueDisplay(activePanel?.speech_text).speech}"
                      </p>
                    ) : (
                      <p className="text-neutral-500 italic text-[11px]">No dialogue recorded for this panel.</p>
                    )}
                    {activePanel?.visual_description && (
                      <p className="text-neutral-400 line-clamp-2 leading-relaxed text-[11px] border-t border-neutral-900 pt-1.5">
                        <strong className="text-neutral-300 font-mono mr-1.5">Scene:</strong>
                        {activePanel.visual_description}
                      </p>
                    )}
                  </div>
                </div>

                {/* COLUMN 2 (RIGHT - 7 COLS / 58% WIDTH): TRANSLATION WORKFLOW CANVAS */}
                <div className="lg:col-span-7 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-xl flex flex-col h-full min-h-[620px]">
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
                        Translate dialogue and narrative text to target
                        languages with 1-click batch processing.
                      </p>
                    </div>
                    <div className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-[#60A5FA]">
                      PANEL #{selectedIdx + 1}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <TranslationTool
                      panel={activePanel}
                      panels={safePanels}
                      setPanels={setPanels}
                      onUpdateDialogue={handleUpdateDialogue}
                      onUpdateNarrative={handleUpdateNarrative}
                      addNotification={addNotification}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Full-screen Panel Preview Lightbox Portal ── */}
      {previewPanel && previewPanel.image_url && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8"
          data-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={() => setPreviewPanel(null)}
          />

          {/* Lightbox Card */}
          <div
            className="relative z-10 w-full max-w-5xl bg-[#181818] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] ring-1 ring-white/10 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-neutral-800 bg-[#141414] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[#1E1E1E] border border-neutral-800 text-[#3B82F6]">
                  <Image className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#E5E5E5] font-mono">
                    PANEL #{safePanels.indexOf(previewPanel) + 1} — FULL PREVIEW
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono line-clamp-1">
                    {previewPanel.visual_description || previewPanel.speech_text || "No description"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPanel(null)}
                className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 border border-transparent hover:border-neutral-700 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 min-h-0 bg-black flex items-center justify-center p-4 overflow-hidden">
              <img
                src={previewPanel.image_url}
                alt="Panel full preview"
                className="max-h-[min(70vh,700px)] w-auto max-w-full object-contain rounded-xl border border-neutral-800 shadow-2xl"
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-neutral-800 bg-[#141414] shrink-0 flex items-center justify-between gap-3">
              <p className="text-[10px] font-mono text-neutral-400 line-clamp-2 flex-1">
                {previewPanel.visual_description || previewPanel.speech_text || ""}
              </p>
              <button
                type="button"
                onClick={() => setPreviewPanel(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </>
    );
  }
);

export const PanelAssistantPage = TranslationPage;
export default TranslationPage;
