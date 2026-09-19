import React, { useState } from "react";
import {
  Zap,
  Smartphone,
  BookOpen,
  Film,
  Square,
  Maximize,
  Sliders,
  Sparkles,
  Layers,
  Settings2,
  Palette,
  Scissors,
  Shield,
  Eye,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Monitor,
  LayoutGrid,
  Volume2,
  MessageSquare,
  ArrowDownUp,
  SlidersHorizontal,
} from "lucide-react";

export type PresetType =
  | "webtoon"
  | "manga"
  | "shorts"
  | "landscape"
  | "square"
  | "granular"
  | "safe_bleed";

export interface AutoCropTuningTabProps {
  padding: number;
  sensitivity: number;
  aspectRatioLock: string;
  backgroundColorMode: string;
  minPanelHeightPx?: number;
  overlapMergeThreshold?: number;
  outputFormat?: string;
  outputQuality?: number;
  filterGutterSfx?: boolean;
  mergeSpeechBubbles?: boolean;
  autoTrimGutter?: boolean;
  readingFlow?: string;
  onPaddingChange: (val: number) => void;
  onSensitivityChange: (val: number) => void;
  onAspectRatioChange: (val: string) => void;
  onBackgroundColorModeChange: (val: string) => void;
  onMinPanelHeightChange?: (val: number) => void;
  onOverlapMergeThresholdChange?: (val: number) => void;
  onOutputFormatChange?: (val: string) => void;
  onOutputQualityChange?: (val: number) => void;
  onFilterGutterSfxChange?: (val: boolean) => void;
  onMergeSpeechBubblesChange?: (val: boolean) => void;
  onAutoTrimGutterChange?: (val: boolean) => void;
  onReadingFlowChange?: (val: string) => void;
  onApplyPreset: (preset: any) => void;
  onApplySettingsAndRecrop: () => void;
}

