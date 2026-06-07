import React, { useState, useEffect } from "react";
import { Brain, RefreshCw, ChevronDown, Sliders, ChevronRight, Undo2, Redo2, RotateCcw, HelpCircle, Eye, Sparkles, Layers, Cpu } from "lucide-react";
import { NotificationType } from "../NotificationStack";
import { DETECTION_OPTIONS, ERASE_OPTIONS, PRESETS } from "./bubblePresets";

interface CleanBubblesPanelProps {
  imgUrl: string;
  editingImageIdx: number;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>> | undefined;
  setPanels: React.Dispatch<React.SetStateAction<any[]>> | undefined;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: typeof fetch | undefined;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>> | undefined;

  // Manual Brush Props
  editMode?: "crop" | "clean_auto" | "clean_manual" | "typeset" | "slices";
  setEditMode?: (mode: "crop" | "clean_auto" | "clean_manual" | "typeset" | "slices") => void;
  brushSize?: number;
  setBrushSize?: (size: number) => void;
  brushAction?: "paint" | "erase";
  setBrushAction?: (action: "paint" | "erase") => void;
  handleClearBrushMask?: () => void;

  // Lifted Parameter Props
  detectionStyle?: "all" | "white_only" | "text_only";
  setDetectionStyle?: (style: "all" | "white_only" | "text_only") => void;
  eraseMethod?: "auto" | "inpaint" | "inpaint_ns" | "blur" | "solid_white" | "solid_black" | "solid_color" | "transparent" | "ocr";
  setEraseMethod?: (method: "auto" | "inpaint" | "inpaint_ns" | "blur" | "solid_white" | "solid_black" | "solid_color" | "transparent" | "ocr") => void;
  sensitivity?: number;
  setSensitivity?: (val: number) => void;
  dilation?: number;
  setDilation?: (val: number) => void;
  inpaintRadius?: number;
  setInpaintRadius?: (val: number) => void;
  debugMode?: boolean;
  setDebugMode?: (val: boolean) => void;
  fillColor?: string;
  setFillColor?: (val: string) => void;
  ocrLang?: string;
  setOcrLang?: (val: string) => void;
  gpu?: boolean;
  setGpu?: (val: boolean) => void;
  morphKernelSize?: number;
  setMorphKernelSize?: (val: number) => void;
  morphShape?: string;
  setMorphShape?: (val: string) => void;
  useCustomColorTarget?: boolean;
  setUseCustomColorTarget?: (val: boolean) => void;
  customColorTarget?: string;
  setCustomColorTarget?: (val: string) => void;
  customColorTolerance?: number;
  setCustomColorTolerance?: (val: number) => void;
}


