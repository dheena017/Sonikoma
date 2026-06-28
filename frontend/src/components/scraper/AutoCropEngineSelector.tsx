import React, { useState, useEffect } from "react";
import * as api from "../../api/index.js";
import {
  Cpu,
  ChevronDown,
  Settings2,
  Check,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Radio,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Clock,
} from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { useAIModels } from "@/hooks/useAIModels";

interface Props {
  useLocalCV: boolean;
  setUseLocalCV: (v: boolean) => void;
  cropModel: string;
  setCropModel: (v: string) => void;

  // OpenCV Props
  cropSensitivity: number;
  setCropSensitivity: (v: number) => void;
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

export function AutoCropEngineSelector({
  useLocalCV,
  setUseLocalCV,
  cropModel,
  setCropModel,
  cropSensitivity,
  setCropSensitivity,
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
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  // Health and Key verification states
  const [apiKeyDetected, setApiKeyDetected] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Mount effect to check backend key
  useEffect(() => {
    let isMounted = true;
    api.checkHealth()
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
    console.log(
      `[AutoCropEngineSelector] Applying OpenCV Preset: ${presetName}`
    );
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
      setCropCloseKernelSize(35);
    }
  };

  // Run Gemini API Latency Test
  const testGeminiConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const data = await api.testModelLatency(fetch, {
          provider: "gemini",
          model: cropModel,
        });
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Failed to contact local proxy server.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Clickable Prompt helpers template tags
  const promptHelpers = [
    {
      label: "Ignore Title Banner",
      prompt:
        "Ignore the first panel logo / series title banner at the top of the image.",
    },
    {
      label: "Strict Rectangles",
      prompt:
        "Extract only rectangular illustration boundaries, ignoring non-rectangular speech or effect clouds.",
    },
    {
      label: "Merge Split Panels",
      prompt:
        "Merge adjacent frames that form a single panoramic scene split by white lines.",
    },
    {
      label: "Exclude Text bubbles",
      prompt:
        "Focus strictly on visual drawing frames and crop tight borders excluding dialogue text.",
    },
  ];

  const handleAddHelperPrompt = (text: string) => {
    if (cropGuidance.includes(text)) return;
    const current = cropGuidance.trim();
    const separator = current ? " " : "";
    setCropGuidance(current + separator + text);
  };

  // Model grid details
  const modelCards = aiModels
    .filter((m) => m.provider === "Google" && m.id.includes("gemini"))
    .map((model) => ({
      id: model.id,
      name: model.name,
      badge: model.type === "free" ? "⚡ Fast & Light" : "🧠 Deep Visual",
      desc:
        model.type === "free"
          ? "Ideal for standard panel boundaries. Rapid processing times. Free tier friendly."
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
          className={`group flex flex-col gap-2 p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer select-none relative overflow-hidden ${
            useLocalCV
              ? "bg-cyan-950/10 border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
              : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700/80"
          }`}
        >
          {useLocalCV && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl -mr-4 -mt-4 pointer-events-none" />
          )}
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${
                useLocalCV ? "text-cyan-400" : "text-neutral-400"
              }`}
            >
              OPENCV ONLY
            </span>
            <span
              className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all ${
                useLocalCV
                  ? "border-cyan-400 bg-cyan-950 text-cyan-400"
                  : "border-neutral-800 bg-neutral-900"
              }`}
            >
              {useLocalCV && (
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              )}
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 leading-relaxed font-sans font-medium">
            Local Python edge and contour finder. Uses Canny filtering for fast
            page gutter cutting. Offline capable, fast, and completely reliable.
          </p>
        </button>

        {/* GEMINI Card */}
        <button
          type="button"
          onClick={() => setUseLocalCV(false)}
          className={`group flex flex-col gap-2 p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer select-none relative overflow-hidden ${
            !useLocalCV
              ? "bg-indigo-950/10 border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.12)]"
              : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700/80"
          }`}
        >
          {!useLocalCV && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-4 -mt-4 pointer-events-none animate-pulse" />
          )}
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${
                !useLocalCV
                  ? "text-indigo-400 animate-pulse"
                  : "text-neutral-400"
              }`}
            >
              SMART SCANNER
            </span>
            <span
              className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all ${
                !useLocalCV
                  ? "border-indigo-400 bg-indigo-950 text-indigo-400"
                  : "border-neutral-800 bg-neutral-900"
              }`}
            >
              {!useLocalCV && (
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 leading-relaxed font-sans font-medium">
            Vision LLM segmentation. Understands panel layouts semantically,
            ignoring overlapping speech balloons, background splash lines, and
            complex gutters.
          </p>
        </button>
      </div>

      {/* ────────────────── OpenCV Dynamic Settings Section ────────────────── */}
      {useLocalCV && (
        <div className="space-y-4 p-5 bg-neutral-950/40 border border-neutral-800 rounded-3xl animate-[fadeIn_0.22s_ease-out] shadow-xl">
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── Gemini Vision AI Settings Section ────────────────── */}
      {!useLocalCV && (
        <div className="space-y-4 p-5 bg-neutral-950/40 border border-neutral-800 rounded-3xl animate-[fadeIn_0.22s_ease-out] shadow-xl">
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
                  title="Requests will fall back to local OpenCV automatically."
                >
                  <ShieldAlert className="h-3 w-3 text-amber-400" />
                  No API Key (OpenCV Fallback Active)
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
                      setTestResult(null); // Reset connection check on change
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
                    console.log(
                      `[AutoCropEngineSelector] Focus mode changed to: ${e.target.value}`
                    );
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
                    className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-[8px] text-neutral-450 hover:text-white border border-neutral-850 rounded-lg transition-colors cursor-pointer text-left font-mono active:scale-95"
                  >
                    + {helper.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diagnostics Connection Testing Error Details */}
          {testResult && !testResult.success && (
            <div className="p-3.5 bg-rose-950/20 border border-rose-900/30 text-[9px] font-mono text-rose-350 rounded-xl leading-relaxed animate-fadeIn">
              ⚠️ <strong>Connection Error:</strong>{" "}
              {testResult.error ||
                "The test query returned an invalid response. Verify your GEMINI_API_KEY environment credentials on the status dashboard."}
            </div>
          )}

          {/* Fallback Notice Info Alert */}
          <div className="p-3.5 bg-indigo-950/10 border border-indigo-900/30 text-[9.5px] font-mono text-indigo-400 rounded-2xl leading-relaxed flex items-start gap-2 select-none">
            <Compass className="h-4 w-4 shrink-0 text-indigo-400/80 mt-0.5 animate-pulse" />
            <p>
              <strong>OpenCV Auto-Fallback Enabled:</strong> If the Smart
              Scanner hits resource quotas, network timeouts, or lacks
              environment keys, the slicer engine falls back to local OpenCV
              contours seamlessly so that cropping is completed successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
