import React, { useState, useRef } from "react";
import {
  Sliders,
  Search,
  Film,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Music2,
  Megaphone,
  Video,
  AlertTriangle,
  Copy,
  Check,
  Cpu,
  Flame,
  Image,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import { cleanDialogueDisplay } from "@/utils";

import SeoOptimizationTab from "@/features/creative_optimizer/components/SeoOptimizationTab";
import ShortsScriptTab from "@/features/creative_optimizer/components/ShortsScriptTab";
import SoundOutroTab from "@/features/creative_optimizer/components/SoundOutroTab";
import AdPlacementTab from "@/features/creative_optimizer/components/AdPlacementTab";
import ThumbnailStudioTab from "@/features/creative_optimizer/components/ThumbnailStudioTab";
import ModelSelect from "@/features/ai_core/components/ModelSelect";

import { useProjectStore } from "@/store/useProjectStore";

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
    const activeProjectData = useProjectStore((state) => state.activeProjectData);
    const storePanels = activeProjectData?.panels || [];
    const safePanels = (panels && panels.length > 0) ? panels : storePanels;

    const [selectedIdx, setSelectedIdx] = useState(0);
    const [activeTab, setActiveTab] = useState<"seo" | "thumbnails" | "shorts" | "sound" | "ads">("seo");
    const [selectedModel, setSelectedModel] = useState<string>(
      () => localStorage.getItem("ai_comic_model") || ""
    );
    const [copiedAll, setCopiedAll] = useState(false);
    const filmstripRef = useRef<HTMLDivElement>(null);

    if (safePanels.length === 0) {
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

    // Compile overall storyboard details for prompts
    const title = scrapedTitle || "Overpowered S-Rank Recap";
    const genre = scrapedGenre || "Fantasy Action";

    const storyboardSummary = panels
      .map(
        (p, idx) =>
          `Panel ${idx + 1}: Dialogue: "${p.speech_text || "Silent scene"}" | Visual action: ${p.visual_description || "No visual details"}`
      )
      .join("\n");

    // Compile chronological script timestamps for chapter splits
    let currentAccumulator = 0.0;
    const compiledScript = panels
      .map((p, idx) => {
        const minutes = Math.floor(currentAccumulator / 60);
        const seconds = Math.floor(currentAccumulator % 60);
        const timestamp = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        currentAccumulator += p.duration ?? 0;
        return `${timestamp} - Panel ${idx + 1}: ${p.speech_text || "(Silent)"}`;
      })
      .join("\n");

    const handleCopyAllPackage = () => {
      const pkg = `=== YOUTUBE VIDEO PACKAGE ===\nTITLE: ${title}\nGENRE: ${genre}\n\nTIMESTAMPS:\n${compiledScript}\n\nSTORYBOARD SUMMARY:\n${storyboardSummary}`;
      navigator.clipboard.writeText(pkg);
      setCopiedAll(true);
      addNotification?.("Copied YouTube Video Package to clipboard!", "success");
      setTimeout(() => setCopiedAll(false), 2000);
    };

    const activePanel = panels[selectedIdx];

    // Studio tools definition
    const tools = [
      {
        id: "seo" as const,
        label: "SEO & Chapters",
        description: "Optimize metadata & timestamps",
        icon: Search,
      },
      {
        id: "thumbnails" as const,
        label: "Thumbnail Studio",
        description: "16:9 clickbait composition recipes",
        icon: Image,
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
        description: "Outro cues & audio direction",
        icon: Music2,
      },
      {
        id: "ads" as const,
        label: "Ad Placements",
        description: "Sponsor slot timing & scripts",
        icon: Megaphone,
      },
    ];

    const activeToolMeta = tools.find((t) => t.id === activeTab) ?? tools[0];

    return (
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-white/10 bg-[#0b0b0e] p-5 sm:p-7 shadow-2xl">
        {/* PAGE HERO HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-850 pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/30">
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

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* Inline AI Model Switcher */}
            <ModelSelect value={selectedModel} onChange={handleModelChange} />

            {/* Quick Copy YouTube Package Button */}
            <button
              onClick={handleCopyAllPackage}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-purple-300 hover:text-white rounded-xl border border-purple-500/30 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              <span>{copiedAll ? "Copied Package!" : "Copy Package"}</span>
            </button>
          </div>
        </div>

        {/* TOP SECTION: HORIZONTAL PANEL CAROUSEL RIBBON */}
        <div className="relative flex items-center gap-4 bg-neutral-950 border border-neutral-850 rounded-2xl p-3 shadow-md">
          <button
            onClick={() => scrollFilmstrip("left")}
            className="p-2.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer mr-3 shadow-md"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={filmstripRef}
            className="flex gap-3.5 overflow-x-auto py-1.5 scrollbar-none flex-1 scroll-smooth px-1"
          >
            {panels.map((panel, idx) => (
              <button
                key={panel.id ?? idx}
                onClick={() => setSelectedIdx(idx)}
                className={`w-20 shrink-0 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer relative flex items-center justify-center bg-black/60 ${
                  selectedIdx === idx
                    ? "border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.35)] scale-105 bg-purple-500/10"
                    : "border-neutral-850 opacity-50 hover:opacity-100 hover:border-purple-500/40"
                }`}
              >
                {panel.image_url ? (
                  <img
                    src={panel.image_url}
                    alt={`Panel ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Film className="w-5 h-5 text-neutral-600" />
                )}
                <div className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-neutral-300 border border-neutral-800">
                  #{idx + 1}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollFilmstrip("right")}
            className="p-2.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer ml-3 shadow-md"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* THREE-COLUMN BALANCED WORKSPACE GRID (3 : 3 : 6) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* COLUMN 1 (LEFT - 3 COLS): ACTIVE PANEL DETAILS & TEXT */}
          <div className="lg:col-span-3 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-4 space-y-4 shadow-xl">
            {/* Panel Image */}
            <div className="h-48 sm:h-56 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center p-2 relative shadow-inner">
              {activePanel.image_url ? (
                <img
                  src={activePanel.image_url}
                  alt={`Panel #${selectedIdx + 1}`}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-600">
                  <Film className="w-8 h-8" />
                  <span className="text-[10px] font-mono">No image rendered</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold text-purple-300 border border-purple-500/20 shadow-md">
                PANEL #{selectedIdx + 1}
              </div>
            </div>

            {/* Active Dialogue */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                ACTIVE DIALOGUE
              </span>
              <div className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-200 font-sans leading-relaxed min-h-[50px]">
                {cleanDialogueDisplay(activePanel.speech_text).speech ? (
                  <div className="space-y-1">
                    {cleanDialogueDisplay(activePanel.speech_text).tone && (
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Tone: {cleanDialogueDisplay(activePanel.speech_text).tone}
                      </span>
                    )}
                    <p>{cleanDialogueDisplay(activePanel.speech_text).speech}</p>
                  </div>
                ) : (
                  <p className="text-neutral-500 italic text-[11px]">(Silent panel — no dialogue)</p>
                )}
              </div>
            </div>

            {/* Narrative / Visual Description */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                NARRATIVE TEXT
              </span>
              <div className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-200 font-sans leading-relaxed min-h-[50px]">
                {activePanel.visual_description ? (
                  <p>{activePanel.visual_description}</p>
                ) : (
                  <p className="text-neutral-500 italic text-[11px]">(No visual description available)</p>
                )}
              </div>
            </div>

            {/* Panel Metrics Pills */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-850">
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-2 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase">Duration</p>
                <p className="text-xs font-black text-white mt-0.5">{(activePanel.duration ?? 3.0).toFixed(1)}s</p>
              </div>
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-2 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase">Frame</p>
                <p className="text-xs font-black text-white mt-0.5">{selectedIdx + 1}/{panels.length}</p>
              </div>
            </div>
          </div>

          {/* COLUMN 2 (CENTER - 3 COLS): STUDIO TOOLS & FULL VIDEO PREVIEW */}
          <div className="lg:col-span-3 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-4 space-y-4 shadow-xl">
            <div>
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
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                      isActive
                        ? "border-2 border-purple-500/80 bg-purple-500/15 text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isActive ? "text-purple-300" : "text-neutral-500"}`} />
                      <span className="text-xs font-bold">{tool.label}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-neutral-400 font-mono">
                      {tool.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Video Preview Card in Center Column */}
            <div className="pt-2 border-t border-neutral-850 space-y-2">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-purple-400" /> FULL VIDEO PREVIEW
              </span>
              {videoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-inner aspect-video flex items-center justify-center">
                  <video
                    src={
                      videoUrl.startsWith("http://") ||
                      videoUrl.startsWith("https://") ||
                      videoUrl.startsWith("blob:")
                        ? videoUrl
                        : `${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "")}${
                            videoUrl.startsWith("/") ? videoUrl : `/${videoUrl}`
                          }`
                    }
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="border border-dashed border-neutral-850 rounded-xl p-3 text-center bg-neutral-950 flex flex-col items-center justify-center space-y-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500/80" />
                  <p className="text-[10px] text-neutral-400 font-mono">No video preview</p>
                  <p className="text-[9px] text-neutral-500 font-sans">Compile video on Dashboard to view playback</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3 (RIGHT - 6 COLS / 50% WIDTH): EXPANSIVE ACTIVE WORKFLOW CANVAS */}
          <div className="lg:col-span-6 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-5 shadow-xl flex flex-col min-h-[460px]">
            {/* Workflow header */}
            <div className="flex items-center justify-between gap-3 border-b border-neutral-850 pb-3 mb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                  ACTIVE WORKFLOW
                </p>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {activeToolMeta.label}
                </h4>
                <p className="mt-0.5 text-xs text-neutral-400 font-mono">
                  {activeToolMeta.description}
                </p>
              </div>
              <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-purple-300">
                AI ASSISTED
              </div>
            </div>

            {/* Dynamic workflow tool content */}
            <div className="flex-1">
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
              <div className={activeTab === "thumbnails" ? "block" : "hidden"}>
                <ThumbnailStudioTab
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
    );
  }
);

export default AIOptimizerPage;
