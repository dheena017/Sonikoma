import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Film,
  BookOpen,
  Tv,
  Swords,
  Loader2,
  CheckCircle2,
  Sliders,
  Layers,
  Volume2,
  Wand2,
} from "lucide-react";

export interface AISeriesStudioLoadingPageProps {
  seriesId?: string;
  seriesTitle?: string;
  formatType?: string;
  chapterNumber?: number;
  totalPanels?: number;
  statusMessage?: string;
  onCancel?: () => void;
}

const PRODUCTION_STAGES = [
  {
    id: "dna",
    title: "Resolving Narrative Bible & Character DNA",
    description: "Loading visual continuity anchors, character facial features, and style seeds...",
    icon: Sparkles,
  },
  {
    id: "storyboard",
    title: "Mounting Chapter Storyboard & Panel Strips",
    description: "Configuring continuous reading strip and camera composition angles...",
    icon: Layers,
  },
  {
    id: "diffusion",
    title: "Preparing 2D Diffusion & Image Synthesis Cache",
    description: "Connecting to Flux-Anime & Manga Screentone rendering pipelines...",
    icon: Wand2,
  },
  {
    id: "audio",
    title: "Calibrating Vocal Dubbing & Speech Bubble Physics",
    description: "Setting up Edge-TTS dialogue synchronizer and sound effect overlays...",
    icon: Volume2,
  },
];

const STUDIO_TIPS = [
  "💡 Tip: Use the Shot Director Inspector on the right to edit prompts, camera angles, and dialogue for each shot.",
  "🎨 Tip: Continuous Webtoon Strip mode preserves authentic 2:3 vertical manhwa proportions with edge-to-edge clarity.",
  "✨ Tip: You can enhance individual prompts with style tokens like 'Ufotable raytraced sakuga' or 'Solo Leveling mana aura'.",
  "🎙️ Tip: Vocal Dubbing supports multi-character voice lines with selectable emotional delivery.",
  "🔍 Tip: Toggle Bubbles ON/OFF anytime in the inspector for a pure cinematic artwork view.",
];

export const AISeriesStudioLoadingPage: React.FC<AISeriesStudioLoadingPageProps> = ({
  seriesId,
  seriesTitle,
  formatType = "manhwa",
  chapterNumber = 1,
  totalPanels = 8,
  statusMessage,
  onCancel,
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [progress, setProgress] = useState(15);
  const [tipIndex, setTipIndex] = useState(0);

  // Progressive simulated loading state
  useEffect(() => {
    const stageTimer = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < PRODUCTION_STAGES.length - 1 ? prev + 1 : prev));
    }, 1800);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return prev;
        const jump = Math.floor(Math.random() * 8) + 4;
        return Math.min(94, prev + jump);
      });
    }, 400);

    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % STUDIO_TIPS.length);
    }, 3800);

    return () => {
      clearInterval(stageTimer);
      clearInterval(progressTimer);
      clearInterval(tipTimer);
    };
  }, []);

  const fmt = (formatType || "manhwa").toLowerCase();
  const isAnime = fmt === "anime";
  const isComic = fmt === "comic_manga";
  const FormatIcon = isAnime ? Tv : isComic ? Swords : BookOpen;
  const formatLabel = isAnime ? "Anime Sakuga Cinema" : isComic ? "Comic Manga" : "2D Manhwa Webtoon";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07080C] text-[#E5E5E5] overflow-hidden select-none">
      {/* ── Ambient Background Lighting Mesh ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-purple-600/10 blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(7,8,12,0.8)_100%)]" />
      </div>

      {/* ── Studio Ghost Layout Skeleton Backdrop (Subtle Depth Hint) ── */}
      <div className="absolute inset-4 md:inset-8 border border-white/[0.04] rounded-3xl opacity-20 pointer-events-none flex flex-row overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 border-r border-white/5">
          <div className="w-64 h-96 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
          <div className="w-64 h-24 rounded-xl bg-white/[0.02]" />
        </div>
        <div className="w-80 border-l border-white/5 bg-white/[0.01] p-6 space-y-4 hidden md:block">
          <div className="h-6 w-32 rounded-lg bg-white/[0.05]" />
          <div className="h-32 rounded-xl bg-white/[0.03]" />
          <div className="h-24 rounded-xl bg-white/[0.02]" />
        </div>
      </div>

      {/* ── Central Master Loading Studio Card ── */}
      <div className="relative z-10 w-full max-w-lg mx-4 flex flex-col items-center text-center p-6 sm:p-8 rounded-3xl bg-[#0D0E18]/90 border border-white/10 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] space-y-6">
        {/* Animated Central Studio Emblem */}
        <div className="relative">
          {/* Rotating Outer Glow Ring */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[2px] animate-[spin_8s_linear_infinite] shadow-xl shadow-blue-500/20">
            <div className="w-full h-full bg-[#0D0E18] rounded-[22px]" />
          </div>

          {/* Center Pulsing Icon Core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-inner animate-pulse">
              <Sparkles className="w-7 h-7 text-white animate-spin [animation-duration:6s]" />
            </div>
          </div>
        </div>

        {/* Title & Format Identity */}
        <div className="space-y-2 max-w-md">
          <div className="flex items-center justify-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center gap-1.5 shadow-sm">
              <FormatIcon className="w-3 h-3 text-blue-400" />
              <span>{formatLabel}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-neutral-400 bg-white/[0.04] border border-white/10">
              Ch {chapterNumber} • {totalPanels} Shots
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {seriesTitle || "Constructing AI Series Master Studio"}
          </h1>

          <p className="text-xs text-neutral-400 font-mono">
            {statusMessage || "Assembling visual sessions, storyboard panels, and dubbing engine..."}
          </p>
        </div>

        {/* Dynamic Production Stages Checklist */}
        <div className="w-full space-y-2 text-left pt-1">
          {PRODUCTION_STAGES.map((stage, idx) => {
            const isDone = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrent
                    ? "bg-blue-600/10 border-blue-500/40 shadow-sm shadow-blue-500/10"
                    : isDone
                    ? "bg-white/[0.02] border-white/5 opacity-80"
                    : "bg-transparent border-transparent opacity-40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                        : isDone
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-neutral-500 border border-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-mono font-semibold block truncate ${
                        isCurrent ? "text-white" : isDone ? "text-neutral-200" : "text-neutral-500"
                      }`}
                    >
                      {stage.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-blue-300/80 font-sans block truncate animate-pulse">
                        {stage.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white/20 mr-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar with Glowing Shimmer */}
        <div className="w-full space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-neutral-400 px-0.5">
            <span className="flex items-center gap-1.5 text-blue-300">
              <Sliders className="w-3 h-3 text-blue-400" />
              <span>Studio Engine Warmup</span>
            </span>
            <span>{progress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-900 border border-white/10 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-300 relative rounded-full"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Studio Pro-Tip Carousel Pill */}
        <div className="min-h-[44px] w-full flex items-center justify-center p-2 px-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-neutral-300 font-sans text-center transition-all">
          <p className="line-clamp-2 leading-relaxed italic">{STUDIO_TIPS[tipIndex]}</p>
        </div>

        {/* Optional Cancel / Back Action */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer pt-1"
          >
            ← Return to Scraper &amp; Projects
          </button>
        )}
      </div>
    </div>
  );
};

export default AISeriesStudioLoadingPage;
