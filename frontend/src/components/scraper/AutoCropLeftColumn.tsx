import React from "react";
import SectionTitle from "../crop/SectionTitle";
import { Sparkles, Layers, Cpu, Maximize2 } from "lucide-react";
import { BG_MODE_OPTIONS, STRATEGY_OPTIONS, ASPECT_RATIO_OPTIONS } from "./autoCropConfig";

interface AutoCropLeftColumnProps {
  sensitivity: number;
  setSensitivity: (v: number) => void;
  padding: number;
  setPadding: (v: number) => void;
  backgroundColorMode: string;
  setBackgroundColorMode: (v: string) => void;
  autoSplitTallStrips: boolean;
  setAutoSplitTallStrips: (v: boolean) => void;
  processingStrategy: string;
  setProcessingStrategy: (v: string) => void;
  aspectRatioLock: string;
  setAspectRatioLock: (v: string) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (v: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (v: number) => void;
}

export default function AutoCropLeftColumn({
  setSensitivity,
  setPadding,
  backgroundColorMode,
  setBackgroundColorMode,
  setAutoSplitTallStrips,
  processingStrategy,
  setProcessingStrategy,
  aspectRatioLock,
  setAspectRatioLock,
  setMinPanelAreaPct,
  setOverlapMergeThreshold,
}: AutoCropLeftColumnProps) {
  return (
    <div className="lg:col-span-7 space-y-7">
      {/* SECTION 0: CROP CONFIGURATION PROFILES */}
      <div className="space-y-3">
        <SectionTitle icon={<Sparkles className="h-3 w-3" />}>Crop Profiles (Presets)</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setSensitivity(30);
              setPadding(10);
              setBackgroundColorMode("auto");
              setProcessingStrategy("balanced");
              setAspectRatioLock("free");
              setAutoSplitTallStrips(true);
              setMinPanelAreaPct(1.5);
              setOverlapMergeThreshold(30);
            }}
            className="bg-neutral-950/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer"
          >
            <span className="text-[11px] font-bold text-white block">⚖️ Standard Balanced</span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">30% sens · 10px pad · Auto BG</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSensitivity(25);
              setPadding(15);
              setBackgroundColorMode("auto");
              setProcessingStrategy("fast");
              setAspectRatioLock("free");
              setAutoSplitTallStrips(true);
              setMinPanelAreaPct(1.0);
              setOverlapMergeThreshold(45);
            }}
            className="bg-neutral-950/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer"
          >
            <span className="text-[11px] font-bold text-white block">⚡ Webtoon Strip Cutter</span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">25% sens · 15px pad · Fast split</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSensitivity(45);
              setPadding(5);
              setBackgroundColorMode("white");
              setProcessingStrategy("precise");
              setAspectRatioLock("free");
              setAutoSplitTallStrips(false);
              setMinPanelAreaPct(2.0);
              setOverlapMergeThreshold(20);
            }}
            className="bg-neutral-950/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer"
          >
            <span className="text-[11px] font-bold text-white block">📖 Precise Manga</span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">45% sens · 5px pad · White BG</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSensitivity(30);
              setPadding(12);
              setBackgroundColorMode("auto");
              setProcessingStrategy("balanced");
              setAspectRatioLock("1:1");
              setAutoSplitTallStrips(true);
              setMinPanelAreaPct(1.5);
              setOverlapMergeThreshold(35);
            }}
            className="bg-neutral-950/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer"
          >
            <span className="text-[11px] font-bold text-white block">🏁 Mobile Square (1:1)</span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">30% sens · 12px pad · Square lock</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BACKGROUND DETECTOR MODE */}
      <div className="space-y-3">
        <SectionTitle icon={<Layers className="h-3 w-3" />}>Background Gutter Mode</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {BG_MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBackgroundColorMode(opt.value)}
              className={`flex items-start gap-4 px-5 py-4 rounded-2xl border text-left transition-all cursor-pointer ${
                backgroundColorMode === opt.value
                  ? "bg-indigo-900/25 border-indigo-500 shadow-[0_0_18px_rgba(99,102,241,0.08)]"
                  : "bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
              }`}
            >
              <div
                className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border ${
                  opt.value === "white"
                    ? "bg-white border-neutral-400"
                    : opt.value === "black"
                    ? "bg-black border-neutral-600"
                    : "bg-indigo-500 border-indigo-400"
                } ${
                  backgroundColorMode === opt.value
                    ? "ring-2 ring-offset-2 ring-offset-neutral-900 ring-indigo-500"
                    : ""
                }`}
              />
              <div className="flex-1 min-w-0">
                <span className={`text-[12px] font-bold font-mono block mb-1 ${backgroundColorMode === opt.value ? "text-white" : "text-neutral-300"}`}>
                  {opt.label}
                </span>
                <p className="text-[10px] text-neutral-500 font-sans leading-relaxed">{opt.hint}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: PROCESSING STRATEGY */}
      <div className="space-y-3">
        <SectionTitle icon={<Cpu className="h-3 w-3" />}>Processing Strategy</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {STRATEGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setProcessingStrategy(opt.value)}
              className={`flex flex-col gap-1.5 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                processingStrategy === opt.value
                  ? "bg-indigo-900/25 border-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.08)]"
                  : "bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
              }`}
            >
              <span className={`text-[11px] font-bold font-mono ${processingStrategy === opt.value ? "text-white" : "text-neutral-300"}`}>
                {opt.label}
              </span>
              <p className="text-[9px] text-neutral-500 font-sans leading-tight">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: ASPECT RATIO LOCK */}
      <div className="space-y-3">
        <SectionTitle icon={<Maximize2 className="h-3 w-3" />}>Aspect Ratio Lock</SectionTitle>
        <p className="text-[10px] text-neutral-500 font-sans leading-relaxed -mt-1">
          Constrain output panels to a fixed aspect ratio. Padding is added to maintain the ratio.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ASPECT_RATIO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAspectRatioLock(opt.value)}
              className={`flex flex-col items-center gap-0.5 px-3 py-3 rounded-xl border text-center transition-all cursor-pointer ${
                aspectRatioLock === opt.value
                  ? "bg-violet-900/30 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.12)]"
                  : "bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
              }`}
            >
              <span className={`text-[12px] font-bold font-mono ${aspectRatioLock === opt.value ? "text-violet-300" : "text-neutral-300"}`}>
                {opt.label}
              </span>
              <span className="text-[8px] text-neutral-600 font-sans leading-tight">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
