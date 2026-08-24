import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Scissors,
  X,
  Sparkles,
  RotateCcw,
  Cpu,
  Layers,
  Brain,
  Zap,
  Check,
  Play,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  Info,
  Maximize2,
} from "lucide-react";
import { useAIModels } from "@/features/ai_core/hooks/useAIModels";
import * as api from "@/api";
import { getProxiedImageUrl } from "@/utils";

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
  aspectRatioLock: string;
  setAspectRatioLock: (v: string) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (v: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (v: number) => void;
  useLocalCV: boolean;
  setUseLocalCV: (v: boolean) => void;

  // Advanced States
  cropModel: string;
  setCropModel: (v: string) => void;
  cropMinHeightPx: number;
  setCropMinHeightPx: (v: number) => void;
  cropCannyLow: number;
  setCropCannyLow: (v: number) => void;
  cropCannyHigh: number;
  setCropCannyHigh: (v: number) => void;
  cropCloseKernelSize: number;
  setCropCloseKernelSize: (v: number) => void;
  activeTab?: string;
  setActiveTab?: (v: string) => void;
  cropGuidance?: string;
  setCropGuidance?: (v: string) => void;
  cropFocusMode?: string;
  setCropFocusMode?: (v: string) => void;

  selectedCount: number;
  isApplying: boolean;
  scrapedImages: string[];
  selectedScraped: string[];
  setSelectedScraped?: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification?: (msg: string, type: any) => void;
  isPage?: boolean;
  fetchWithInterceptor?: any;
}

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
  aspectRatioLock,
  setAspectRatioLock,
  minPanelAreaPct,
  setMinPanelAreaPct,
  overlapMergeThreshold,
  setOverlapMergeThreshold,
  useLocalCV,
  setUseLocalCV,

  cropModel,
  setCropModel,
  cropMinHeightPx,
  setCropMinHeightPx,
  cropCannyLow,
  setCropCannyLow,
  cropCannyHigh,
  setCropCannyHigh,
  cropCloseKernelSize,
  setCropCloseKernelSize,

  selectedCount,
  isApplying,
  scrapedImages = [],
  selectedScraped = [],
  setSelectedScraped,
  setConsoleLogs,
  addNotification,
  isPage = false,
  fetchWithInterceptor,
}: AutoCropModalProps) {
  const { models } = useAIModels();
  
  // Dynamically group vision-capable models from backend catalog
  const visionModels = useMemo(() => {
    return models.filter(
      (m) =>
        m.capabilities?.includes("vision") ||
        m.category?.toLowerCase().includes("vision") ||
        m.provider?.toLowerCase() === "google" ||
        m.id.toLowerCase().includes("vision")
    );
  }, [models]);

  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [isTesting, setIsTesting] = useState(false);
  const [testBoxes, setTestBoxes] = useState<any[]>([]);
  const [testDimensions, setTestDimensions] = useState<{ width: number; height: number } | null>(null);
  const [testStats, setTestStats] = useState<{ count: number; timeMs: number } | null>(null);

  const targetList = selectedScraped.length > 0 ? selectedScraped : scrapedImages;
  const currentImageUrl = targetList[activeImageIdx] || targetList[0] || null;

  // Reset test boxes when switching images
  useEffect(() => {
    setTestBoxes([]);
    setTestDimensions(null);
    setTestStats(null);
  }, [activeImageIdx, currentImageUrl]);

  // Synchronize active model dynamically from catalog
  useEffect(() => {
    if (!cropModel && visionModels.length > 0) {
      setCropModel(visionModels[0].id);
    }
  }, [cropModel, visionModels, setCropModel]);

  const handleResetDefaults = () => {
    setSensitivity(30);
    setPadding(10);
    setBackgroundColorMode("auto");
    setAutoSplitTallStrips(true);
    setAspectRatioLock("free");
    setMinPanelAreaPct(2);
    setOverlapMergeThreshold(20);
    setUseLocalCV(true);
    if (visionModels.length > 0) {
      setCropModel(visionModels[0].id);
    }
    setTestBoxes([]);
    setTestDimensions(null);
    setTestStats(null);
    addNotification?.("Reset all crop settings to default values.", "info");
  };

  const handleRunSingleTest = async () => {
    if (!currentImageUrl) {
      addNotification?.("Please select an image to test detection on.", "warning");
      return;
    }

    setIsTesting(true);
    setTestBoxes([]);
    setTestDimensions(null);
    setTestStats(null);
    const startTime = performance.now();

    try {
      const payload = {
        url: currentImageUrl,
        strategy: useLocalCV ? "local-cv" : "ai",
        model: cropModel || (visionModels[0]?.id ?? undefined),
        sensitivity: Number(sensitivity),
        paddingPx: Number(padding),
        aspectRatio: aspectRatioLock,
        autoSplit: autoSplitTallStrips,
        minAreaPct: Number(minPanelAreaPct) / 100,
        mergeThreshold: Number(overlapMergeThreshold),
        cannyLow: Number(cropCannyLow),
        cannyHigh: Number(cropCannyHigh),
        closeKernelSize: Number(cropCloseKernelSize),
        minHeightPx: Number(cropMinHeightPx),
      };

      const res = await api.aiSmartCrop(fetchWithInterceptor || fetch, payload);
      const elapsed = Math.round(performance.now() - startTime);

      const detectedPanels = res?.panels || res?.boxes || [];
      const imageW = res?.imageWidth || res?.width || null;
      const imageH = res?.imageHeight || res?.height || null;

      if (imageW && imageH) {
        setTestDimensions({ width: imageW, height: imageH });
      }

      if (Array.isArray(detectedPanels) && detectedPanels.length > 0) {
        setTestBoxes(detectedPanels);
        setTestStats({ count: detectedPanels.length, timeMs: elapsed });
        addNotification?.(
          `Detected ${detectedPanels.length} panels in ${elapsed}ms!`,
          "success"
        );
      } else {
        setTestStats({ count: 0, timeMs: elapsed });
        addNotification?.("Detection completed: No panel boundaries found.", "info");
      }
    } catch (err: any) {
      console.error("[AutoCropModal] Single detection test failed:", err);
      addNotification?.(
        `Test detection failed: ${err?.message || "Internal server error"}`,
        "error"
      );
    } finally {
      setIsTesting(false);
    }
  };

  // Calculate real bounding box percentage position without hardcoded math
  const computeBoxCoordinates = (box: any) => {
    // 1. Normalized Box [ymin, xmin, ymax, xmax]
    if (Array.isArray(box.box) && box.box.length === 4) {
      const [ymin, xmin, ymax, xmax] = box.box;
      if (ymax > 1 || xmax > 1) {
        return {
          left: `${(xmin / 1000) * 100}%`,
          top: `${(ymin / 1000) * 100}%`,
          width: `${((xmax - xmin) / 1000) * 100}%`,
          height: `${((ymax - ymin) / 1000) * 100}%`,
        };
      }
      return {
        left: `${xmin * 100}%`,
        top: `${ymin * 100}%`,
        width: `${(xmax - xmin) * 100}%`,
        height: `${(ymax - ymin) * 100}%`,
      };
    }

    // 2. Pixel coordinates { x, y, w, h } with image dimensions
    if (
      testDimensions &&
      typeof box.x === "number" &&
      typeof box.w === "number" &&
      testDimensions.width > 0 &&
      testDimensions.height > 0
    ) {
      return {
        left: `${(box.x / testDimensions.width) * 100}%`,
        top: `${(box.y / testDimensions.height) * 100}%`,
        width: `${(box.w / testDimensions.width) * 100}%`,
        height: `${(box.h / testDimensions.height) * 100}%`,
      };
    }

    // 3. Pre-calculated percentages { pctX, pctY, pctW, pctH }
    if (typeof box.pctX === "number") {
      return {
        left: `${box.pctX}%`,
        top: `${box.pctY}%`,
        width: `${box.pctW}%`,
        height: `${box.pctH}%`,
      };
    }

    return null;
  };

  const aspectRatios = [
    { id: "free", label: "Free" },
    { id: "16:9", label: "16:9" },
    { id: "9:16", label: "9:16" },
    { id: "1:1", label: "1:1" },
    { id: "4:3", label: "4:3" },
  ];

  return (
    <div className="w-full bg-[#050508] text-white p-6 sm:p-8 space-y-6">
      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.25)] flex-shrink-0">
            <Scissors className="h-6 w-6 text-purple-300" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Auto-Crop & Panel Slicer
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO CV
              </span>
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Automated comic panel segmentation using local OpenCV or Gemini Multimodal Vision
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all text-xs font-mono font-bold cursor-pointer active:scale-95 shadow-sm"
            title="Reset parameters to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5 text-neutral-400" />
            <span>Reset</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer text-xs font-bold font-mono active:scale-95 shadow-sm"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Main 2-Column Grid Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Strategy & Core Parameter Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 1: Engine Strategy Selector */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
              Detection Engine
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* OpenCV Button */}
              <button
                onClick={() => setUseLocalCV(true)}
                className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer relative ${
                  useLocalCV
                    ? "bg-purple-950/40 border-purple-500/60 shadow-[0_0_16px_rgba(168,85,247,0.2)] text-white"
                    : "bg-neutral-900/40 border-white/5 hover:border-white/15 text-neutral-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-purple-400" />
                  </div>
                  {useLocalCV && (
                    <span className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">OpenCV Engine</div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Local CV · 0s latency · 0 credits
                  </div>
                </div>
              </button>

              {/* Gemini Vision AI Button */}
              <button
                onClick={() => setUseLocalCV(false)}
                className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer relative ${
                  !useLocalCV
                    ? "bg-purple-950/40 border-purple-500/60 shadow-[0_0_16px_rgba(168,85,247,0.2)] text-white"
                    : "bg-neutral-900/40 border-white/5 hover:border-white/15 text-neutral-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </div>
                  {!useLocalCV && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Gemini AI Vision</div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Deep multimodal understanding
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Model Dropdown (when AI engine is active) */}
          {!useLocalCV && (
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-neutral-300">
                  Vision Model
                </label>
                <span className="text-[10px] font-mono text-purple-400">
                  Google Gemini Catalog
                </span>
              </div>
              <div className="relative">
                <select
                  value={cropModel}
                  onChange={(e) => setCropModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {visionModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.id} {m.speed_rating ? `— ${m.speed_rating}` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Section 3: Core Parameters Card */}
          <div className="p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 space-y-5 shadow-lg">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              Segmentation Parameters
            </h3>

            {/* Edge Sensitivity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-200">Edge Sensitivity</span>
                <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                  {sensitivity}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={1}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full h-2 bg-neutral-950 rounded-full appearance-none cursor-pointer accent-purple-500 border border-white/5"
              />
              <div className="flex justify-between text-[9px] font-mono text-neutral-500 px-0.5">
                <span>10% (Tolerant)</span>
                <span>50% (Default)</span>
                <span>90% (Strict)</span>
              </div>
            </div>

            {/* Padding Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-200">Panel Padding</span>
                <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                  {padding}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={2}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full h-2 bg-neutral-950 rounded-full appearance-none cursor-pointer accent-purple-500 border border-white/5"
              />
              <div className="flex justify-between text-[9px] font-mono text-neutral-500 px-0.5">
                <span>0px (Tight)</span>
                <span>10px (Standard)</span>
                <span>40px (Spacious)</span>
              </div>
            </div>

            {/* Aspect Ratio Locking */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-neutral-200 block">
                Aspect Ratio Lock
              </label>
              <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                {aspectRatios.map((ratio) => {
                  const isActive = aspectRatioLock === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatioLock(ratio.id)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {ratio.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Tall Strips Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
              <div>
                <div className="text-xs font-semibold text-neutral-200">
                  Split Tall Webtoon Strips
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Slice long vertical scrolls into individual frames
                </div>
              </div>
              <button
                onClick={() => setAutoSplitTallStrips(!autoSplitTallStrips)}
                className={`relative inline-flex h-5 w-10 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                  autoSplitTallStrips ? "bg-purple-600" : "bg-neutral-800"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out my-auto ml-0.5 ${
                    autoSplitTallStrips ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Interactive Live Test & Preview */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Image Selector Tray */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                Target Test Image ({targetList.length} total)
              </span>
              <span className="text-neutral-500">
                Page {activeImageIdx + 1} of {Math.max(1, targetList.length)}
              </span>
            </div>

            {/* Thumbnail Scroll Tray */}
            {targetList.length > 0 ? (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {targetList.map((imgUrl, idx) => {
                  const isSelected = activeImageIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)] scale-105"
                          : "border-neutral-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={getProxiedImageUrl(imgUrl)}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-mono px-1 rounded text-white">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-neutral-800 text-center text-xs font-mono text-neutral-500">
                No images available in this chapter. Scrape or import images first.
              </div>
            )}
          </div>

          {/* Interactive Preview Canvas */}
          <div className="space-y-3">
            <div className="relative w-full h-[380px] bg-neutral-950 rounded-3xl border border-neutral-800/80 overflow-hidden flex items-center justify-center shadow-xl group">
              {currentImageUrl ? (
                <div className="relative w-full h-full flex items-center justify-center p-3">
                  <img
                    src={getProxiedImageUrl(currentImageUrl)}
                    alt="Active Canvas"
                    className="max-w-full max-h-full object-contain rounded-lg select-none pointer-events-none"
                  />

                  {/* Overlaid Detected Slices / Bounding Boxes */}
                  {testBoxes.map((box, bIdx) => {
                    const coords = computeBoxCoordinates(box);
                    if (!coords) return null;

                    return (
                      <div
                        key={bIdx}
                        className="absolute border-2 border-emerald-400 bg-emerald-400/15 pointer-events-none rounded transition-all animate-fadeIn shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                        style={{
                          left: coords.left,
                          top: coords.top,
                          width: coords.width,
                          height: coords.height,
                        }}
                      >
                        <span className="absolute -top-3 left-1 bg-emerald-500 text-black text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shadow">
                          #{bIdx + 1}
                        </span>
                      </div>
                    );
                  })}

                  {/* Test Stats Pill */}
                  {testStats && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono text-emerald-400 shadow-lg">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>
                        {testStats.count} Panels Detected ({testStats.timeMs}ms)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-600 font-mono text-xs">
                  <ImageIcon className="h-8 w-8" />
                  <span>No image selected</span>
                </div>
              )}
            </div>

            {/* Test Action Buttons Bar */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handleRunSingleTest}
                disabled={isTesting || !currentImageUrl}
                className="flex-1 py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md active:scale-98"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-purple-400 fill-purple-400" />
                    <span>Test Detection on Current Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Action Footer ───────────────────────────────────────── */}
      <div className="pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs font-mono text-neutral-400">
          <Info className="h-4 w-4 text-purple-400 flex-shrink-0" />
          <span>
            {targetList.length > 0
              ? `Ready to crop ${targetList.length} image${targetList.length > 1 ? "s" : ""} and push sliced panels to Storyboard Timeline.`
              : "No images loaded in current chapter."}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            disabled={isApplying || targetList.length === 0}
            className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 active:scale-95 border border-purple-400/30 disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cropping Panels...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-purple-200" />
                <span>
                  Auto-Crop All ({targetList.length} Images)
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
