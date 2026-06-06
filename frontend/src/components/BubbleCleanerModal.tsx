import React from "react";
import { Brain, X, RefreshCw, Sparkles } from "lucide-react";

interface BubbleCleanerModalProps {
  onClose: () => void;
  onApply: () => void;

  detectionStyle: "all" | "white_only" | "text_only";
  setDetectionStyle: (v: "all" | "white_only" | "text_only") => void;

  eraseMethod: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black";
  setEraseMethod: (v: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black") => void;

  sensitivity: number;
  setSensitivity: (v: number) => void;

  selectedCount: number;
  isApplying: boolean;
}

const DETECTION_OPTIONS = [
  {
    value: "all" as const,
    label: "All Bubble Types",
    badge: "Default",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    dot: "bg-purple-500",
    hint: "Fires Gemini AI first, then OpenCV fallback. Catches every bubble type: white speech bubbles, colored narration boxes, and floating borderless text.",
  },
  {
    value: "white_only" as const,
    label: "White Bubbles Only",
    badge: "Fast",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dot: "bg-white border border-neutral-600",
    hint: "Skips Gemini. Pure OpenCV brightness-threshold mode. Only erases classic speech / shout / thought bubbles with bright white fill. Fastest option, no API cost.",
  },
  {
    value: "text_only" as const,
    label: "Floating Text Only",
    badge: "Targeted",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
    hint: "Groups dark text letter-strokes to erase narration boxes and borderless floating text drawn directly over colored art backgrounds.",
  },
];

const ERASE_OPTIONS = [
  {
    value: "auto" as const,
    label: "Auto (AI-Dispatch)",
    icon: "🤖",
    badge: "Recommended",
    hint: "AI classifies each detected region (white bubble / narration box / SFX) then automatically selects the best eraser for it.",
  },
  {
    value: "inpaint" as const,
    label: "Inpaint TELEA",
    icon: "🎨",
    badge: "Best Quality",
    hint: "Reconstructs background pixels using the TELEA inpainting algorithm. Highest visual quality for white speech bubbles.",
  },
  {
    value: "blur" as const,
    label: "Gaussian Blur",
    icon: "🌫️",
    badge: "Soft",
    hint: "Applies a heavy Gaussian blur over the region. Preserves background tone and color. Best for colored narration boxes.",
  },
  {
    value: "solid_white" as const,
    label: "Fill White",
    icon: "⬜",
    badge: null,
    hint: "Paints the detected bubble region with solid white pixels. Clean and simple.",
  },
  {
    value: "solid_black" as const,
    label: "Fill Black",
    icon: "⬛",
    badge: null,
    hint: "Paints the detected bubble region with solid black pixels.",
  },
];

const LEGEND = [
  { color: "bg-purple-500",  label: "Standard / Shout Bubbles",  desc: "White/off-white fill → OpenCV threshold → inpainted cleanly" },
  { color: "bg-orange-400",  label: "Narration Boxes",            desc: "Colored rectangles (dark/blue bg) → Gaussian blur kills text" },
  { color: "bg-sky-400",     label: "Floating Borderless Text",   desc: "Text drawn over art background → soft blur mask applied" },
  { color: "bg-red-400",     label: "SFX (BOOM / CRASH / POW)",   desc: "Embedded art-style text → kept as-is for visual feel" },
];

export default function BubbleCleanerModal({
  onClose,
  onApply,
  detectionStyle,
  setDetectionStyle,
  eraseMethod,
  setEraseMethod,
  sensitivity,
  setSensitivity,
  selectedCount,
  isApplying,
}: BubbleCleanerModalProps) {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 flex flex-col gap-0 animate-[fadeIn_0.18s_ease-out]">

      {/* ── Card shell ── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center">
              <Brain className="h-4.5 w-4.5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Bubble Cleaner Settings</h3>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                Configure what gets detected and how it is erased
                {selectedCount > 0 && (
                  <span className="ml-2 text-purple-400 font-bold">· {selectedCount} panel{selectedCount !== 1 ? "s" : ""} selected</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Detection + Erase */}
          <div className="lg:col-span-7 space-y-8">

            {/* SECTION 1: DETECTION STYLE */}
            <div className="space-y-3">
              <SectionTitle>What to Detect</SectionTitle>
              <div className="flex flex-col gap-2.5">
                {DETECTION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDetectionStyle(opt.value)}
                    className={`flex items-start gap-4 px-5 py-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      detectionStyle === opt.value
                        ? "bg-purple-900/25 border-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.08)]"
                        : "bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
                    }`}
                  >
                    {/* Color dot with active ring */}
                    <div className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${opt.dot} ${
                      detectionStyle === opt.value
                        ? "ring-2 ring-offset-2 ring-offset-neutral-900 ring-purple-500"
                        : ""
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className={`text-[12px] font-bold font-mono ${detectionStyle === opt.value ? "text-white" : "text-neutral-300"}`}>
                          {opt.label}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold uppercase tracking-wider ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-sans leading-relaxed">{opt.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 2: ERASE METHOD */}
            <div className="space-y-3">
              <SectionTitle>How to Erase</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ERASE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEraseMethod(opt.value)}
                    className={`flex flex-col gap-1.5 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      eraseMethod === opt.value
                        ? "bg-indigo-900/25 border-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.08)]"
                        : "bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{opt.icon}</span>
                      <span className={`text-[11px] font-bold font-mono ${eraseMethod === opt.value ? "text-white" : "text-neutral-300"}`}>
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-mono font-bold uppercase tracking-wider">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 font-sans leading-relaxed">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sensitivity + Legend */}
          <div className="lg:col-span-5 space-y-6">

            {/* SECTION 3: SENSITIVITY */}
            <div className="space-y-3">
              <SectionTitle>Detection Sensitivity</SectionTitle>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-neutral-300 font-sans">Threshold aggressiveness</p>
                    <p className="text-[10px] text-neutral-600 font-sans mt-0.5">Controls the OpenCV brightness threshold.</p>
                  </div>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums">
                    {sensitivity}<span className="text-sm text-neutral-400 ml-0.5">%</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-neutral-800 rounded-full h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
                  <span>← Conservative</span>
                  <span>Aggressive →</span>
                </div>
                <p className="text-[10px] text-neutral-500 font-sans border-t border-neutral-800 pt-3">
                  Lower values avoid erasing light-colored art. Higher values catch more pale or off-white bubbles that sit close to the panel background.
                </p>
              </div>
            </div>

            {/* SECTION 4: LEGEND */}
            <div className="space-y-3">
              <SectionTitle>Bubble Type Legend</SectionTitle>
              <div className="flex flex-col gap-2">
                {LEGEND.map(item => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 bg-neutral-950/50 border border-neutral-800/60 rounded-xl px-4 py-3"
                  >
                    <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} />
                    <div>
                      <p className="text-[11px] font-bold text-neutral-200 font-mono">{item.label}</p>
                      <p className="text-[9px] text-neutral-500 font-sans mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Config Badge */}
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Active Config</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] px-2 py-1 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-800/50 font-mono font-bold">
                  {detectionStyle}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 font-mono font-bold">
                  {eraseMethod}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 font-mono font-bold">
                  {sensitivity}% sensitivity
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3">
          <p className="text-[10px] text-neutral-500 font-mono">
            {selectedCount === 0
              ? "⚠️  No panels selected — select panels first in the scraper deck"
              : `Ready to clean ${selectedCount} panel${selectedCount !== 1 ? "s" : ""}`}
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold font-sans transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onApply}
              disabled={isApplying || selectedCount === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-sans transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30 flex items-center gap-2 active:scale-95"
            >
              {isApplying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
              {isApplying ? "Cleaning…" : "Apply & Clean"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-neutral-800" />
      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono whitespace-nowrap px-1">
        {children}
      </span>
      <div className="h-px flex-1 bg-neutral-800" />
    </div>
  );
}
