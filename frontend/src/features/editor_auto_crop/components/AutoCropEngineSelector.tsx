import React, { useState, useEffect } from "react";
import * as api from "@/api";
import {
  Cpu,
  ChevronDown,
  Settings2,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Clock,
  Radio,
  Terminal,
} from "lucide-react";
import SectionTitle from "@/features/editor_image/components/SectionTitle";
import { useAIModels } from "@/features/ai_core/hooks/useAIModels";

interface Props {
  useLocalCV: boolean;
  setUseLocalCV: (v: boolean) => void;
  cropModel: string;
  setCropModel: (v: string) => void;

  // OpenCV Props
  cropSensitivity: number;
  setCropSensitivity: (v: number) => void;
  cropPaddingPx?: number;
  setCropPaddingPx?: (v: number) => void;
  aspectRatioLock?: string;
  setAspectRatioLock?: (v: string) => void;
  cropMinHeightPx: number;
  setCropMinHeightPx: (v: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (v: number) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (v: number) => void;
  cropCannyLow: number;
  setCropCannyLow: (v: number) => void;
  cropCannyHigh: number;
  setCropCannyHigh: (v: number) => void;
  cropCloseKernelSize: number;
  setCropCloseKernelSize: (v: number) => void;
  cropBackgroundMode: string;
  setCropBackgroundMode: (v: string) => void;

  // Gemini Props
  cropGuidance: string;
  setCropGuidance: (v: string) => void;
  cropFocusMode: string;
  setCropFocusMode: (v: string) => void;
}

export const AutoCropEngineSelector = React.memo(function AutoCropEngineSelector({
  useLocalCV,
  setUseLocalCV,
  cropModel,
  setCropModel,
  cropSensitivity,
  setCropSensitivity,
  cropPaddingPx = 10,
  setCropPaddingPx,
  aspectRatioLock = "free",
  setAspectRatioLock,
  cropMinHeightPx,
  setCropMinHeightPx,
  overlapMergeThreshold,
  setOverlapMergeThreshold,
  minPanelAreaPct,
  setMinPanelAreaPct,
  cropCannyLow,
  setCropCannyLow,
  cropCannyHigh,
  setCropCannyHigh,
  cropCloseKernelSize,
  setCropCloseKernelSize,
  cropBackgroundMode,
  setCropBackgroundMode,
  cropGuidance,
  setCropGuidance,
  cropFocusMode,
  setCropFocusMode,
}: Props) {
  const { models: aiModels } = useAIModels();
  const [showAdvancedCV, setShowAdvancedCV] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [cvStrategyMode, setCvStrategyMode] = useState<"auto" | "grid" | "webtoon">("auto");
  const [noiseThreshold, setNoiseThreshold] = useState<number>(5);
  const [bilateralBlur, setBilateralBlur] = useState<"none" | "soft" | "strong">("soft");
  const [overlayTheme, setOverlayTheme] = useState<"cyan" | "emerald" | "violet" | "gold" | "rose">("cyan");

  // AI Smart Engine Extended Controls State
  const [maxPanelCap, setMaxPanelCap] = useState<number>(0);
  const [confidenceStrictness, setConfidenceStrictness] = useState<number>(75);
  const [readingOrder, setReadingOrder] = useState<"manga" | "webtoon" | "western">("manga");
  const [aiTemperature, setAiTemperature] = useState<number>(0.2);

  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    error?: string;
    rawPayload?: any;
  } | null>(null);

  // Health and Key verification states
  const [apiKeyDetected, setApiKeyDetected] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Mount effect to check backend key
  useEffect(() => {
    let isMounted = true;
    api
      .checkHealth()
      .then((data) => {
        if (isMounted) {
          const hasKey = !!data?.env?.GEMINI_API_KEY;
          setApiKeyDetected(hasKey);
          setCheckingStatus(false);
        }
      })
      .catch((err) => {
        console.error("[AutoCropEngineSelector] Health check failed:", err);
        if (isMounted) {
          setApiKeyDetected(false);
          setCheckingStatus(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Quick Switch Presets for OpenCV
  const handleApplyPreset = (presetName: string) => {
    if (presetName === "balanced") {
      setCropSensitivity(30);
      setCropMinHeightPx(60);
      setOverlapMergeThreshold(20);
      setMinPanelAreaPct(2.0);
      setCropCannyLow(20);
      setCropCannyHigh(100);
      setCropCloseKernelSize(15);
    } else if (presetName === "fine") {
      setCropSensitivity(45);
      setCropMinHeightPx(40);
      setOverlapMergeThreshold(10);
      setMinPanelAreaPct(1.0);
      setCropCannyLow(15);
      setCropCannyHigh(85);
      setCropCloseKernelSize(9);
    } else if (presetName === "speech") {
      setCropSensitivity(25);
      setCropMinHeightPx(100);
      setOverlapMergeThreshold(30);
      setMinPanelAreaPct(3.0);
      setCropCannyLow(30);
      setCropCannyHigh(120);
      setCropCloseKernelSize(25);
    } else if (presetName === "panorama") {
      setCropSensitivity(20);
      setCropMinHeightPx(120);
      setOverlapMergeThreshold(40);
      setMinPanelAreaPct(5.0);
      setCropCannyLow(40);
      setCropCannyHigh(150);
      setCropCloseKernelSize(31);
    }
  };

  // Diagnostic Test Handler
  const testGeminiConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    const startTime = performance.now();
    try {
      const data = await api.checkHealth();
      const latency = Math.round(performance.now() - startTime);
      const hasKey = !!data?.env?.GEMINI_API_KEY;
      if (data && (data.status === "healthy" || data.status === "ok" || hasKey)) {
        setTestResult({ success: true, latencyMs: latency, rawPayload: data });
        setApiKeyDetected(hasKey);
      } else {
        setTestResult({
          success: false,
          error: "Server health check returned an unexpected status.",
          rawPayload: data,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err?.message || "Network error reaching backend API server",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const promptHelpers = [
    {
      label: "Ignore Series Logo",
      prompt: "Ignore top banner logos, watermarks, and series title artwork.",
    },
    {
      label: "Strict Rectangles",
      prompt:
        "Strictly detect rectangular panel borders and ignore speech bubbles.",
    },
    {
      label: "Focus Characters",
      prompt: "Prioritize character illustration panels over background splash.",
    },
    {
      label: "Full Scene Merge",
      prompt: "Merge multi-segment vertical action scenes into single panels.",
    },
    {
      label: "Textless Panels",
      prompt: "Extract artwork panels and ignore text-only dialog boxes.",
    },
    {
      label: "Include Speech Tails",
      prompt: "Include speech bubble tails inside the panel crop boundaries.",
    },
    {
      label: "Full Bleed Spreads",
      prompt: "Treat double page spreads as single continuous panels.",
    },
    {
      label: "Ignore Page Numbers",
      prompt: "Ignore header and footer page numbers, volume text, and chapter logos.",
    },
  ];

  const handleAddHelperPrompt = (text: string) => {
    if (cropGuidance.includes(text)) return;
    const current = cropGuidance.trim();
    const separator = current ? " " : "";
    setCropGuidance(current + separator + text);
  };

  const modelCards = aiModels
    .filter((m) => m.provider === "Google" && m.id.includes("gemini"))
    .map((model, idx) => ({
      id: model.id,
      name: model.name,
      badge: idx === 0 ? "⚡ DEFAULT AI" : model.type === "free" ? "⚡ FREE AI" : "🧠 Deep Visual",
      desc:
        model.type === "free"
          ? "Free tier model. Fast visual panel detection. Rapid processing times."
          : "Deep visual comprehension. Best for complex overlapping panels, dark background panels, and artwork-only separation.",
    }));

  return (
    <div className="space-y-4">
      <SectionTitle icon={<Cpu className="h-3.5 w-3.5 text-indigo-400" />}>
        Panel Detection Engine
      </SectionTitle>

      {/* Engine Option Toggle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OPENCV Card */}
        <button
          type="button"
          onClick={() => setUseLocalCV(true)}
          className={`group flex flex-col gap-2.5 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer select-none relative overflow-hidden ${
            useLocalCV
              ? "bg-cyan-950/20 border-cyan-500/80 shadow-[0_0_24px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30"
              : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
          }`}
        >
          {useLocalCV && (
            <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl -mr-4 -mt-4 pointer-events-none" />
          )}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-bold uppercase tracking-wider ${
                useLocalCV ? "text-cyan-400" : "text-white"
              }`}>
                OpenCV Engine
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                useLocalCV ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-neutral-800 text-neutral-400"
              }`}>
                Offline · Fast
              </span>
            </div>
            <span className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
              useLocalCV ? "border-cyan-400 bg-cyan-950 text-cyan-400" : "border-neutral-700 bg-neutral-900"
            }`}>
              {useLocalCV && <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans font-medium">
            Local Python edge and contour detection using Canny filtering. Works 100% offline with zero API limits.
          </p>
        </button>

        {/* GEMINI Card */}
        <button
          type="button"
          onClick={() => setUseLocalCV(false)}
          className={`group flex flex-col gap-2.5 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer select-none relative overflow-hidden ${
            !useLocalCV
              ? "bg-indigo-950/20 border-indigo-500/80 shadow-[0_0_24px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30"
              : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
          }`}
        >
          {!useLocalCV && (
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl -mr-4 -mt-4 pointer-events-none animate-pulse" />
          )}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-bold uppercase tracking-wider ${
                !useLocalCV ? "text-indigo-400" : "text-white"
              }`}>
                AI Vision Scanner
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                !useLocalCV ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-neutral-800 text-neutral-400"
              }`}>
                Gemini LLM
              </span>
            </div>
            <span className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
              !useLocalCV ? "border-indigo-400 bg-indigo-950 text-indigo-400" : "border-neutral-700 bg-neutral-900"
            }`}>
              {!useLocalCV && <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans font-medium">
            Vision LLM panel segmentation. Understands complex comic layouts, overlapping speech balloons, and splash art.
          </p>
        </button>
      </div>

      {/* ────────────────── Stable Engine Settings Container (Smooth Transition) ────────────────── */}
      <div className="relative w-full transition-all duration-300">
        {/* OpenCV Dynamic Settings Section */}
        <div
          className={`space-y-4 p-5 bg-neutral-950/40 border border-neutral-800 rounded-3xl shadow-xl transition-all duration-300 ease-in-out ${
            useLocalCV
              ? "opacity-100 scale-100 pointer-events-auto relative z-10 block"
              : "opacity-0 scale-95 pointer-events-none absolute inset-0 z-0 hidden"
          }`}
        >
          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
            <Settings2 className="h-3.5 w-3.5 text-cyan-400" />
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              OpenCV Configuration
            </h4>
          </div>

          {/* Preset buttons */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
              Contour Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "balanced", label: "Balanced Default" },
                { id: "fine", label: "Aggressive Border" },
                { id: "speech", label: "Speech Filter" },
                { id: "panorama", label: "Panoramas Only" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white border border-neutral-800 rounded-xl text-[9px] font-mono font-bold text-neutral-400 transition cursor-pointer active:scale-95 text-center truncate"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detection Strategy Mode Selector */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
              Detection Strategy Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-neutral-900/60 p-1 rounded-xl border border-neutral-850 text-[9px] font-mono font-bold">
              {[
                { id: "auto", label: "Auto-Hybrid (Smart)" },
                { id: "grid", label: "2D Grid Contours" },
                { id: "webtoon", label: "Vertical Seams" },
              ].map((strategy) => (
                <button
                  key={strategy.id}
                  type="button"
                  onClick={() => setCvStrategyMode(strategy.id as any)}
                  className={`py-1.5 text-center rounded-lg transition-all cursor-pointer truncate ${
                    cvStrategyMode === strategy.id
                      ? "bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 font-bold"
                      : "text-neutral-500 hover:text-neutral-355"
                  }`}
                >
                  {strategy.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Lock configuration */}
          {setAspectRatioLock && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
                Aspect Ratio Lock
              </label>
              <div className="flex bg-neutral-900/60 p-1 rounded-xl border border-neutral-850 text-[9px] font-mono font-bold flex-wrap gap-1">
                {["free", "1:1", "4:3", "16:9", "9:16", "2:3"].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatioLock(ratio)}
                    className={`flex-1 min-w-[40px] py-1 text-center rounded-lg transition-all cursor-pointer truncate ${
                      aspectRatioLock === ratio
                        ? "bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 font-bold"
                        : "text-neutral-500 hover:text-neutral-355"
                    }`}
                  >
                    {ratio === "free" ? "Free" : ratio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gutter mode configuration */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
              Gutter / Spacing Background
            </label>
            <div className="flex bg-neutral-900/60 p-1 rounded-xl border border-neutral-850 text-[9px] font-mono font-bold">
              {[
                { id: "auto", label: "Auto Detect" },
                { id: "white", label: "White Spacing" },
                { id: "black", label: "Black Spacing" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setCropBackgroundMode(mode.id)}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer truncate ${
                    cropBackgroundMode === mode.id
                      ? "bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 font-bold"
                      : "text-neutral-500 hover:text-neutral-355"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Edge Sensitivity */}
            <div className="space-y-1.5 p-3 bg-neutral-900/30 border border-neutral-900 rounded-2xl">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-neutral-500 uppercase tracking-wider font-bold">
                  Edge Sensitivity
                </span>
                <span className="text-cyan-450 font-bold">
                  {cropSensitivity}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={cropSensitivity}
                onChange={(e) => setCropSensitivity(Number(e.target.value))}
                className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[8px] text-neutral-500 leading-normal font-sans">
                Contrast threshold for borders. Higher values locate borders
                aggressively, lower is selective.
              </p>
            </div>

            {/* Min Height */}
            <div className="space-y-1.5 p-3 bg-neutral-900/30 border border-neutral-900 rounded-2xl">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-neutral-500 uppercase tracking-wider font-bold">
                  Min Panel Height
                </span>
                <span className="text-cyan-450 font-bold">
                  {cropMinHeightPx}px
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="300"
                value={cropMinHeightPx}
                onChange={(e) => setCropMinHeightPx(Number(e.target.value))}
                className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[8px] text-neutral-500 leading-normal font-sans">
                Ignores layout blocks smaller than this height (filters speech
                text fields or artifacts).
              </p>
            </div>

            {/* Overlap Merge */}
            <div className="space-y-1.5 p-3 bg-neutral-900/30 border border-neutral-900 rounded-2xl">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-neutral-500 uppercase tracking-wider font-bold">
                  Overlap Merge
                </span>
                <span className="text-cyan-450 font-bold">
                  {overlapMergeThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={overlapMergeThreshold}
                onChange={(e) =>
                  setOverlapMergeThreshold(Number(e.target.value))
                }
                className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[8px] text-neutral-500 leading-normal font-sans">
                Merges adjacent boxes if their vertical boundaries overlap by
                more than this percentage.
              </p>
            </div>

            {/* Min Panel Width Ratio */}
            <div className="space-y-1.5 p-3 bg-neutral-900/30 border border-neutral-900 rounded-2xl">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-neutral-500 uppercase tracking-wider font-bold">
                  Min Width Ratio
                </span>
                <span className="text-cyan-450 font-bold">
                  {minPanelAreaPct}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={minPanelAreaPct}
                onChange={(e) => setMinPanelAreaPct(Number(e.target.value))}
                className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[8px] text-neutral-500 leading-normal font-sans">
                Discards small segments whose width ratio is below this percent
                of full image.
              </p>
            </div>

            {/* Margin Padding */}
            {setCropPaddingPx && (
              <div className="space-y-1.5 p-3 bg-neutral-900/30 border border-neutral-900 rounded-2xl">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-neutral-500 uppercase tracking-wider font-bold">
                    Margin Padding
                  </span>
                  <span className="text-cyan-450 font-bold">
                    {cropPaddingPx}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={cropPaddingPx}
                  onChange={(e) => setCropPaddingPx(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <p className="text-[8px] text-neutral-500 leading-normal font-sans">
                  Safety border padding added around detected panel crop boxes.
                </p>
              </div>
            )}
          </div>

          {/* Advanced Accordion Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedCV(!showAdvancedCV)}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-neutral-500 hover:text-cyan-450 transition cursor-pointer select-none"
            >
              <ChevronRight
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showAdvancedCV ? "rotate-90 text-cyan-450" : ""
                }`}
              />
              Advanced Canny Tuning ({showAdvancedCV ? "Collapse" : "Expand"})
            </button>

            {showAdvancedCV && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-black/30 border border-neutral-900 rounded-2xl animate-[fadeIn_0.2s_ease-out]">
                {/* Canny Low */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-neutral-500 uppercase font-bold">
                      Canny Low Edge
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {cropCannyLow}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={cropCannyLow}
                    onChange={(e) => setCropCannyLow(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
                {/* Canny High */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-neutral-500 uppercase font-bold">
                      Canny High Edge
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {cropCannyHigh}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="255"
                    value={cropCannyHigh}
                    onChange={(e) => setCropCannyHigh(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
                {/* Close Kernel */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-neutral-500 uppercase font-bold">
                      Close Kernel
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {cropCloseKernelSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="51"
                    step="2"
                    value={cropCloseKernelSize}
                    onChange={(e) =>
                      setCropCloseKernelSize(Number(e.target.value))
                    }
                    className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Noise Filter Threshold */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-neutral-500 uppercase font-bold">
                      Noise Speckle Filter
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {noiseThreshold}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={noiseThreshold}
                    onChange={(e) => setNoiseThreshold(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Bilateral Blur Selector */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-neutral-500 uppercase font-bold">
                      Paper Pre-Blur
                    </span>
                    <span className="text-cyan-400 font-bold uppercase">
                      {bilateralBlur}
                    </span>
                  </div>
                  <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-900 text-[8px] font-mono">
                    {["none", "soft", "strong"].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBilateralBlur(b as any)}
                        className={`flex-1 py-0.5 text-center rounded transition-all cursor-pointer uppercase ${
                          bilateralBlur === b
                            ? "bg-cyan-950 text-cyan-400 font-bold"
                            : "text-neutral-600 hover:text-neutral-400"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Overlay Palette Theme */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-neutral-500 uppercase font-bold">
                      Bounding Box Color
                    </span>
                    <span className="text-cyan-400 font-bold capitalize">
                      {overlayTheme}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {[
                      { id: "cyan", bg: "bg-cyan-500" },
                      { id: "emerald", bg: "bg-emerald-500" },
                      { id: "violet", bg: "bg-purple-500" },
                      { id: "gold", bg: "bg-amber-450" },
                      { id: "rose", bg: "bg-rose-500" },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setOverlayTheme(theme.id as any)}
                        className={`h-4 w-4 rounded-full ${theme.bg} transition-all cursor-pointer ${
                          overlayTheme === theme.id
                            ? "ring-2 ring-white ring-offset-1 ring-offset-black scale-110"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        title={`Color scheme: ${theme.id}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gemini Vision AI Settings Section */}
        <div
          className={`space-y-4 p-5 bg-neutral-950/40 border border-neutral-800 rounded-3xl shadow-xl transition-all duration-300 ease-in-out ${
            !useLocalCV
              ? "opacity-100 scale-100 pointer-events-auto relative z-10 block"
              : "opacity-0 scale-95 pointer-events-none absolute inset-0 z-0 hidden"
          }`}
        >
          {/* Header Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Smart Scanner Engine
              </h4>
            </div>

            {/* API Key Connection Validation Status */}
            <div>
              {checkingStatus ? (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-neutral-500">
                  <RefreshCw className="h-3 w-3 animate-spin text-neutral-600" />
                  Verifying environment keys...
                </span>
              ) : apiKeyDetected ? (
                <span className="inline-flex items-center gap-1 text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-900/30 text-emerald-450 shadow-sm">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Gemini API Key Detected
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-900/30 text-amber-400 shadow-sm"
                  title="Configure your GEMINI_API_KEY on the server to enable AI detection."
                >
                  <ShieldAlert className="h-3 w-3 text-amber-400" />
                  No Gemini API Key — AI Unavailable
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Model Grid Cards */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
              Scanner Models
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modelCards.map((model) => {
                const isSelected = cropModel === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setCropModel(model.id);
                      setTestResult(null);
                    }}
                    className={`flex flex-col gap-1.5 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
                      isSelected
                        ? "bg-indigo-950/20 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                        : "bg-neutral-900/30 border-neutral-900 hover:border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-bold text-white">
                        {model.name}
                      </span>
                      <span
                        className={`text-[8px] font-mono px-1.5 py-0.5 rounded border leading-none font-bold uppercase select-none ${
                          isSelected
                            ? "bg-indigo-950 border-indigo-700/50 text-indigo-400"
                            : "bg-neutral-950 border-neutral-850 text-neutral-550"
                        }`}
                      >
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[8.5px] text-neutral-455 leading-relaxed font-sans font-medium">
                      {model.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Semantic Focus Mode Selector */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
                Panel Focus Strategy
              </label>
              <div className="relative">
                <select
                  value={cropFocusMode}
                  onChange={(e) => {
                    setCropFocusMode(e.target.value);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-350 rounded-xl px-3.5 py-2.5 text-[10px] font-mono focus:border-indigo-550 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700 font-bold"
                >
                  <option value="standard">
                    Standard Panel Detection (Balanced)
                  </option>
                  <option value="tight">
                    Tight Illustration Only (Exclude Text)
                  </option>
                  <option value="cinematic">
                    Cinematic Widescreen (Merge Wide Panels)
                  </option>
                  <option value="portrait">
                    Close-up Portrait (Focus Character Faces)
                  </option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
                API Diagnostics & Connectivity
              </label>
              <div className="flex items-center gap-2 h-9.5">
                <button
                  type="button"
                  onClick={testGeminiConnection}
                  disabled={testingConnection}
                  className={`flex-grow flex items-center justify-center gap-1.5 h-full px-3.5 rounded-xl border text-[9.5px] font-bold font-mono transition-all duration-200 active:scale-95 cursor-pointer ${
                    testingConnection
                      ? "bg-neutral-900 border-neutral-850 text-neutral-500 cursor-not-allowed"
                      : "bg-indigo-950/20 border-indigo-900/60 text-indigo-400 hover:bg-indigo-900/10 hover:border-indigo-800"
                  }`}
                >
                  {testingConnection ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Radio className="h-3 w-3 animate-pulse" />
                  )}
                  {testingConnection ? "Pinging..." : "Test Connection"}
                </button>

                {/* Connection Status Badge */}
                {testResult && (
                  <div className="shrink-0 animate-fadeIn h-full flex items-center">
                    {testResult.success ? (
                      <span className="inline-flex items-center gap-1 h-full text-[8.5px] font-mono font-bold px-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-450">
                        <Clock className="h-3 w-3 text-emerald-450" />
                        {testResult.latencyMs}ms
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 h-full text-[8.5px] font-mono font-bold px-2.5 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-400 select-none">
                        Failed
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Extended Tuning Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-indigo-950/10 border border-indigo-900/30 rounded-2xl">
            {/* Reading Flow Directive */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-neutral-500 uppercase font-mono block">
                Reading Flow Order
              </label>
              <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[8.5px] font-mono font-bold">
                {[
                  { id: "manga", label: "Manga (R→L)" },
                  { id: "webtoon", label: "Webtoon (↓)" },
                  { id: "western", label: "Comic (L→R)" },
                ].map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setReadingOrder(order.id as any)}
                    className={`flex-1 py-1 text-center rounded transition-all cursor-pointer truncate ${
                      readingOrder === order.id
                        ? "bg-indigo-950 border border-indigo-700/50 text-indigo-300 font-bold"
                        : "text-neutral-500 hover:text-neutral-400"
                    }`}
                  >
                    {order.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Panel Cap */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-mono">
                <span className="text-neutral-500 uppercase font-bold">
                  Max Panels Cap
                </span>
                <span className="text-indigo-400 font-bold">
                  {maxPanelCap === 0 ? "Auto (Unlimited)" : `Max ${maxPanelCap}`}
                </span>
              </div>
              <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[8.5px] font-mono font-bold">
                {[0, 4, 8, 12, 16].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setMaxPanelCap(cap)}
                    className={`flex-1 py-1 text-center rounded transition-all cursor-pointer ${
                      maxPanelCap === cap
                        ? "bg-indigo-950 border border-indigo-700/50 text-indigo-300 font-bold"
                        : "text-neutral-500 hover:text-neutral-400"
                    }`}
                  >
                    {cap === 0 ? "Auto" : cap}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Vision Temperature */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-mono">
                <span className="text-neutral-500 uppercase font-bold">
                  Vision Temperature
                </span>
                <span className="text-indigo-400 font-bold">
                  {aiTemperature.toFixed(1)}
                </span>
              </div>
              <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[8.5px] font-mono font-bold">
                {[
                  { val: 0.0, label: "0.0 Exact" },
                  { val: 0.2, label: "0.2 Balanced" },
                  { val: 0.5, label: "0.5 Creative" },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setAiTemperature(t.val)}
                    className={`flex-1 py-1 text-center rounded transition-all cursor-pointer truncate ${
                      aiTemperature === t.val
                        ? "bg-indigo-950 border border-indigo-700/50 text-indigo-300 font-bold"
                        : "text-neutral-500 hover:text-neutral-400"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Confidence / Strictness Slider */}
          <div className="space-y-1.5 p-3.5 bg-neutral-900/30 border border-neutral-900 rounded-2xl">
            <div className="flex justify-between items-center text-[9px] font-mono">
              <span className="text-neutral-500 uppercase tracking-wider font-bold">
                AI Detection Strictness Threshold
              </span>
              <span className="text-indigo-400 font-bold">
                {confidenceStrictness}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={confidenceStrictness}
              onChange={(e) => setConfidenceStrictness(Number(e.target.value))}
              className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[8px] font-mono text-neutral-500 pt-0.5">
              <span>High Recall (Permissive)</span>
              <span>Balanced</span>
              <span>Strict (High Confidence Only)</span>
            </div>
          </div>

          {/* Prompt/Guidance text area + helpers */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
                Custom Prompt Guidance instructions
              </label>
              <span className="text-[8px] font-mono text-indigo-400/80 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/30 uppercase select-none">
                Directives Prompt
              </span>
            </div>
            <textarea
              value={cropGuidance}
              onChange={(e) => setCropGuidance(e.target.value)}
              placeholder="e.g. 'Ignore the first panel logo / series title banner' or 'Focus strictly on cropping rectangular frames and ignore rounded borders'"
              rows={2}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-4 py-2.5 text-[10px] font-sans placeholder:text-neutral-600 focus:border-indigo-550 focus:outline-none resize-none leading-relaxed transition-all"
            />

            {/* Quick helper tag list */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider font-mono block">
                Quick prompt tags (Click to insert):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {promptHelpers.map((helper) => (
                  <button
                    key={helper.label}
                    type="button"
                    onClick={() => handleAddHelperPrompt(helper.prompt)}
                    className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-[8px] text-neutral-455 hover:text-white border border-neutral-850 rounded-lg transition-colors cursor-pointer text-left font-mono active:scale-95"
                  >
                    + {helper.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Connection Diagnostic Output Panel */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-[9px] font-mono animate-[fadeIn_0.2s_ease-out] space-y-2.5 select-none ${
                testResult.success
                  ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                  : "bg-rose-950/20 border-rose-900/40 text-rose-350"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-bold uppercase tracking-wider text-[9px] text-white">
                    API Diagnostic Output Log
                  </span>
                </div>
                <span
                  className={`text-[8.5px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    testResult.success
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {testResult.success
                    ? `CONNECTED (${testResult.latencyMs}ms)`
                    : "FAILED"}
                </span>
              </div>

              {testResult.success ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] leading-relaxed">
                  <div>
                    <span className="text-neutral-500 font-bold block">
                      SERVICE ENGINE
                    </span>
                    <span className="text-white">
                      {testResult.rawPayload?.service ||
                        "Sonikoma Computational Backend"}{" "}
                      v{testResult.rawPayload?.version || "1.0.0"}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-bold block">
                      GEMINI MODEL TARGET
                    </span>
                    <span className="text-indigo-300 font-bold">
                      {cropModel}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-bold block">
                      API KEY STATUS
                    </span>
                    <span
                      className={
                        testResult.rawPayload?.env?.GEMINI_API_KEY
                          ? "text-emerald-400 font-bold"
                          : "text-amber-400 font-bold"
                      }
                    >
                      {testResult.rawPayload?.env?.GEMINI_API_KEY
                        ? "✓ GEMINI_API_KEY Active"
                        : "⚠ No Key Configured"}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-bold block">
                      SYSTEM UPTIME
                    </span>
                    <span className="text-neutral-300">
                      {testResult.rawPayload?.uptime || "Active"}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-bold block">
                      OPENCV CAPABILITY
                    </span>
                    <span
                      className={
                        testResult.rawPayload?.capabilities?.cv2
                          ? "text-emerald-400"
                          : "text-neutral-400"
                      }
                    >
                      {testResult.rawPayload?.capabilities?.cv2
                        ? "✓ cv2 Hardware Ready"
                        : "Unavailable"}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-bold block">
                      GOOGLE GENAI SDK
                    </span>
                    <span
                      className={
                        testResult.rawPayload?.capabilities?.google_genai
                          ? "text-emerald-400"
                          : "text-neutral-400"
                      }
                    >
                      {testResult.rawPayload?.capabilities?.google_genai
                        ? "✓ SDK Loaded"
                        : "Not Detected"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[9px] text-rose-350 leading-relaxed font-mono">
                  ⚠️ <strong>Diagnostic Error:</strong>{" "}
                  {testResult.error ||
                    "Failed to establish API connection to the computational backend."}
                </div>
              )}
            </div>
          )}

          {/* Info note */}
          <div className="p-3.5 bg-indigo-950/10 border border-indigo-900/30 text-[9.5px] font-mono text-indigo-400 rounded-2xl leading-relaxed flex items-start gap-2 select-none">
            <Compass className="h-4 w-4 shrink-0 text-indigo-400/80 mt-0.5" />
            <p>
              <strong>Gemini AI Engine Active.</strong> If detection fails (no
              API key, quota exceeded, or network error), you will receive a
              notification — switch to <strong>OpenCV Engine</strong> for
              offline local detection instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
