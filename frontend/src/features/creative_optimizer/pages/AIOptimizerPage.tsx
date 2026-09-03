import React, { useState, useRef, useMemo } from "react";
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
import { AIModelSelector } from "@/features/ai_core";

import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface AIOptimizerPageProps {
  panels: GeneratedPanel[];
  setPanels?: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  scrapedTitle?: string;
  scrapedGenre?: string;
  videoUrl?: string | null;
}

const AIOptimizerPage = React.memo(
  ({
    panels,
    setPanels,
    onNavigateHome,
    addNotification,
    scrapedTitle,
    scrapedGenre,
    videoUrl,
  }: AIOptimizerPageProps) => {
    const activeProjectData = useProjectStore(
      (state) => state.activeProjectData
    );
    const storePanels = activeProjectData?.panels || [];
    const safePanels = (
      panels && panels.length > 0 ? panels : storePanels
    ) as unknown as GeneratedPanel[];

    const [selectedIdx, setSelectedIdx] = useState(0);
    const [activeTab, setActiveTab] = useState<
      "seo" | "thumbnails" | "shorts" | "sound" | "ads"
    >("seo");
    const [selectedModel, setSelectedModel] = useState<string>(
      () => localStorage.getItem("ai_comic_model") || ""
    );
    const [copiedAll, setCopiedAll] = useState(false);
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

    const handleModelChange = (model: string) => {
      setSelectedModel(model);
      localStorage.setItem("ai_comic_model", model);
      addNotification?.(`Switched AI Model to ${model}`, "info");
    };

    // Compile overall storyboard details for prompts
    const title =
      scrapedTitle ||
      (activeProjectData as any)?.title ||
      (activeProjectData as any)?.project_name ||
      "Solo Leveling";
    const genre = scrapedGenre || "Fantasy Action";

    const storyboardSummary = useMemo(() => {
      return (safePanels || [])
        .map(
          (p, idx) =>
            `Panel ${idx + 1}: Dialogue: "${
              cleanDialogueDisplay(p.speech_text).speech || p.visual_description || "Scene shot"
            }"`
        )
        .join("\n");
    }, [safePanels]);

    // Compile chronological script timestamps for chapter splits
    const compiledScript = useMemo(() => {
      let currentAccumulator = 0.0;
      return (safePanels || [])
        .map((p, idx) => {
          const minutes = Math.floor(currentAccumulator / 60);
          const seconds = Math.floor(currentAccumulator % 60);
          const timestamp = `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
          currentAccumulator += p.duration ?? 0;
          return `${timestamp} - Panel ${idx + 1}: ${
            cleanDialogueDisplay(p.speech_text).speech || "(Silent)"
          }`;
        })
        .join("\n");
    }, [safePanels]);

    const handleCopyAllPackage = () => {
      const pkg = `=== YOUTUBE VIDEO PACKAGE ===\nTITLE: ${title}\nGENRE: ${genre}\n\nTIMESTAMPS:\n${compiledScript}\n\nSTORYBOARD SUMMARY:\n${storyboardSummary}`;
      navigator.clipboard.writeText(pkg);
      setCopiedAll(true);
      addNotification?.(
        "Copied YouTube Video Package to clipboard!",
        "success"
      );
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
      <div className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 animate-fade-in text-left text-[#E5E5E5]">
        {/* ── MAIN COVER WRAPPER CARD ── */}
        <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
          {/* PAGE HERO HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#2F2F2F] pb-6">
            <div className="space-y-2 max-w-2xl text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-[#E5E5E5] tracking-tight leading-tight">
                Video{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#3B82F6]">
                  Optimizer
                </span>
              </h1>
              <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed">
                AI-driven video metadata, chapter splitters, shorts script generators, and sound direction.
              </p>
            </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* Inline AI Model Switcher */}
            <AIModelSelector value={selectedModel} onChange={handleModelChange} />

            {/* Quick Copy YouTube Package Button */}
            <Tooltip text="Copy complete YouTube title, description, chapters & summary package" placement="bottom">
              <button
                onClick={handleCopyAllPackage}
                className="px-4 py-2.5 bg-[#1E1E1E] hover:bg-[#252525] text-[#E5E5E5] hover:text-white rounded-2xl border border-[#2F2F2F] hover:border-[#3B82F6]/60 text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                aria-label="Copy Package"
              >
                {copiedAll ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#3B82F6]" />
                )}
                <span>{copiedAll ? "Copied Package!" : "Copy Package"}</span>
              </button>
            </Tooltip>
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
              Please import a series or add panels to your storyboard timeline to generate viral shorts, metadata, and sound direction.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onNavigateHome}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs"
              >
                <span>Open Dashboard Projects</span>
              </button>
              <button
                onClick={() => {
                  if (typeof setPanels === "function") {
                    setPanels([
                      {
                        id: 1,
                        prompt: "Dramatic cosmic rift tearing open across the sky",
                        duration: 3.5,
                        speech_text: "The seal has broken. Prepare for the final convergence.",
                        visual_description:
                          "Dramatic cosmic rift tearing open across the sky.",
                        image_url: "",
                        sfx: "Rift Crack",
                        motion_type: "zoom_in",
                      },
                      {
                        id: 2,
                        prompt: "Heroes charging into celestial portal with weapons drawn",
                        duration: 4.2,
                        speech_text: "We will not fall back. Stand your ground!",
                        visual_description:
                          "Heroes charge into the celestial portal with weapons drawn.",
                        image_url: "",
                        sfx: "Battle Cry",
                        motion_type: "pan_right",
                      },
                    ]);
                    addNotification?.("Loaded demo panels for Video Optimizer!", "success");
                  }
                }}
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
              <Tooltip text="Scroll panels left" placement="top">
                <button
                  onClick={() => scrollFilmstrip("left")}
                  className="p-2.5 text-[#9CA3AF] hover:text-white bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/60 hover:bg-[#252525] rounded-xl transition-all shrink-0 cursor-pointer mr-3 shadow-sm"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </Tooltip>

              <div
                ref={filmstripRef}
                className="flex gap-3.5 overflow-x-auto py-1.5 scrollbar-none flex-1 scroll-smooth px-1"
              >
                {panels.map((panel, idx) => (
                  <button
                    key={panel.id ?? idx}
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-20 shrink-0 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer relative flex items-center justify-center bg-[#121212] ${
                      selectedIdx === idx
                        ? "border-2 border-[#3B82F6] scale-105 bg-[#3B82F6]/10 shadow-md"
                        : "border-[#2F2F2F] opacity-70 hover:opacity-100 hover:border-[#3B82F6]/60 hover:scale-102"
                    }`}
                  >
                    {panel.image_url ? (
                      <img
                        src={panel.image_url}
                        alt={`Panel ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Film className="w-5 h-5 text-[#6B7280]" />
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-[#E5E5E5] border border-[#2F2F2F]">
                      #{idx + 1}
                    </div>
                  </button>
                ))}
              </div>

              <Tooltip text="Scroll panels right" placement="top">
                <button
                  onClick={() => scrollFilmstrip("right")}
                  className="p-2.5 text-[#9CA3AF] hover:text-white bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/60 hover:bg-[#252525] rounded-xl transition-all shrink-0 cursor-pointer ml-3 shadow-sm"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Tooltip>
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
                  <span className="text-[10px] font-mono">
                    No image rendered
                  </span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold text-[#60A5FA] border border-[#3B82F6]/20 shadow-md">
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
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                        Tone:{" "}
                        {cleanDialogueDisplay(activePanel.speech_text).tone}
                      </span>
                    )}
                    <p>
                      {cleanDialogueDisplay(activePanel.speech_text).speech}
                    </p>
                  </div>
                ) : (
                  <p className="text-neutral-500 italic text-[11px]">
                    (Silent panel — no dialogue)
                  </p>
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
                  <p className="text-neutral-500 italic text-[11px]">
                    (No visual description available)
                  </p>
                )}
              </div>
            </div>

            {/* Panel Metrics Pills */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-850">
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-2 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase">
                  Duration
                </p>
                <p className="text-xs font-black text-white mt-0.5">
                  {(activePanel.duration ?? 3.0).toFixed(1)}s
                </p>
              </div>
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-2 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase">
                  Frame
                </p>
                <p className="text-xs font-black text-white mt-0.5">
                  {selectedIdx + 1}/{panels.length}
                </p>
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
                        ? "border-2 border-[#3B82F6]/80 bg-[#3B82F6]/15 text-white "
                        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? "text-[#60A5FA]" : "text-neutral-500"
                        }`}
                      />
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
                <Video className="w-3.5 h-3.5 text-[#3B82F6]" /> FULL VIDEO
                PREVIEW
              </span>
              {videoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-inner aspect-video flex items-center justify-center">
                  <video
                    src={
                      videoUrl.startsWith("http://") ||
                      videoUrl.startsWith("https://") ||
                      videoUrl.startsWith("blob:")
                        ? videoUrl
                        : `${(
                            import.meta.env.VITE_API_URL ||
                            "http://localhost:8000"
                          ).replace(/\/+$/, "")}${
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
                  <p className="text-[10px] text-neutral-400 font-mono">
                    No video preview
                  </p>
                  <p className="text-[9px] text-neutral-500 font-sans">
                    Compile video on Dashboard to view playback
                  </p>
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
              <div className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-[#60A5FA]">
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
            </>
          )}
        </div>
      </div>
  );
}
);

export default AIOptimizerPage;
