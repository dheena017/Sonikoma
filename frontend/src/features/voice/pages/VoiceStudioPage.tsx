import React, { useState, useRef } from "react";
import {
  Mic,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Film,
  Cpu,
  Wand2,
  Users,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import ScriptDramatizerForm from "@/features/voice/components/ScriptDramatizerForm";
import VoiceSettingsPanel from "@/features/voice/components/VoiceSettingsPanel";

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
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [activeTab, setActiveTab] = useState<"dramatize" | "cast">("dramatize");
    const [selectedModel, setSelectedModel] = useState<string>(
      () => localStorage.getItem("ai_comic_model") || "gemini-2.5-flash"
    );

    const filmstripRef = useRef<HTMLDivElement>(null);

    const scrollFilmstrip = (direction: "left" | "right") => {
      if (filmstripRef.current) {
        const scrollAmount = direction === "left" ? -240 : 240;
        filmstripRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    };

    const handleModelChange = (model: string) => {
      setSelectedModel(model);
      localStorage.setItem("ai_comic_model", model);
      addNotification?.(`Switched AI Model to ${model}`, "info");
    };

    if (panels.length === 0) {
      return (
        <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <Mic className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to start voice dramaturgy.
          </p>
        </div>
      );
    }

    const safePanels = panels || [];
    const activePanel = safePanels[selectedIdx] || safePanels[0];

    return (
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-[#1f1b2e] bg-[#09080e] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b172b] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#181229] border border-purple-500/30 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/50">
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  AUDIO PRODUCTION
                </span>
                <span className="text-xs text-neutral-400 font-mono">• {safePanels.length} panels for TTS</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Voice Studio
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Character voice actor casting, script dramatization, emotional inflection, and neural audio synthesis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {/* Inline AI Model Switcher */}
            <div className="flex items-center gap-2 bg-[#12101d] border border-[#231e38] rounded-xl px-3 py-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-transparent text-xs font-mono text-white outline-none cursor-pointer"
              >
                <option value="gemini-2.5-flash" className="bg-[#09080e] text-white">Gemini 2.5 Flash (Default)</option>
                <option value="gemini-2.5-flash-lite" className="bg-[#09080e] text-white">Gemini 2.5 Flash-Lite (Fast)</option>
                <option value="gemini-2.0-flash" className="bg-[#09080e] text-white">Gemini 2.0 Flash</option>
                <option value="gemini-2.5-pro" className="bg-[#09080e] text-white">Gemini 2.5 Pro (High Quality)</option>
              </select>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-[#12101d] border border-[#231e38] text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              <span>Genre: {scrapedGenre || "Fantasy Action"}</span>
            </div>
          </div>
        </div>

        {/* TOP SECTION: HORIZONTAL PANEL CAROUSEL RIBBON */}
        <div className="relative flex items-center gap-4 bg-[#0d0b16] border border-[#1f1b2e] rounded-2xl p-3 shadow-md">
          <button
            onClick={() => scrollFilmstrip("left")}
            className="p-2.5 text-neutral-400 hover:text-white bg-[#151224] border border-[#25203b] hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer mr-3 shadow-md"
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
                  className={`relative flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer group bg-[#06050a] flex items-center justify-center ${
                    isSel
                      ? "border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105 bg-[#171329]"
                      : "border-[#1e1a2e] opacity-60 hover:opacity-100 hover:border-purple-500/50"
                  }`}
                >
                  {p?.image_url ? (
                    <img
                      src={p.image_url}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0c0a15] flex items-center justify-center text-[10px] text-neutral-600 font-mono">
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
            className="p-2.5 text-neutral-400 hover:text-white bg-[#151224] border border-[#25203b] hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer ml-3 shadow-md"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* TWO-COLUMN STUDIO WORKSPACE GRID (4 : 8) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* COLUMN 1 (LEFT - 4 COLS / 33% WIDTH): ACTIVE PANEL DETAILS */}
          <div className="lg:col-span-4 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-5 space-y-4 shadow-xl">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
              FRAME PREVIEW
            </span>

            {/* Frame Image Container */}
            <div className="h-56 sm:h-64 rounded-xl overflow-hidden border border-[#221d33] bg-[#06050a] flex items-center justify-center p-2 relative shadow-inner">
              {activePanel?.image_url ? (
                <img
                  src={activePanel.image_url}
                  alt={`Panel #${activePanel.id || selectedIdx + 1}`}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-600">
                  <Film className="w-8 h-8" />
                  <span className="text-[10px] font-mono">No image rendered</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold text-purple-300 border border-purple-500/20 shadow-md">
                PANEL #{activePanel?.id || selectedIdx + 1}
              </div>
            </div>

            {/* Speech & Dialogue */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                SPEECH & DIALOGUE
              </span>
              <div className="p-3.5 bg-[#06050a] border border-[#1d182e] rounded-xl text-xs text-neutral-200 font-sans leading-relaxed min-h-[60px]">
                {activePanel?.speech_text ? (
                  <p>{activePanel.speech_text}</p>
                ) : (
                  <span className="text-neutral-600 italic">No speech text recorded for this panel.</span>
                )}
              </div>
            </div>

            {/* Narrative Text */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                NARRATIVE TEXT
              </span>
              <div className="p-3.5 bg-[#06050a] border border-[#1d182e] rounded-xl text-xs text-neutral-200 font-sans leading-relaxed min-h-[60px]">
                {activePanel?.visual_description ? (
                  <p>{activePanel.visual_description}</p>
                ) : (
                  <span className="text-neutral-600 italic">No narrative text recorded for this panel.</span>
                )}
              </div>
            </div>

            {/* Panel Metrics Pills */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1b172b]">
              <div className="bg-[#06050a] border border-[#1d182e] rounded-xl p-2 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase">Duration</p>
                <p className="text-xs font-black text-white mt-0.5">{(activePanel?.duration ?? 3.0).toFixed(1)}s</p>
              </div>
              <div className="bg-[#06050a] border border-[#1d182e] rounded-xl p-2 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase">Frame</p>
                <p className="text-xs font-black text-white mt-0.5">{selectedIdx + 1}/{safePanels.length}</p>
              </div>
            </div>
          </div>

          {/* COLUMN 2 (RIGHT - 8 COLS / 67% WIDTH): VOICE WORKFLOW CANVAS */}
          <div className="lg:col-span-8 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-5 shadow-xl flex flex-col min-h-[480px]">
            {/* TABS SELECTOR HEADER */}
            <div className="flex border-b border-[#1b172b] mb-5 overflow-x-auto scrollbar-none font-mono">
              <button
                onClick={() => setActiveTab("dramatize")}
                className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "dramatize"
                    ? "border-purple-500 text-purple-300 bg-purple-500/10"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>✦ Dialogue Dramatizer</span>
              </button>
              <button
                onClick={() => setActiveTab("cast")}
                className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "cast"
                    ? "border-purple-500 text-purple-300 bg-purple-500/10"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>✦ Voice Casting Match</span>
              </button>
            </div>

            {/* ACTIVE WORKFLOW TAB */}
            <div className="flex-1">
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
        </div>
      </div>
    );
  }
);

export default VoiceStudioPage;