export function AutoCropTuningTab({
  padding,
  sensitivity,
  aspectRatioLock,
  backgroundColorMode,
  minPanelHeightPx = 80,
  overlapMergeThreshold = 8,
  outputFormat = "webp",
  outputQuality = 90,
  filterGutterSfx = true,
  mergeSpeechBubbles = true,
  autoTrimGutter = true,
  readingFlow = "top_to_bottom",
  onPaddingChange,
  onSensitivityChange,
  onAspectRatioChange,
  onBackgroundColorModeChange,
  onMinPanelHeightChange,
  onOverlapMergeThresholdChange,
  onOutputFormatChange,
  onOutputQualityChange,
  onFilterGutterSfxChange,
  onMergeSpeechBubblesChange,
  onAutoTrimGutterChange,
  onReadingFlowChange,
  onApplyPreset,
  onApplySettingsAndRecrop,
}: AutoCropTuningTabProps) {
  const [activePreset, setActivePreset] = useState<PresetType>("webtoon");
  const [applyScope, setApplyScope] = useState<"current" | "all">("current");

  const handleSelectPreset = (preset: PresetType) => {
    setActivePreset(preset);
    onApplyPreset(preset);
    switch (preset) {
      case "webtoon":
        onPaddingChange(8);
        onSensitivityChange(50);
        onAspectRatioChange("free");
        onBackgroundColorModeChange("auto");
        onMinPanelHeightChange?.(80);
        onReadingFlowChange?.("top_to_bottom");
        break;
      case "manga":
        onPaddingChange(4);
        onSensitivityChange(70);
        onAspectRatioChange("free");
        onBackgroundColorModeChange("white");
        onMinPanelHeightChange?.(60);
        onReadingFlowChange?.("right_to_left");
        break;
      case "shorts":
        onPaddingChange(12);
        onSensitivityChange(45);
        onAspectRatioChange("9:16");
        onBackgroundColorModeChange("black");
        onMinPanelHeightChange?.(120);
        break;
      case "landscape":
        onPaddingChange(10);
        onSensitivityChange(45);
        onAspectRatioChange("16:9");
        onBackgroundColorModeChange("auto");
        break;
      case "square":
        onPaddingChange(6);
        onSensitivityChange(50);
        onAspectRatioChange("1:1");
        onBackgroundColorModeChange("auto");
        break;
      case "granular":
        onPaddingChange(2);
        onSensitivityChange(85);
        onAspectRatioChange("free");
        onMinPanelHeightChange?.(40);
        break;
      case "safe_bleed":
        onPaddingChange(22);
        onSensitivityChange(35);
        onAspectRatioChange("free");
        break;
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl border border-neutral-800 bg-neutral-950/90 space-y-6 animate-in fade-in duration-150 select-none">
      {/* ── 1. SMART DETECTION PRESETS ── */}
      <div className="space-y-2.5 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span>AI Detection & Cropping Presets</span>
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            Click a preset to auto-configure all parameters
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {/* Preset 1: Webtoon */}
          <button
            type="button"
            onClick={() => handleSelectPreset("webtoon")}
            className={`p-2.5 rounded-2xl border text-xs font-medium transition-all flex flex-col items-center text-center gap-1.5 !cursor-pointer active:scale-95 ${
              activePreset === "webtoon"
                ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10 font-bold"
                : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
            }`}
          >
            <Smartphone className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] leading-tight">Webtoon</span>
            <span className="text-[9px] text-neutral-500 font-mono">Vertical Strip</span>
          </button>

          {/* Preset 2: Manga */}
          <button
            type="button"
            onClick={() => handleSelectPreset("manga")}
            className={`p-2.5 rounded-2xl border text-xs font-medium transition-all flex flex-col items-center text-center gap-1.5 !cursor-pointer active:scale-95 ${
              activePreset === "manga"
                ? "bg-purple-500/15 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10 font-bold"
                : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4 text-purple-400" />
            <span className="text-[11px] leading-tight">Manga Page</span>
            <span className="text-[9px] text-neutral-500 font-mono">Right-to-Left</span>
          </button>

          {/* Preset 3: Shorts 9:16 */}
          <button
            type="button"
            onClick={() => handleSelectPreset("shorts")}
            className={`p-2.5 rounded-2xl border text-xs font-medium transition-all flex flex-col items-center text-center gap-1.5 !cursor-pointer active:scale-95 ${
              activePreset === "shorts"
                ? "bg-sky-500/15 border-sky-500 text-sky-300 shadow-md shadow-sky-500/10 font-bold"
                : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
            }`}
          >
            <Film className="h-4 w-4 text-sky-400" />
            <span className="text-[11px] leading-tight">9:16 Shorts</span>
            <span className="text-[9px] text-neutral-500 font-mono">TikTok / Reels</span>
          </button>

          {/* Preset 4: 16:9 Landscape */}
          <button
            type="button"
            onClick={() => handleSelectPreset("landscape")}
            className={`p-2.5 rounded-2xl border text-xs font-medium transition-all flex flex-col items-center text-center gap-1.5 !cursor-pointer active:scale-95 ${
              activePreset === "landscape"
                ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 font-bold"
                : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
            }`}
          >
            <Monitor className="h-4 w-4 text-amber-400" />
            <span className="text-[11px] leading-tight">16:9 Video</span>
            <span className="text-[9px] text-neutral-500 font-mono">Landscape Frame</span>
          </button>

          {/* Preset 5: 1:1 Square */}
          <button
            type="button"
            onClick={() => handleSelectPreset("square")}
            className={`p-2.5 rounded-2xl border text-xs font-medium transition-all flex flex-col items-center text-center gap-1.5 !cursor-pointer active:scale-95 ${
              activePreset === "square"
                ? "bg-pink-500/15 border-pink-500 text-pink-300 shadow-md shadow-pink-500/10 font-bold"
                : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
            }`}
          >
            <Square className="h-4 w-4 text-pink-400" />
            <span className="text-[11px] leading-tight">1:1 Square</span>
            <span className="text-[9px] text-neutral-500 font-mono">Instagram Feed</span>
          </button>

          {/* Preset 6: Granular / Detail */}
          <button
            type="button"
            onClick={() => handleSelectPreset("granular")}
            className={`p-2.5 rounded-2xl border text-xs font-medium transition-all flex flex-col items-center text-center gap-1.5 !cursor-pointer active:scale-95 ${
              activePreset === "granular"
                ? "bg-teal-500/15 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10 font-bold"
                : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
            }`}
          >
            <Scissors className="h-4 w-4 text-teal-400" />
            <span className="text-[11px] leading-tight">Granular</span>
            <span className="text-[9px] text-neutral-500 font-mono">Deep Seams (85%)</span>
          </button>

          {/* Preset 7: Safe Bleed */}
          <button
            type="button"
            onClick={() => handleSelectPreset("safe_bleed")}
            className={`p-2.5 rounded-2xl border text-xs font-medium transition-all flex flex-col items-center text-center gap-1.5 !cursor-pointer active:scale-95 ${
              activePreset === "safe_bleed"
                ? "bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10 font-bold"
                : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
            }`}
          >
            <Shield className="h-4 w-4 text-indigo-400" />
            <span className="text-[11px] leading-tight">Safe Bleed</span>
            <span className="text-[9px] text-neutral-500 font-mono">+22px Margins</span>
          </button>
        </div>
      </div>

      {/* ── 2. CORE DETECTION & GUTTER TUNING SLIDERS ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
          <span>Gutter & Sensitivity Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bleed Padding */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Bleed Padding</span>
              </label>
              <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800">
                {padding}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={padding}
              onChange={(e) => onPaddingChange(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-neutral-400 block leading-tight">
              Expands outer boundary to keep border artwork & sound FX intact.
            </span>
          </div>

          {/* Gutter Sensitivity */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-emerald-400" />
                <span>Gutter Sensitivity</span>
              </label>
              <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800">
                {sensitivity}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              value={sensitivity}
              onChange={(e) => onSensitivityChange(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-neutral-400 block leading-tight">
              Higher = finds subtle gaps; lower = groups larger continuous scenes.
            </span>
          </div>

          {/* Min Panel Height Filter */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <ArrowDownUp className="h-3.5 w-3.5 text-teal-400" />
                <span>Min Panel Height</span>
              </label>
              <span className="text-xs font-mono text-teal-300 font-bold px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800">
                {minPanelHeightPx}px
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="300"
              step="5"
              value={minPanelHeightPx}
              onChange={(e) => onMinPanelHeightChange?.(parseInt(e.target.value, 10))}
              className="w-full accent-teal-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-neutral-400 block leading-tight">
              Filters out accidental artifact slivers and speckles below this size.
            </span>
          </div>

          {/* Seam Merge Threshold */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-sky-400" />
                <span>Seam Merge Gap</span>
              </label>
              <span className="text-xs font-mono text-sky-300 font-bold px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800">
                {overlapMergeThreshold}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="2"
              value={overlapMergeThreshold}
              onChange={(e) => onOverlapMergeThresholdChange?.(parseInt(e.target.value, 10))}
              className="w-full accent-sky-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-neutral-400 block leading-tight">
              Automatically bridges micro-gutters smaller than this gap distance.
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. FRAMING, PALETTE & OUTPUT CONFIGURATION ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 uppercase tracking-wider">
          <Settings2 className="h-4 w-4 text-emerald-400" />
          <span>Framing, Palette & Output Format</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Aspect Ratio Lock */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Maximize className="h-3.5 w-3.5 text-emerald-400" />
              <span>Aspect Ratio Lock</span>
            </label>
            <select
              value={aspectRatioLock}
              onChange={(e) => onAspectRatioChange(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
            >
              <option value="free">Free / Natural Proportions</option>
              <option value="9:16">9:16 (Vertical Shorts / Reels)</option>
              <option value="16:9">16:9 (Landscape HD Video)</option>
              <option value="1:1">1:1 (Square Carousel)</option>
              <option value="4:3">4:3 (Classic Comic)</option>
              <option value="21:9">21:9 (Ultrawide Panoramic)</option>
            </select>
            <span className="text-[10px] text-neutral-400 block">
              Constrains slices to exact frame ratios.
            </span>
          </div>

          {/* Background Seam Palette */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-purple-400" />
              <span>Gutter Seam Palette</span>
            </label>
            <select
              value={backgroundColorMode}
              onChange={(e) => onBackgroundColorModeChange(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
            >
              <option value="auto">Auto-Detect Background</option>
              <option value="white">White Gutter Margins</option>
              <option value="black">Dark / Pure Black Gutter</option>
              <option value="transparent">Alpha / Transparent Seams</option>
            </select>
            <span className="text-[10px] text-neutral-400 block">
              Colors matched when isolating panel bounds.
            </span>
          </div>

          {/* Reading Flow Orientation */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Reading Flow</span>
            </label>
            <select
              value={readingFlow}
              onChange={(e) => onReadingFlowChange?.(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
            >
              <option value="top_to_bottom">Vertical Strip (Webtoon)</option>
              <option value="right_to_left">Right-to-Left (Manga / RTL)</option>
              <option value="left_to_right">Left-to-Right (Western Comic)</option>
            </select>
            <span className="text-[10px] text-neutral-400 block">
              Dictates panel numbering & slice order.
            </span>
          </div>

          {/* Output Format & Quality */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export Format</span>
            </label>
            <select
              value={outputFormat}
              onChange={(e) => onOutputFormatChange?.(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
            >
              <option value="webp">WebP (Optimized & Fast)</option>
              <option value="png">PNG (Lossless Crystal Sharp)</option>
              <option value="jpeg">JPEG (Standard Photo)</option>
            </select>
            <span className="text-[10px] text-neutral-400 block">
              Generated slice compression format.
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. AI ENHANCEMENTS & HEURISTICS TOGGLES ── */}
      <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/90 space-y-3">
        <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>AI Vision Guards & Heuristics</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Toggle 1: Speech Bubble Protection */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-neutral-200 block">Bubble Guard</span>
                <span className="text-[10px] text-neutral-500 block">Avoids slicing speech balloons</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={mergeSpeechBubbles}
              onChange={(e) => onMergeSpeechBubblesChange?.(e.target.checked)}
              className="accent-emerald-500 h-4 w-4 rounded cursor-pointer"
            />
          </label>

          {/* Toggle 2: Filter Gutter SFX */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-neutral-200 block">Gutter SFX Filter</span>
                <span className="text-[10px] text-neutral-500 block">Ignores sound effect marks</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={filterGutterSfx}
              onChange={(e) => onFilterGutterSfxChange?.(e.target.checked)}
              className="accent-emerald-500 h-4 w-4 rounded cursor-pointer"
            />
          </label>

          {/* Toggle 3: Auto-Trim Blank Gutters */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <Scissors className="h-4 w-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-neutral-200 block">Auto Gutter Trim</span>
                <span className="text-[10px] text-neutral-500 block">Strips excessive white/black margins</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoTrimGutter}
              onChange={(e) => onAutoTrimGutterChange?.(e.target.checked)}
              className="accent-emerald-500 h-4 w-4 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* ── 5. BOTTOM ACTION FOOTER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-neutral-900">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">Apply Scope:</span>
          <div className="flex items-center bg-neutral-900 rounded-xl p-0.5 border border-neutral-800">
            <button
              type="button"
              onClick={() => setApplyScope("current")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all !cursor-pointer ${
                applyScope === "current"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Current Strip
            </button>
            <button
              type="button"
              onClick={() => setApplyScope("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all !cursor-pointer ${
                applyScope === "all"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All Strip Batch
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onApplySettingsAndRecrop}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 transition-all !cursor-pointer shadow-xl shadow-emerald-500/20 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Apply Parameters & Re-Detect ({applyScope === "all" ? "All" : "Current"})</span>
        </button>
      </div>
    </div>
  );
}

export default AutoCropTuningTab;
