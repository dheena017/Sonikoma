import React from "react";
import { Scissors, X, RefreshCw, Sliders, Sparkles } from "lucide-react";

interface AutoCropModalProps {
  onClose: () => void;
  onApply: () => void;

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

  selectedCount: number;
  isApplying: boolean;
}

const BG_MODE_OPTIONS = [
  {
    value: "auto",
    label: "Auto-Detect BG",
    hint: "Automatically detect the margin boundary color based on corner/edge pixel samples.",
  },
  {
    value: "white",
    label: "Force White BG",
    hint: "Strictly treat white/off-white pixels as background gutters to trim.",
  },
  {
    value: "black",
    label: "Force Black BG",
    hint: "Strictly treat dark/black pixels as background gutters to trim.",
  },
];

const STRATEGY_OPTIONS = [
  {
    value: "balanced",
    label: "Balanced Quality",
    hint: "Optimized for speed and gutter precision. Standard for most comics.",
  },
  {
    value: "precise",
    label: "High Precision",
    hint: "Analyzes boundaries with finer steps. Best for complex layout borders.",
  },
  {
    value: "fast",
    label: "High Speed",
    hint: "Fast scans using coarser sample lines. Best for simple vertical layouts.",
  },
];

export default function AutoCropModal({
  onClose,
  onApply,
  sensitivity,
  setSensitivity,
  padding,
  setPadding,
  backgroundColorMode,
  setBackgroundColorMode,
  autoSplitTallStrips,
  setAutoSplitTallStrips,
  processingStrategy,
  setProcessingStrategy,
  selectedCount,
  isApplying,
}: AutoCropModalProps) {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 flex flex-col gap-0 animate-[fadeIn_0.18s_ease-out]">
      {/* ── Card shell ── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center">
              <Scissors className="h-4.5 w-4.5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Smart Auto-Crop Settings</h3>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                Configure smart CV border-detection parameters
                {selectedCount > 0 && (
                  <span className="ml-2 text-indigo-400 font-bold">
                    · {selectedCount} panel{selectedCount !== 1 ? "s" : ""} selected
                  </span>
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
          {/* LEFT COLUMN: Gutter Color + Strategy */}
          <div className="lg:col-span-7 space-y-8">
            {/* SECTION 1: BACKGROUND DETECTOR MODE */}
            <div className="space-y-3">
              <SectionTitle>Background Gutter Mode</SectionTitle>
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
                      <span
                        className={`text-[12px] font-bold font-mono block mb-1 ${
                          backgroundColorMode === opt.value
                            ? "text-white"
                            : "text-neutral-300"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <p className="text-[10px] text-neutral-500 font-sans leading-relaxed">
                        {opt.hint}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 2: PROCESSING STRATEGY */}
            <div className="space-y-3">
              <SectionTitle>Processing Strategy</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <span
                      className={`text-[11px] font-bold font-mono ${
                        processingStrategy === opt.value
                          ? "text-white"
                          : "text-neutral-300"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <p className="text-[9px] text-neutral-500 font-sans leading-tight">
                      {opt.hint}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sensitivity + Padding + Strategy */}
          <div className="lg:col-span-5 space-y-6">
            {/* SECTION 3: SENSITIVITY */}
            <div className="space-y-3">
              <SectionTitle>Detection Sensitivity</SectionTitle>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-neutral-300 font-sans">
                      Threshold tolerance
                    </p>
                    <p className="text-[10px] text-neutral-600 font-sans mt-0.5">
                      Adjusts background boundary sensitivity.
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums">
                    {sensitivity}
                    <span className="text-sm text-neutral-400 ml-0.5">%</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-neutral-800 rounded-full h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
                  <span>← High Tolerance</span>
                  <span>Strict Borders →</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: MARGIN PADDING */}
            <div className="space-y-3">
              <SectionTitle>Margin Padding</SectionTitle>
              <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-neutral-300 font-sans">
                      Outer border padding
                    </p>
                    <p className="text-[10px] text-neutral-600 font-sans mt-0.5">
                      Keeps whitespace border around panels.
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums">
                    {padding}
                    <span className="text-sm text-neutral-400 ml-0.5">px</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-neutral-800 rounded-full h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
                  <span>0px (Tight)</span>
                  <span>50px (Wide)</span>
                </div>
              </div>
            </div>

            {/* SECTION 5: OPTIONS CHECKBOXES */}
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 space-y-4">
              <label className="relative flex items-center gap-3 bg-neutral-900/30 border border-neutral-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-neutral-900 transition-all select-none">
                <input
                  type="checkbox"
                  checked={autoSplitTallStrips}
                  onChange={(e) => setAutoSplitTallStrips(e.target.checked)}
                  className="accent-indigo-500 h-4 w-4 rounded cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-white">
                    Auto-Split Strips
                  </span>
                  <span className="text-[9px] text-neutral-500 mt-0.5 leading-normal">
                    Automatically slices long vertical webtoon strips into individual scenes.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3">
          <p className="text-[10px] text-neutral-500 font-mono">
            {selectedCount === 0
              ? "⚠️  No panels selected — select panels first in the scraper deck"
              : `Ready to auto-crop ${selectedCount} panel${selectedCount !== 1 ? "s" : ""}`}
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold font-sans transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30 flex items-center gap-2 active:scale-95"
            >
              {isApplying ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {isApplying ? "Auto-Cropping…" : "Apply & Crop"}
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