export default function CleanBubblesPanel({
  imgUrl,
  editingImageIdx,
  setScrapedImages,
  setPanels,
  addNotification,
  fetchWithInterceptor,
  setConsoleLogs,
  editMode = "crop",
  setEditMode,
  brushSize = 20,
  setBrushSize,
  brushAction = "paint",
  setBrushAction,
  handleClearBrushMask,

  detectionStyle = "all",
  setDetectionStyle,
  eraseMethod = "auto",
  setEraseMethod,
  sensitivity = 50,
  setSensitivity,
  dilation = -1,
  setDilation,
  inpaintRadius = 3,
  setInpaintRadius,
  debugMode = false,
  setDebugMode,
  fillColor = "#ffffff",
  setFillColor,
  ocrLang = "en",
  setOcrLang,
  gpu = false,
  setGpu,
  morphKernelSize = 15,
  setMorphKernelSize,
  morphShape = "ellipse",
  setMorphShape,
  useCustomColorTarget = false,
  setUseCustomColorTarget,
  customColorTarget = "#ffffcc",
  setCustomColorTarget,
  customColorTolerance = 25,
  setCustomColorTolerance,
}: CleanBubblesPanelProps) {
  const activeFetch = fetchWithInterceptor || fetch;

  // UI States
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showColorFilter, setShowColorFilter] = useState<boolean>(false);
  const [showOcrConfig, setShowOcrConfig] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>("AI Fast Clean");
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Local Undo/Redo/Original History
  const [history, setHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [originalUrl] = useState<string>(imgUrl);

  // Monitor image URL updates to populate initial history
  useEffect(() => {
    if (imgUrl && history.length === 0) {
      setHistory([imgUrl]);
      setHistoryPointer(0);
    }
  }, [imgUrl]);

  // Apply a selected preset
  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setActivePreset(p.name);
    setDetectionStyle(p.detectionStyle as any);
    setEraseMethod(p.eraseMethod as any);
    setSensitivity(p.sensitivity);
    setDilation(p.dilation);
    setInpaintRadius(p.inpaintRadius);
    addNotification(`Applied '${p.name}' preset configuration`, "info");
  };

  const handleCleanCurrentBubble = async () => {
    setIsCleaning(true);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Crop Editor] Cleaning speech bubbles on Frame #${editingImageIdx + 1} (${activePreset})...`,
        ...prev,
      ]);
    }
    try {
      const response = await activeFetch("/api/remove-speech-bubbles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imgUrl,
          method: eraseMethod,
          sensitivity: sensitivity,
          dilation: dilation,
          inpaint_radius: inpaintRadius,
          detection_style: detectionStyle,
          debug_mode: debugMode,
          ocr_lang: ocrLang,
          gpu,
          fill_color: eraseMethod === "solid_color" ? fillColor : "",
          morph_kernel_size: morphKernelSize,
          morph_shape: morphShape,
          custom_color_target: useCustomColorTarget ? customColorTarget : "",
          custom_color_tolerance: customColorTolerance,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Speech bubble removal failed with status ${response.status}`
        );
      }

      const data = await response.json();
      if (data.success && data.url) {
        // Update scraped image and panels
        if (setScrapedImages) {
          setScrapedImages((prev) => {
            const copy = [...prev];
            copy[editingImageIdx] = data.url;
            return copy;
          });
        }
        if (setPanels) {
          setPanels((prev) =>
            prev.map((p) =>
              p.image_url === imgUrl ? { ...p, image_url: data.url } : p
            )
          );
        }

        // Save local history
        const newHistory = history.slice(0, historyPointer + 1);
        newHistory.push(data.url);
        setHistory(newHistory);
        setHistoryPointer(newHistory.length - 1);

        if (setConsoleLogs) {
          setConsoleLogs((prev) => [
            `[Crop Editor] ✓ Clean run successful! Model: ${eraseMethod} · Dilation: ${dilation}px.`,
            ...prev,
          ]);
        }
        addNotification(
          debugMode ? "Debug overlay generated! Bounding boxes highlighted." : "Successfully cleaned bubbles!",
          "success"
        );
      }
    } catch (err: any) {
      console.error("[Crop Editor Bubble Cleaner] Failed:", err);
      addNotification(err.message || "Failed to clean speech bubbles.", "error");
    } finally {
      setIsCleaning(false);
    }
  };

  // Undo clean
  const handleUndoClean = () => {
    if (historyPointer > 0) {
      const prevPointer = historyPointer - 1;
      const prevUrl = history[prevPointer];
      setHistoryPointer(prevPointer);
      updateImageUrl(prevUrl);
      addNotification("Restored to previous clean state", "info");
    }
  };

  // Redo clean
  const handleRedoClean = () => {
    if (historyPointer < history.length - 1) {
      const nextPointer = historyPointer + 1;
      const nextUrl = history[nextPointer];
      setHistoryPointer(nextPointer);
      updateImageUrl(nextUrl);
      addNotification("Re-applied cleaned state", "info");
    }
  };

  // Reset to original panel state
  const handleResetToOriginal = () => {
    if (originalUrl && imgUrl !== originalUrl) {
      const newHistory = history.slice(0, historyPointer + 1);
      newHistory.push(originalUrl);
      setHistory(newHistory);
      setHistoryPointer(newHistory.length - 1);
      updateImageUrl(originalUrl);
      addNotification("Restored original uncleaned image", "warning");
    }
  };

  const updateImageUrl = (url: string) => {
    if (setScrapedImages) {
      setScrapedImages((prev) => {
        const copy = [...prev];
        copy[editingImageIdx] = url;
        return copy;
      });
    }
    if (setPanels) {
      setPanels((prev) =>
        prev.map((p) =>
          p.image_url === imgUrl ? { ...p, image_url: url } : p
        )
      );
    }
  };

  const sensitivityPct = ((sensitivity - 10) / 80) * 100;
  const dilationPct = dilation === -1 ? 0 : ((dilation - 0) / 20) * 100;
  const inpaintRadiusPct = ((inpaintRadius - 1) / 19) * 100;

  return (
    <div className="space-y-4 bg-neutral-950/80 p-4 rounded-2xl border border-purple-900/40 shadow-xl transition-all duration-300">
      {/* Header with Stats Dashboard */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
            <Brain className="h-4 w-4 text-purple-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono font-bold text-purple-300 tracking-wider">
              Smart Bubble Eraser AI
            </span>
            <span className="text-[8px] font-mono text-neutral-500">
              OpenCV + EasyOCR + Gemini Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="p-1 rounded bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Show info guides"
          >
            <HelpCircle className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Interactive Legend / Guide */}
      {showHelp && (
        <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-[10px] text-neutral-400 space-y-2 font-mono animate-fadeIn">
          <div className="font-bold text-neutral-200 uppercase tracking-widest text-[9px] mb-1">
            Visual Guide
          </div>
          <p>This tool replaces comic text with inpainted artwork using AI image context boundaries.</p>
          <div className="grid grid-cols-2 gap-2 text-[9px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-green-500 inline-block" />
              <span>Green: Speech Bubble</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-orange-500 inline-block" />
              <span>Orange: Narration Box</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-red-500 inline-block" />
              <span>Red: Sound Effects</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-purple-500 inline-block" />
              <span>Purple: Custom Dilation</span>
            </div>
          </div>
        </div>
      )}

      {/* Preset profiles selection carousel/grid */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono block tracking-wider">
          Presets ({PRESETS.length})
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-neutral-800">
          {PRESETS.map((p) => {
            const isSelected = activePreset === p.name;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-900/30"
                    : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200"
                }`}
                title={p.description}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showSettings && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Engine Parameters Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Detection Style Selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono block tracking-wider">
                Detection Mode
              </label>
              <div className="relative">
                <select
                  value={detectionStyle}
                  onChange={(e) => {
                    setDetectionStyle(e.target.value as any);
                    setActivePreset("Custom");
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-purple-600 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700"
                >
                  {DETECTION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            {/* Erase Method Selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono block tracking-wider">
                Erase Strategy
              </label>
              <div className="relative">
                <select
                  value={eraseMethod}
                  onChange={(e) => {
                    setEraseMethod(e.target.value as any);
                    setActivePreset("Custom");
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-purple-600 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700"
                >
                  {ERASE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Custom Solid Color Fill picker */}
          {eraseMethod === "solid_color" && (
            <div className="flex items-center justify-between p-2.5 bg-neutral-900/60 border border-neutral-850 rounded-xl animate-fadeIn">
              <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Fill Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-16 bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-center rounded py-0.5"
                />
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-5 h-5 bg-transparent border-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Sensitivity slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider">
                Detection Sensitivity
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-400">
                {sensitivity}%
              </span>
            </div>
            <div className="relative h-1.5 rounded-full bg-neutral-900 border border-white/5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                style={{
                  width: `${sensitivityPct}%`,
                  background: "linear-gradient(to right, #7c3aed, #c084fc)",
                }}
              />
              <input
                type="range"
                min="10"
                max="90"
                value={sensitivity}
                onChange={(e) => {
                  setSensitivity(Number(e.target.value));
                  setActivePreset("Custom");
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
              />
            </div>
          </div>

          {/* Collapsible Custom Color Filter Range */}
          <div className="border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={() => setShowColorFilter(!showColorFilter)}
              className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 hover:text-neutral-400 uppercase font-mono tracking-widest transition-colors cursor-pointer"
            >
              <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${showColorFilter ? "rotate-90 text-purple-400" : ""}`} />
              <span>Chroma-Filter Bubble Color</span>
            </button>

            {showColorFilter && (
              <div className="space-y-3 pt-2.5 animate-fadeIn">
                <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/40 border border-neutral-800">
                  <span className="text-[8px] font-mono text-neutral-400 uppercase">Enable Color Chroma-Filter</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useCustomColorTarget}
                      onChange={(e) => setUseCustomColorTarget(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-400 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-650 peer-checked:after:bg-white border border-neutral-700"></div>
                  </label>
                </div>

                {useCustomColorTarget && (
                  <>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/40 border border-neutral-800 animate-fadeIn">
                      <span className="text-[8px] font-mono text-neutral-400 uppercase">Target Bubble Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={customColorTarget}
                          onChange={(e) => setCustomColorTarget(e.target.value)}
                          className="w-16 bg-neutral-950 border border-neutral-850 text-[10px] font-mono text-center rounded py-0.5"
                        />
                        <input
                          type="color"
                          value={customColorTarget}
                          onChange={(e) => setCustomColorTarget(e.target.value)}
                          className="w-5 h-5 bg-transparent border-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 animate-fadeIn">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-neutral-500">Color Distance Tolerance</span>
                        <span className="text-purple-400 font-bold">{customColorTolerance}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={customColorTolerance}
                        onChange={(e) => setCustomColorTolerance(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* OCR Config Options */}
          {eraseMethod === "ocr" && (
            <div className="border-t border-white/5 pt-2">
              <button
                type="button"
                onClick={() => setShowOcrConfig(!showOcrConfig)}
                className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 hover:text-neutral-400 uppercase font-mono tracking-widest transition-colors cursor-pointer"
              >
                <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${showOcrConfig ? "rotate-90 text-cyan-400" : ""}`} />
                <span>EasyOCR Engine Settings</span>
              </button>

              {showOcrConfig && (
                <div className="space-y-3 pt-2.5 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-neutral-500 uppercase">OCR Language</span>
                      <select
                        value={ocrLang}
                        onChange={(e) => setOcrLang(e.target.value)}
                        className="w-full bg-neutral-905 border border-neutral-800 text-[10px] text-neutral-300 rounded p-1 font-mono"
                      >
                        <option value="en">English (en)</option>
                        <option value="ko">Korean (ko)</option>
                        <option value="ja">Japanese (ja)</option>
                        <option value="ch_sim">Chinese Sim (ch_sim)</option>
                        <option value="fr">French (fr)</option>
                        <option value="es">Spanish (es)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end pb-1.5 pl-2">
                      <span className="text-[8px] font-mono text-neutral-500 uppercase mb-1">GPU Acceleration</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={gpu}
                          onChange={(e) => setGpu(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-400 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white border border-neutral-700"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced toggle */}
          <div className="border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 hover:text-neutral-400 uppercase font-mono tracking-widest transition-colors cursor-pointer"
            >
              <ChevronRight
                className={`h-3 w-3 transition-transform duration-200 ${
                  showAdvanced ? "rotate-90 text-purple-400" : ""
                }`}
              />
              <span>Dilation & Morph Tuning</span>
            </button>

            {showAdvanced && (
              <div className="space-y-3.5 pt-2.5 animate-fadeIn">
                {/* Morph shape selector */}
                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-neutral-500 uppercase">Dilation Kernel Shape</span>
                  <select
                    value={morphShape}
                    onChange={(e) => setMorphShape(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 rounded p-1 font-mono"
                  >
                    <option value="ellipse">Elliptical (Smooth)</option>
                    <option value="rect">Rectangular (Angular)</option>
                    <option value="cross">Cross-shaped (Spiky)</option>
                  </select>
                </div>

                {/* Dilation Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span
                      className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider"
                      title="Custom padding margin pixel count. Auto dynamically calculates based on image size."
                    >
                      Mask Expansion Dilation
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-400">
                      {dilation === -1 ? "Auto (Adaptive)" : `${dilation}px`}
                    </span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-neutral-900 border border-white/5 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                      style={{
                        width: `${dilationPct}%`,
                        background: "linear-gradient(to right, #7c3aed, #c084fc)",
                      }}
                    />
                    <input
                      type="range"
                      min="-1"
                      max="20"
                      value={dilation}
                      onChange={(e) => {
                        setDilation(Number(e.target.value));
                        setActivePreset("Custom");
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    />
                  </div>
                </div>

                {/* Text stroke Morph Kernel Size */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-neutral-500">Text Stroke Closing Kernel</span>
                    <span className="text-purple-400 font-bold">{morphKernelSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="51"
                    step="2" // Odd numbers preferred for morphological structuring kernels
                    value={morphKernelSize}
                    onChange={(e) => setMorphKernelSize(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Inpaint Radius Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span
                      className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider"
                      title="Pixel radius neighborhood for image inpainting."
                    >
                      Inpainting Neighborhood Radius
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-400">
                      {inpaintRadius}px
                    </span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-neutral-900 border border-white/5 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                      style={{
                        width: `${inpaintRadiusPct}%`,
                        background: "linear-gradient(to right, #7c3aed, #c084fc)",
                      }}
                    />
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={inpaintRadius}
                      onChange={(e) => {
                        setInpaintRadius(Number(e.target.value));
                        setActivePreset("Custom");
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Spot-Healing Brush Controls */}
          <div className="border-t border-white/5 pt-2 mt-1">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-850">
              <span className="text-[10px] font-bold text-neutral-300 font-mono flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-purple-400" />
                <span>Manual Spot-Healing Brush</span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editMode === "clean_manual"}
                  onChange={(e) => {
                    if (setEditMode) {
                      setEditMode(e.target.checked ? "clean_manual" : "crop");
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-neutral-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-450 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-650 peer-checked:after:bg-white border border-neutral-700"></div>
              </label>
            </div>

            {editMode === "clean_manual" && (
              <div className="space-y-3 pt-2.5 pl-2.5 border-l-2 border-purple-500/30 animate-fadeIn mt-2">
                {/* Paint / Erase selection */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBrushAction && setBrushAction("paint")}
                    className={`flex-1 py-1 rounded-lg border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                      brushAction === "paint"
                        ? "bg-purple-600/20 border-purple-500/50 text-white"
                        : "bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    Paint Mask (Red)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrushAction && setBrushAction("erase")}
                    className={`flex-1 py-1 rounded-lg border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                      brushAction === "erase"
                        ? "bg-purple-600/10 border-purple-500/30 text-purple-305"
                        : "bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    Erase Mask
                  </button>
                </div>

                {/* Brush Size Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono">
                    <span className="text-neutral-500">Brush Size</span>
                    <span className="text-purple-400 font-bold">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={brushSize}
                    onChange={(e) => setBrushSize && setBrushSize(Number(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Clear Mask Button */}
                <button
                  type="button"
                  onClick={handleClearBrushMask}
                  className="w-full py-1 bg-red-950/10 hover:bg-red-950/20 border border-red-900/20 text-red-400 rounded-lg text-[9px] font-mono font-bold transition-all"
                >
                  Clear Drawing Mask
                </button>
              </div>
            )}
          </div>

          {/* Interactive Bounding Boxes / Debug Mode Toggle */}
          <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-850 p-2.5 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-neutral-300 font-mono flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                <span>Detection Debug Visualizer</span>
              </span>
              <span className="text-[8px] font-sans text-neutral-500 mt-0.5">
                Draw green bounding box overlays instead of erasing.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white border border-neutral-700"></div>
            </label>
          </div>
        </div>
      )}

      {/* History Actions & Control Bar */}
      <div className="flex items-center gap-2 border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={handleUndoClean}
          disabled={historyPointer <= 0}
          className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed border border-neutral-800 rounded-xl text-neutral-300 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[10px] font-mono font-bold"
          title="Undo clean action"
        >
          <Undo2 className="h-3 w-3 text-purple-400" />
          <span>Undo</span>
        </button>

        <button
          type="button"
          onClick={handleRedoClean}
          disabled={historyPointer >= history.length - 1}
          className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed border border-neutral-800 rounded-xl text-neutral-300 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[10px] font-mono font-bold"
          title="Redo clean action"
        >
          <Redo2 className="h-3 w-3 text-purple-400" />
          <span>Redo</span>
        </button>

        <button
          type="button"
          onClick={handleResetToOriginal}
          disabled={imgUrl === originalUrl}
          className="py-1.5 px-3 bg-neutral-900 hover:bg-red-950/20 border border-neutral-800 hover:border-red-900/30 text-neutral-400 hover:text-red-400 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[10px] font-mono font-bold"
          title="Reset completely to uncleaned panel state"
        >
          <RotateCcw className="h-3 w-3 text-red-500/70" />
          <span>Original</span>
        </button>
      </div>

      {/* Action execution button */}
      <div className="flex items-center h-9 w-full">
        <button
          type="button"
          onClick={handleCleanCurrentBubble}
          disabled={isCleaning}
          className={`flex-1 h-full px-3.5 border text-purple-300 hover:text-purple-200 rounded-l-xl border-r-0 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm ${
            debugMode
              ? "bg-cyan-950/30 hover:bg-cyan-900/30 border-cyan-800/40 text-cyan-300"
              : "bg-purple-900/20 hover:bg-purple-800/30 border-purple-800/40"
          }`}
        >
          {isCleaning ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
          ) : (
            <Brain className="h-3.5 w-3.5 text-purple-400" />
          )}
          <span>
            {isCleaning
              ? "Running Cleaner..."
              : debugMode
              ? "Generate Debug Boxes"
              : "Execute Bubble Clean"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          title="Toggle settings panel visibility"
          className={`h-full px-2.5 border rounded-r-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
            showSettings
              ? "bg-purple-950/50 text-purple-200 border-purple-800/50"
              : "bg-neutral-900 text-neutral-400 border-neutral-850 hover:bg-neutral-850"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Mini System Configuration Dashboard */}
      <div className="grid grid-cols-3 gap-1.5 bg-neutral-900/20 p-2 rounded-xl border border-white/[0.02] text-[8px] font-mono text-neutral-500">
        <div className="flex flex-col">
          <span>PIPELINE</span>
          <span className="text-[9px] font-bold text-neutral-400 uppercase mt-0.5 truncate">
            {eraseMethod}
          </span>
        </div>
        <div className="flex flex-col border-l border-white/5 pl-1.5">
          <span>DILATION</span>
          <span className="text-[9px] font-bold text-neutral-400 uppercase mt-0.5">
            {dilation === -1 ? "AUTO" : `${dilation}PX`}
          </span>
        </div>
        <div className="flex flex-col border-l border-white/5 pl-1.5">
          <span>HISTORY STACK</span>
          <span className="text-[9px] font-bold text-neutral-400 uppercase mt-0.5 font-mono">
            {historyPointer + 1} / {history.length}
          </span>
        </div>
      </div>
    </div>
  );
}
