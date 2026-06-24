import React, { useState, useEffect } from "react";
import { Brain, RefreshCw, Sliders, HelpCircle, Eye } from "lucide-react";
import { NotificationType } from "../../NotificationStack";
import { PRESETS } from "../auto/bubblePresets";
import CleanBubblesPresets from "./CleanBubblesPresets";
import CleanBubblesModes from "./CleanBubblesModes";
import CleanBubblesAdvanced from "./CleanBubblesAdvanced";
import CleanBubblesManual from "./CleanBubblesManual";
import CleanBubblesHistory from "./CleanBubblesHistory";

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
  setEditMode?: (
    mode: "crop" | "clean_auto" | "clean_manual" | "typeset" | "slices"
  ) => void;
  brushSize?: number;
  setBrushSize?: (size: number) => void;
  brushAction?: "paint" | "erase";
  setBrushAction?: (action: "paint" | "erase") => void;
  handleClearBrushMask?: () => void;

  // Lifted Parameter Props
  detectionStyle?: "all" | "white_only" | "text_only";
  setDetectionStyle?: (style: "all" | "white_only" | "text_only") => void;
  eraseMethod?:
    | "auto"
    | "inpaint"
    | "inpaint_ns"
    | "blur"
    | "solid_white"
    | "solid_black"
    | "solid_color"
    | "transparent"
    | "ocr";
  setEraseMethod?: (
    method:
      | "auto"
      | "inpaint"
      | "inpaint_ns"
      | "blur"
      | "solid_white"
      | "solid_black"
      | "solid_color"
      | "transparent"
      | "ocr"
  ) => void;
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
  setDetectionStyle = () => {},
  eraseMethod = "auto",
  setEraseMethod = () => {},
  sensitivity = 50,
  setSensitivity = () => {},
  dilation = -1,
  setDilation = () => {},
  inpaintRadius = 3,
  setInpaintRadius = () => {},
  debugMode = false,
  setDebugMode = () => {},
  fillColor = "#ffffff",
  setFillColor = () => {},
  ocrLang = "en",
  setOcrLang = () => {},
  gpu = false,
  setGpu = () => {},
  morphKernelSize = 15,
  setMorphKernelSize = () => {},
  morphShape = "ellipse",
  setMorphShape = () => {},
  useCustomColorTarget = false,
  setUseCustomColorTarget = () => {},
  customColorTarget = "#ffffcc",
  setCustomColorTarget = () => {},
  customColorTolerance = 25,
  setCustomColorTolerance = () => {},
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
  const handleApplyPreset = (p: (typeof PRESETS)[number]) => {
    setActivePreset(p.name);
    setDetectionStyle(p.detectionStyle as any);
    setEraseMethod(p.eraseMethod as any);
    setSensitivity(p.sensitivity);
    setDilation(p.dilation);
    setInpaintRadius(p.inpaintRadius);
    addNotification(`Applied '${p.name}' preset configuration`, "info");
  };

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleCancelClean = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addNotification("Bubble clean cancelled.", "info");
    }
  };

  const handleCleanCurrentBubble = async () => {
    console.log(
      `[CleanBubblesPanel] Executing bubble clean on image #${
        editingImageIdx + 1
      }. Method: ${eraseMethod}`
    );
    setIsCleaning(true);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Crop Editor] Cleaning speech bubbles on Frame #${
          editingImageIdx + 1
        } (${activePreset})...`,
        ...prev,
      ]);
    }
    try {
      abortControllerRef.current = new AbortController();
      const response = await activeFetch("/api/image/remove-speech-bubbles", {
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
        signal: abortControllerRef.current.signal,
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
          debugMode
            ? "Debug overlay generated! Bounding boxes highlighted."
            : "Successfully cleaned bubbles!",
          "success"
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Bubble clean cancelled by user");
        return;
      }
      console.error("[Crop Editor Bubble Cleaner] Failed:", err);
      addNotification(
        err.message || "Failed to clean speech bubbles.",
        "error"
      );
    } finally {
      setIsCleaning(false);
    }
  };

  // Undo clean
  const handleUndoClean = () => {
    console.log("[CleanBubblesPanel] Undo clean");
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
    console.log("[CleanBubblesPanel] Redo clean");
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
    console.log("[CleanBubblesPanel] Reset to original uncleaned image");
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
        prev.map((p) => (p.image_url === imgUrl ? { ...p, image_url: url } : p))
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
          <p>
            This tool replaces comic text with inpainted artwork using AI image
            context boundaries.
          </p>
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
      <CleanBubblesPresets
        activePreset={activePreset}
        handleApplyPreset={handleApplyPreset}
      />

      {showSettings && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Engine Parameters Grid */}
          <CleanBubblesModes
            detectionStyle={detectionStyle}
            setDetectionStyle={setDetectionStyle}
            eraseMethod={eraseMethod}
            setEraseMethod={setEraseMethod}
            setActivePreset={setActivePreset}
            fillColor={fillColor}
            setFillColor={setFillColor}
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
            sensitivityPct={sensitivityPct}
          />

          {/* Collapsible Custom Color Filter Range & Morph Tuning */}
          <CleanBubblesAdvanced
            showColorFilter={showColorFilter}
            setShowColorFilter={setShowColorFilter}
            useCustomColorTarget={useCustomColorTarget}
            setUseCustomColorTarget={setUseCustomColorTarget}
            customColorTarget={customColorTarget}
            setCustomColorTarget={setCustomColorTarget}
            customColorTolerance={customColorTolerance}
            setCustomColorTolerance={setCustomColorTolerance}
            eraseMethod={eraseMethod}
            showOcrConfig={showOcrConfig}
            setShowOcrConfig={setShowOcrConfig}
            ocrLang={ocrLang}
            setOcrLang={setOcrLang}
            gpu={gpu}
            setGpu={setGpu}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            morphShape={morphShape}
            setMorphShape={setMorphShape}
            dilation={dilation}
            setDilation={setDilation}
            dilationPct={dilationPct}
            morphKernelSize={morphKernelSize}
            setMorphKernelSize={setMorphKernelSize}
            inpaintRadius={inpaintRadius}
            setInpaintRadius={setInpaintRadius}
            inpaintRadiusPct={inpaintRadiusPct}
            setActivePreset={setActivePreset}
          />

          {/* Manual Spot-Healing Brush Controls */}
          <CleanBubblesManual
            editMode={editMode}
            setEditMode={setEditMode}
            brushAction={brushAction}
            setBrushAction={setBrushAction}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            handleClearBrushMask={handleClearBrushMask}
          />

          {/* Interactive Bounding Boxes / Debug Mode Toggle */}
          <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-xl">
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
      <CleanBubblesHistory
        handleUndoClean={handleUndoClean}
        historyPointer={historyPointer}
        handleRedoClean={handleRedoClean}
        historyLength={history.length}
        handleResetToOriginal={handleResetToOriginal}
        imgUrl={imgUrl}
        originalUrl={originalUrl}
      />

      {/* Action execution button */}
      <div className="flex items-center h-9 w-full">
        {isCleaning ? (
          <button
            type="button"
            onClick={handleCancelClean}
            className="flex-1 h-full px-3.5 border text-red-300 hover:text-red-200 rounded-l-xl border-r-0 flex items-center justify-center gap-1.5 transition-all text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm bg-red-950/30 hover:bg-red-900/40 border-red-800/40"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-red-400" />
            <span>Stop Cleaner</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCleanCurrentBubble}
            className={`flex-1 h-full px-3.5 border text-purple-300 hover:text-purple-200 rounded-l-xl border-r-0 flex items-center justify-center gap-1.5 transition-all text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm ${
              debugMode
                ? "bg-cyan-950/30 hover:bg-cyan-900/30 border-cyan-800/40 text-cyan-300"
                : "bg-purple-900/20 hover:bg-purple-800/30 border-purple-800/40"
            }`}
          >
            <Brain className="h-3.5 w-3.5 text-purple-400" />
            <span>
              {debugMode ? "Generate Debug Boxes" : "Execute Bubble Clean"}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          title="Toggle settings panel visibility"
          className={`h-full px-2.5 border rounded-r-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
            showSettings
              ? "bg-purple-950/50 text-purple-200 border-purple-800/50"
              : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-855"
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
