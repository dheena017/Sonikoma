import React, { useState, useRef } from "react";
import {
  Sliders,
  Search,
  Film,
  Radio,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Scissors,
  Music2,
  Megaphone,
} from "lucide-react";
import { GeneratedPanel } from "@/types";

import SeoOptimizationTab from "@/features/optimizer/components/SeoOptimizationTab";
import ShortsScriptTab from "@/features/optimizer/components/ShortsScriptTab";
import SoundOutroTab from "@/features/optimizer/components/SoundOutroTab";
import AdPlacementTab from "@/features/optimizer/components/AdPlacementTab";

interface AIOptimizerPageProps {
  panels: GeneratedPanel[];
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  scrapedTitle?: string;
  scrapedGenre?: string;
  videoUrl?: string | null;
}

const AIOptimizerPage = React.memo(
  ({
    panels,
    onNavigateHome,
    addNotification,
    scrapedTitle,
    scrapedGenre,
    videoUrl,
  }: AIOptimizerPageProps) => {
    if (panels.length === 0) {
      return (
        <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <Sparkles className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to optimize video settings.
          </p>
        </div>
      );
    }

    const [selectedIdx, setSelectedIdx] = useState(0);
    const [activeTab, setActiveTab] = useState<
      "seo" | "shorts" | "sound" | "ads"
    >("seo");

    const filmstripRef = useRef<HTMLDivElement>(null);

    const scrollFilmstrip = (direction: "left" | "right") => {
      if (filmstripRef.current) {
        const scrollAmount = direction === "left" ? -240 : 240;
        filmstripRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    };

    // Compile overall storyboard details for prompts
    const title = scrapedTitle || "Overpowered S-Rank Recap";
    const genre = scrapedGenre || "Fantasy Action";

    const storyboardSummary = panels
      .map(
        (p, idx) =>
          `Panel ${idx + 1}: Dialogue: "${
            p.speech_text || "Silent scene"
          }" | Visual action: ${p.visual_description || "No visual details"}`
      )
      .join("\n");

    // Compile chronological script timestamps for chapter splits
    let currentAccumulator = 0.0;
    const compiledScript = panels
      .map((p, idx) => {
        const minutes = Math.floor(currentAccumulator / 60);
        const seconds = Math.floor(currentAccumulator % 60);
        const timestamp = `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
        currentAccumulator += p.duration ?? 0;
        return `${timestamp} - Panel ${idx + 1}: ${
          p.speech_text || "(Silent)"
        }`;
      })
      .join("\n");

    const activePanel = panels[selectedIdx];

    // Studio tools definition for center column
    const tools = [
      {
        id: "seo" as const,
        label: "SEO & Chapters",
        description: "Optimize metadata and timestamps",
        icon: Search,
      },
      {
        id: "shorts" as const,
        label: "Reels & Shorts",
        description: "Generate viral short-form scripts",
        icon: Scissors,
      },
      {
        id: "sound" as const,
        label: "Sound & Vibes",
        description: "Outro cues and audio direction",
        icon: Music2,
      },
      {
        id: "ads" as const,
        label: "Ad Placements",
        description: "Sponsor slot timing and scripts",
        icon: Megaphone,
      },
    ];

    const activeToolMeta = tools.find((t) => t.id === activeTab) ?? tools[0];

    return (
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-[#1f1b2e] bg-[#09080e] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">

        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b172b] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#181229] border border-purple-500/30 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/50">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  VISUAL STUDIO
                </span>
                <span className="text-xs text-neutral-400 font-mono">• {panels.length} active panels</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Video Optimizer
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                AI-driven video metadata, chapter splitters, shorts script generators, and sound direction.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-full bg-[#12101d] border border-[#231e38] text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Panel {selectedIdx + 1} of {panels.length}</span>
            </div>
          </div>
        </div>

        {/* HORIZONTAL PANEL FILMSTRIP CAROUSEL */}
        <div className="relative flex items-center bg-[#0d0b16] border border-[#1f1b2e] rounded-2xl p-2.5">
          <button
            onClick={() => scrollFilmstrip("left")}
            className="p-2 text-neutral-400 hover:text-white bg-[#151224] border border-[#25203b] hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer mr-2 shadow-md"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={filmstripRef}
            className="flex gap-3 overflow-x-auto py-1 scrollbar-none flex-1 scroll-smooth"
          >
            {panels.map((panel, idx) => (
              <button
                key={panel.id}
                onClick={() => setSelectedIdx(idx)}
                className={`w-20 shrink-0 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer relative flex items-center justify-center bg-[#06050a] ${
                  selectedIdx === idx
                    ? "border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.35)] scale-105 bg-[#171329]"
                    : "border-[#1e1930] opacity-50 hover:opacity-100 hover:border-purple-500/40"
                }`}
              >
                {panel.image_url ? (
                  <img
                    src={panel.image_url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Film className="w-5 h-5 text-neutral-600" />
                )}
                <div className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-neutral-300 border border-neutral-800">
                  #{panel.id}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollFilmstrip("right")}
            className="p-2 text-neutral-400 hover:text-white bg-[#151224] border border-[#25203b] hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer ml-2 shadow-md"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* THREE-COLUMN STUDIO WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT COLUMN: Panel Preview + Dialogue + Narrative */}
          <div className="lg:col-span-4 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-4 space-y-4 shadow-xl">
            {/* Panel Image */}
            <div className="h-52 sm:h-60 rounded-xl overflow-hidden border border-[#221d33] bg-[#06050a] flex items-center justify-center p-2 relative">
              {activePanel.image_url ? (
                <img
                  src={activePanel.image_url}
                  alt={`Panel #${activePanel.id}`}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-600">
                  <Film className="w-10 h-10" />
                  <span className="text-[10px] font-mono">No image rendered</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold text-purple-300 border border-purple-500/20">
                PANEL #{activePanel.id}
              </div>
            </div>

            {/* Active Dialogue */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                ACTIVE DIALOGUE
              </span>
              <div className="w-full bg-[#07060c] border border-[#1e1a2e] text-xs rounded-xl p-3 text-neutral-200 font-sans leading-relaxed min-h-[56px]">
                {activePanel.speech_text ? (
                  <p>{activePanel.speech_text}</p>
                ) : (
                  <p className="text-neutral-500 italic">(Silent panel — no dialogue)</p>
                )}
              </div>
            </div>

            {/* Narrative / Visual Description */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                NARRATIVE TEXT
              </span>
              <div className="w-full bg-[#07060c] border border-[#1e1a2e] text-xs rounded-xl p-3 text-neutral-200 font-sans leading-relaxed min-h-[56px]">
                {activePanel.visual_description ? (
                  <p>{activePanel.visual_description}</p>
                ) : (
                  <p className="text-neutral-500 italic">(No visual description available)</p>
                )}
              </div>
            </div>

            {/* Panel timing info */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#07060c] border border-[#1e1a2e] rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Duration</p>
                <p className="text-sm font-black text-white mt-0.5">{(activePanel.duration ?? 3.0).toFixed(1)}s</p>
              </div>
              <div className="bg-[#07060c] border border-[#1e1a2e] rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Frame</p>
                <p className="text-sm font-black text-white mt-0.5">{selectedIdx + 1}/{panels.length}</p>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: Tools Menu + Workflow Canvas */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-5">

            {/* CENTER COLUMN: Vertical Studio Tool Menu */}
            <div className="md:col-span-4 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-4 shadow-xl">
              <div className="mb-3 px-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                  STUDIO TOOLS
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-white">
                  Optimize video
                </h3>
              </div>
              <div className="space-y-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTab(tool.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-all cursor-pointer ${
                        isActive
                          ? "border-2 border-purple-500/80 bg-purple-500/15 text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                          : "border-[#1c182b] bg-[#07060c] text-neutral-400 hover:border-neutral-700 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? "text-purple-300" : "text-neutral-500"
                          }`}
                        />
                        <span className="text-xs font-bold">{tool.label}</span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-neutral-400 font-mono">
                        {tool.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Dynamic Active Workflow Canvas */}
            <div className="md:col-span-8 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-4 shadow-xl flex flex-col min-h-[420px]">
              {/* Workflow header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b172b] pb-3 mb-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                    ACTIVE WORKFLOW
                  </p>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {activeToolMeta.label}
                  </h4>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {activeToolMeta.description}
                  </p>
                </div>
                <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-purple-300">
                  AI ASSISTED
                </div>
              </div>

              {/* Dynamic tool content */}
              <div className="flex-1 overflow-y-auto">
                <div className={activeTab === "seo" ? "block" : "hidden"}>
                  <SeoOptimizationTab
                    title={title}
                    genre={genre}
                    storyboardSummary={storyboardSummary}
                    videoUrl={videoUrl}
                    panels={panels}
                    addNotification={addNotification}
                  />
                </div>
                <div className={activeTab === "shorts" ? "block" : "hidden"}>
                  <ShortsScriptTab
                    title={title}
                    storyboardSummary={storyboardSummary}
                    videoUrl={videoUrl}
                    panels={panels}
                    addNotification={addNotification}
                  />
                </div>
                <div className={activeTab === "sound" ? "block" : "hidden"}>
                  <SoundOutroTab
                    title={title}
                    storyboardSummary={storyboardSummary}
                    videoUrl={videoUrl}
                    panels={panels}
                    addNotification={addNotification}
                  />
                </div>
                <div className={activeTab === "ads" ? "block" : "hidden"}>
                  <AdPlacementTab
                    compiledScript={compiledScript}
                    videoUrl={videoUrl}
                    panels={panels}
                    addNotification={addNotification}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default AIOptimizerPage;
