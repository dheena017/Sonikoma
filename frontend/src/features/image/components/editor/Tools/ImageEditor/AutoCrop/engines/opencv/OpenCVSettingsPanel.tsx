import React from 'react';
import {
  Cpu,
  Sliders,
  Split,
  Layers,
  Activity,
  RotateCcw,
  Sparkles,
  Maximize2,
  Box,
  Eye,
  Check,
  Zap,
} from 'lucide-react';
import { useOpenCV } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/hooks/useOpenCV';

interface OpenCVSettingsPanelProps {
  cropSensitivity?: number;
  setCropSensitivity?: (v: number) => void;
  cropPaddingPx?: number;
  setCropPaddingPx?: (v: number) => void;
  cropBackgroundMode?: string;
  setCropBackgroundMode?: (v: string) => void;
  autoSplitTallStrips?: boolean;
  setAutoSplitTallStrips?: (v: boolean) => void;
  aspectRatioLock?: string;
  setAspectRatioLock?: (v: string) => void;
  minPanelAreaPct?: number;
  setMinPanelAreaPct?: (v: number) => void;
  overlapMergeThreshold?: number;
  setOverlapMergeThreshold?: (v: number) => void;
  cropMinHeightPx?: number;
  setCropMinHeightPx?: (v: number) => void;
  cropCannyLow?: number;
  setCropCannyLow?: (v: number) => void;
  cropCannyHigh?: number;
  setCropCannyHigh?: (v: number) => void;
  cropCloseKernelSize?: number;
  setCropCloseKernelSize?: (v: number) => void;
  [key: string]: any;
}

export function OpenCVSettingsPanel(props: OpenCVSettingsPanelProps) {
  const { settings: ctxSettings, updateSettings: updateCtxSettings } = useOpenCV();

  // Unified accessor for values (prefer props, fallback to context, fallback to defaults)
  const sensitivity = props.cropSensitivity ?? ctxSettings?.sensitivity ?? 30;
  const setSensitivity = props.setCropSensitivity || ((v: number) => updateCtxSettings({ sensitivity: v }));

  const paddingPx = props.cropPaddingPx ?? ctxSettings?.paddingPx ?? 10;
  const setPaddingPx = props.setCropPaddingPx || ((v: number) => updateCtxSettings({ paddingPx: v }));

  const bgMode = props.cropBackgroundMode ?? ctxSettings?.backgroundMode ?? "auto";
  const setBgMode = props.setCropBackgroundMode || ((v: string) => updateCtxSettings({ backgroundMode: v }));

  const autoSplit = props.autoSplitTallStrips ?? ctxSettings?.autoSplitTallStrips ?? true;
  const setAutoSplit = props.setAutoSplitTallStrips || ((v: boolean) => updateCtxSettings({ autoSplitTallStrips: v }));

  const aspectRatio = props.aspectRatioLock ?? ctxSettings?.aspectRatioLock ?? "free";
  const setAspectRatio = props.setAspectRatioLock || ((v: string) => updateCtxSettings({ aspectRatioLock: v }));

  const minAreaPct = props.minPanelAreaPct ?? ctxSettings?.minPanelAreaPct ?? 2.0;
  const setMinAreaPct = props.setMinPanelAreaPct || ((v: number) => updateCtxSettings({ minPanelAreaPct: v }));

  const mergeThreshold = props.overlapMergeThreshold ?? ctxSettings?.overlapMergeThreshold ?? 20;
  const setMergeThreshold = props.setOverlapMergeThreshold || ((v: number) => updateCtxSettings({ overlapMergeThreshold: v }));

  const minHeightPx = props.cropMinHeightPx ?? ctxSettings?.minHeightPx ?? 60;
  const setMinHeightPx = props.setCropMinHeightPx || ((v: number) => updateCtxSettings({ minHeightPx: v }));

  const cannyLow = props.cropCannyLow ?? ctxSettings?.cannyLow ?? 20;
  const setCannyLow = props.setCropCannyLow || ((v: number) => updateCtxSettings({ cannyLow: v }));

  const cannyHigh = props.cropCannyHigh ?? ctxSettings?.cannyHigh ?? 100;
  const setCannyHigh = props.setCropCannyHigh || ((v: number) => updateCtxSettings({ cannyHigh: v }));

  const closeKernelSize = props.cropCloseKernelSize ?? ctxSettings?.closeKernelSize ?? 15;
  const setCloseKernelSize = props.setCropCloseKernelSize || ((v: number) => updateCtxSettings({ closeKernelSize: v }));

  const handleApplyPreset = (preset: "balanced" | "fine" | "speech" | "webtoon") => {
    if (preset === "balanced") {
      setSensitivity(30);
      setMinHeightPx(60);
      setMergeThreshold(20);
      setMinAreaPct(2.0);
      setCannyLow(20);
      setCannyHigh(100);
      setCloseKernelSize(15);
      setPaddingPx(10);
      setBgMode("auto");
      setAutoSplit(true);
    } else if (preset === "fine") {
      setSensitivity(45);
      setMinHeightPx(40);
      setMergeThreshold(10);
      setMinAreaPct(1.0);
      setCannyLow(15);
      setCannyHigh(85);
      setCloseKernelSize(9);
      setPaddingPx(5);
      setBgMode("auto");
      setAutoSplit(true);
    } else if (preset === "speech") {
      setSensitivity(25);
      setMinHeightPx(100);
      setMergeThreshold(30);
      setMinAreaPct(3.0);
      setCannyLow(30);
      setCannyHigh(120);
      setCloseKernelSize(25);
      setPaddingPx(15);
      setBgMode("white");
      setAutoSplit(true);
    } else if (preset === "webtoon") {
      setSensitivity(20);
      setMinHeightPx(120);
      setMergeThreshold(40);
      setMinAreaPct(5.0);
      setCannyLow(40);
      setCannyHigh(150);
      setCloseKernelSize(31);
      setPaddingPx(12);
      setBgMode("white");
      setAutoSplit(true);
    }
  };

  const aspectRatios = [
    { label: "Free (Auto)", value: "free" },
    { label: "1:1 Square", value: "1:1" },
    { label: "4:3 Standard", value: "4:3" },
    { label: "16:9 Wide", value: "16:9" },
    { label: "9:16 Vertical", value: "9:16" },
    { label: "2:3 Manga", value: "2:3" },
  ];

  return (
    <div className="w-full space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* ── Engine Header Card ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">OpenCV Detection Engine</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ⚡ Local Hardware Accelerated
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              High-speed computer vision contour detection & webtoon seam analyzer
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleApplyPreset("balanced")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-300 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* ── Quick Presets Selector ── */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>OpenCV Quick Presets</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleApplyPreset("balanced")}
            className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-bold text-white group-hover:text-cyan-400 flex items-center justify-between">
              <span>Balanced</span>
              <Zap className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">Standard pages & comics</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("fine")}
            className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-bold text-white group-hover:text-cyan-400 flex items-center justify-between">
              <span>Fine Detail</span>
              <Sliders className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">Tight & small panels</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("speech")}
            className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-bold text-white group-hover:text-cyan-400 flex items-center justify-between">
              <span>Speech Shield</span>
              <Eye className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">Ignores dialog bubbles</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("webtoon")}
            className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
          >
            <div className="text-xs font-bold text-white group-hover:text-cyan-400 flex items-center justify-between">
              <span>Webtoon Strip</span>
              <Split className="w-3 h-3 text-cyan-400" />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">Long vertical strips</p>
          </button>
        </div>
      </div>

      {/* ── Core Contour & Background Settings ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/40 border border-neutral-850 space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Detection Thresholds & Background</span>
          </h4>
        </div>

        {/* Contour Sensitivity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300">Contour Edge Sensitivity</span>
            <span className="font-mono text-cyan-400 font-bold">{sensitivity}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={90}
            step={1}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
            <span>Low (Coarse)</span>
            <span>Balanced (30)</span>
            <span>High (Aggressive)</span>
          </div>
        </div>

        {/* Outer Padding Px */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300">Outer Crop Padding</span>
            <span className="font-mono text-cyan-400 font-bold">{paddingPx} px</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={paddingPx}
            onChange={(e) => setPaddingPx(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
            <span>0px (Tight)</span>
            <span>10px (Standard)</span>
            <span>50px (Loose)</span>
          </div>
        </div>

        {/* Background Color Mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 block">Gutter / Background Margin Mode</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'auto', label: '⚡ Auto Detect' },
              { id: 'white', label: '⚪ White Gutters' },
              { id: 'black', label: '⚫ Black Gutters' },
              { id: 'transparent', label: '🔍 Transparent' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setBgMode(mode.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  bgMode === mode.id
                    ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Webtoon Seam Slicer Toggle */}
        <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Webtoon Seam Slicer</span>
              <span className="text-[10px] text-neutral-400">Auto-detect gutters in tall vertical strips</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoSplit}
            onChange={(e) => setAutoSplit(e.target.checked)}
            className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
          />
        </label>
      </div>

      {/* ── Canny Edge & Morphology Fine Tuning ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/40 border border-neutral-850 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Canny Edge & Morphological Filter Tuning</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Canny Low */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">Canny Low Threshold</span>
              <span className="font-mono text-cyan-400 font-bold">{cannyLow}</span>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={1}
              value={cannyLow}
              onChange={(e) => setCannyLow(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Canny High */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">Canny High Threshold</span>
              <span className="font-mono text-cyan-400 font-bold">{cannyHigh}</span>
            </div>
            <input
              type="range"
              min={30}
              max={250}
              step={1}
              value={cannyHigh}
              onChange={(e) => setCannyHigh(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Morphological Close Kernel Size */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">Morphological Close Kernel Size</span>
            <span className="font-mono text-cyan-400 font-bold">{closeKernelSize} px</span>
          </div>
          <input
            type="range"
            min={3}
            max={51}
            step={2}
            value={closeKernelSize}
            onChange={(e) => setCloseKernelSize(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[10px] text-neutral-500 block">
            Fills gaps between panel border contours before bounding box calculation.
          </span>
        </div>
      </div>

      {/* ── Bounding Box Dimensions & Aspect Ratio ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/40 border border-neutral-850 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
          <Box className="w-4 h-4 text-cyan-400" />
          <span>Dimension Bounds & Aspect Ratios</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Min Panel Height */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">Min Height</span>
              <span className="font-mono text-cyan-400 font-bold">{minHeightPx} px</span>
            </div>
            <input
              type="range"
              min={20}
              max={300}
              step={5}
              value={minHeightPx}
              onChange={(e) => setMinHeightPx(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Min Area % */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">Min Area %</span>
              <span className="font-mono text-cyan-400 font-bold">{minAreaPct.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={20.0}
              step={0.5}
              value={minAreaPct}
              onChange={(e) => setMinAreaPct(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Overlap Merge Threshold */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">Merge Overlap</span>
              <span className="font-mono text-cyan-400 font-bold">{mergeThreshold} px</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={mergeThreshold}
              onChange={(e) => setMergeThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Panel Aspect Ratio Lock</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {aspectRatios.map((ar) => (
              <button
                key={ar.value}
                type="button"
                onClick={() => setAspectRatio(ar.value)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                  aspectRatio === ar.value
                    ? 'bg-cyan-950/40 border-cyan-500/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Config Summary Card ── */}
      <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Current Config:</span>
          <span className="font-mono text-neutral-400">
            {bgMode.toUpperCase()} bg • Sensitivity {sensitivity}% • Canny {cannyLow}/{cannyHigh} • Kernel {closeKernelSize}px • Padding {paddingPx}px
          </span>
        </div>
      </div>
    </div>
  );
}
