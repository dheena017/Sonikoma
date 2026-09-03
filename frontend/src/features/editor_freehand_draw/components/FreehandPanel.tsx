import React, { useState } from "react";
import * as api from "@/api";
import {
  Pen,
  Eraser,
  Trash2,
  Save,
  Pipette,
  Highlighter,
  Cloud,
  EyeOff,
  Minus,
  MoveRight,
  Square,
  Circle,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  RefreshCw,
  Wand2,
} from "lucide-react";

interface FreehandPanelProps {
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushAction: string;
  setBrushAction: (action: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  textBgColor?: string;
  setTextBgColor?: (color: string) => void;
  opacity?: number;
  setOpacity?: (val: number) => void;
  fontFamily?: string;
  setFontFamily?: (font: string) => void;
  textStrokeColor?: string;
  setTextStrokeColor?: (color: string) => void;
  textAlign?: "left" | "center" | "right";
  setTextAlign?: (align: "left" | "center" | "right") => void;
  isFilled?: boolean;
  setIsFilled?: (val: boolean) => void;
  activeStoryboardPanel?: any;
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification?: (msg: string, type: any) => void;
  fetchWithInterceptor?: any;
}

const PRESET_COLORS = [
  "#ffffff",
  "#000000",
  "#ef4444",
  "#3b82f6",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#ec4899",
];

const FONT_OPTIONS = [
  { label: "Comic Sans MS", value: "Comic Sans MS" },
  { label: "Bangers", value: "Bangers" },
  { label: "Impact", value: "Impact" },
  { label: "Arial", value: "Arial" },
  { label: "Courier New", value: "Courier New" },
  { label: "Georgia", value: "Georgia" },
];

export default function FreehandPanel({
  brushSize,
  setBrushSize,
  brushAction,
  setBrushAction,
  fillColor,
  setFillColor,
  textBgColor = "#ffffff",
  setTextBgColor,
  opacity = 100,
  setOpacity,
  fontFamily = "Comic Sans MS",
  setFontFamily,
  textStrokeColor = "#000000",
  setTextStrokeColor,
  textAlign = "center",
  setTextAlign,
  isFilled = false,
  setIsFilled,
  activeStoryboardPanel,
  setPanels,
  addNotification,
  fetchWithInterceptor,
}: FreehandPanelProps) {
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [localFont, setLocalFont] = useState(fontFamily);
  const [localStroke, setLocalStroke] = useState(textStrokeColor);
  const [localAlign, setLocalAlign] = useState<"left" | "center" | "right">(
    textAlign
  );
  const [localFilled, setLocalFilled] = useState(isFilled);
  const [isAiCleaning, setIsAiCleaning] = useState(false);

  const handleEyedropper = async () => {
    if (!("EyeDropper" in window)) {
      addNotification?.(
        "Eyedropper API is not supported in this browser.",
        "warning"
      );
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        setFillColor(result.sRGBHex);
        addNotification?.(`Picked color ${result.sRGBHex}`, "info");
      }
    } catch (err) {
      // User cancelled
    }
  };

  const handleAiBubbleClean = async () => {
    if (!activeStoryboardPanel?.image_url) {
      addNotification?.(
        "No active panel selected for AI Speech Bubble Clean.",
        "warning"
      );
      return;
    }

    setIsAiCleaning(true);
    addNotification?.(
      "Running AI Speech Bubble Removal & Inpainting...",
      "info"
    );

    try {
      const data = await api.removeSpeechBubbles(fetchWithInterceptor, {
        url: activeStoryboardPanel.image_url,
        method: "auto",
      });

      if (!data?.success || !data?.url) {
        throw new Error(
          data?.message || "AI inpaint did not return an updated image."
        );
      }

      setPanels?.((prev) =>
        prev.map((panel) =>
          panel.id === activeStoryboardPanel.id
            ? {
                ...panel,
                image_url: data.url,
                layers: panel.layers
                  ? {
                      ...panel.layers,
                      background_url: data.url,
                    }
                  : panel.layers,
              }
            : panel
        )
      );

      addNotification?.("AI Inpainting complete!", "success");
    } catch (err: any) {
      addNotification?.(`AI Inpaint Error: ${err.message}`, "error");
    } finally {
      setIsAiCleaning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Eyedropper */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-[#3B82F6]/10">
            <Pen className="h-3.5 w-3.5 text-[#3B82F6]" />
          </div>
          <span className="text-[10px] font-mono font-bold text-neutral-200 uppercase tracking-wider">
            Retouch & Annotation Tools
          </span>
        </div>
        <button
          type="button"
          onClick={handleEyedropper}
          title="Pick Color from Screen"
          className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#3B82F6]/50 hover:bg-neutral-800 text-[#3B82F6] transition-all cursor-pointer"
        >
          <Pipette className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main Tool Category Tabs */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
          Primary Mode
        </label>
        <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setBrushAction("paint")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
              ["paint", "highlighter", "spray"].includes(brushAction)
                ? "bg-[#2A2A2A] text-white shadow-md shadow-black/50"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Pen className="h-3 w-3" />
            Brush
          </button>

          <button
            type="button"
            onClick={() => setBrushAction("rect")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
              ["line", "arrow", "rect", "circle"].includes(brushAction)
                ? "bg-[#2A2A2A] text-white shadow-md shadow-black/50"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Square className="h-3 w-3" />
            Shapes
          </button>

          <button
            type="button"
            onClick={() => setBrushAction("text")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
              brushAction === "text"
                ? "bg-[#2A2A2A] text-white shadow-md shadow-black/50"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Type className="h-3 w-3" />
            Text
          </button>

          <button
            type="button"
            onClick={() => setBrushAction("blur")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
              brushAction === "blur"
                ? "bg-[#2A2A2A] text-white shadow-md shadow-black/50"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <EyeOff className="h-3 w-3" />
            Censor
          </button>
        </div>
      </div>

      {/* Brush Sub-Types (When Brush Mode Active) */}
      {["paint", "highlighter", "spray", "erase"].includes(brushAction) && (
        <div className="space-y-1.5 pt-1">
          <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
            Brush Style
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setBrushAction("paint")}
              className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                brushAction === "paint"
                  ? "border-[#3B82F6] bg-[#2A2A2A] text-[#60A5FA]"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850"
              }`}
            >
              <Pen className="h-3 w-3" />
              Pencil
            </button>

            <button
              type="button"
              onClick={() => setBrushAction("highlighter")}
              className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                brushAction === "highlighter"
                  ? "border-[#3B82F6] bg-[#2A2A2A] text-[#60A5FA]"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850"
              }`}
            >
              <Highlighter className="h-3 w-3" />
              Marker
            </button>

            <button
              type="button"
              onClick={() => setBrushAction("spray")}
              className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                brushAction === "spray"
                  ? "border-[#3B82F6] bg-[#2A2A2A] text-[#60A5FA]"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850"
              }`}
            >
              <Cloud className="h-3 w-3" />
              Spray
            </button>

            <button
              type="button"
              onClick={() => setBrushAction("erase")}
              className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                brushAction === "erase"
                  ? "border-red-500 bg-red-950/40 text-red-300"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850"
              }`}
            >
              <Eraser className="h-3 w-3" />
              Eraser
            </button>
          </div>
        </div>
      )}

      {/* Shape Sub-Types (When Shapes Mode Active) */}
      {["line", "arrow", "rect", "circle"].includes(brushAction) && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
              Shape Type
            </label>
            <label className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilled}
                onChange={(e) => {
                  setLocalFilled(e.target.checked);
                  setIsFilled?.(e.target.checked);
                }}
                className="rounded border-neutral-800 bg-neutral-900 text-[#3B82F6] focus:ring-0 cursor-pointer"
              />
              <span>Solid Fill</span>
            </label>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setBrushAction("line")}
              className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                brushAction === "line"
                  ? "border-[#3B82F6] bg-[#2A2A2A] text-[#60A5FA]"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850"
              }`}
            >
              <Minus className="h-3 w-3" />
              Line
            </button>

            <button
              type="button"
              onClick={() => setBrushAction("arrow")}
              className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                brushAction === "arrow"
                  ? "border-[#3B82F6] bg-[#2A2A2A] text-[#60A5FA]"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850"
              }`}
            >
              <MoveRight className="h-3 w-3" />
              Arrow
            </button>

            <button
              type="button"
              onClick={() => setBrushAction("rect")}
              className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                brushAction === "rect"
                  ? "border-[#3B82F6] bg-[#2A2A2A] text-[#60A5FA]"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850"
              }`}
            >
              <Square className="h-3 w-3" />
              Rectangle
            </button>

            <button
              type="button"
              onClick={() => setBrushAction("circle")}
              className={`py-1.5 rounded-xl border text-[9px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                brushAction === "circle"
                  ? "border-[#3B82F6] bg-[#2A2A2A] text-[#60A5FA]"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-850"
              }`}
            >
              <Circle className="h-3 w-3" />
              Circle
            </button>
          </div>
        </div>
      )}

      {/* Typography Formatting Controls (When Text Mode Active) */}
      {brushAction === "text" && (
        <div className="space-y-3 p-3 bg-black/30 rounded-xl border border-white/5">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
              Font Family
            </label>
            <select
              value={localFont}
              onChange={(e) => {
                setLocalFont(e.target.value);
                setFontFamily?.(e.target.value);
              }}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 text-[10px] font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#3B82F6]"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
              Alignment
            </label>
            <div className="flex gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setLocalAlign("left");
                  setTextAlign?.("left");
                }}
                className={`flex-1 py-1 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  localAlign === "left"
                    ? "bg-[#2A2A2A] text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalAlign("center");
                  setTextAlign?.("center");
                }}
                className={`flex-1 py-1 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  localAlign === "center"
                    ? "bg-[#2A2A2A] text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalAlign("right");
                  setTextAlign?.("right");
                }}
                className={`flex-1 py-1 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  localAlign === "right"
                    ? "bg-[#2A2A2A] text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sliders: Size & Opacity */}
      <div className="space-y-3 pt-1">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider">
            <span>
              {brushAction === "text" ? "Font Size" : "Stroke / Tool Size"}
            </span>
            <span className="text-[#3B82F6] font-bold">{brushSize}px</span>
          </div>
          <input
            type="range"
            min="2"
            max="120"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider">
            <span>Opacity</span>
            <span className="text-[#3B82F6] font-bold">{localOpacity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={localOpacity}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLocalOpacity(val);
              setOpacity?.(val);
            }}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* Color Palette & Swatches */}
      {brushAction !== "erase" && (
        <div className="space-y-2 pt-1">
          <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider block">
            {brushAction === "text" ? "Primary Color" : "Color Picker"}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="h-8 w-10 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
            />
            <div className="flex flex-wrap gap-1.5 flex-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFillColor(c)}
                  className={`h-5 w-5 rounded-full border transition-all cursor-pointer ${
                    fillColor.toLowerCase() === c.toLowerCase()
                      ? "border-[#60A5FA] scale-110 shadow-md shadow-black/50"
                      : "border-white/10 hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {brushAction === "text" && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[8px] font-mono text-neutral-500 uppercase font-bold block mb-1">
                  Text Fill
                </label>
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="h-7 w-full rounded cursor-pointer bg-transparent border border-neutral-800"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono text-neutral-500 uppercase font-bold block mb-1">
                  Background
                </label>
                <input
                  type="color"
                  value={textBgColor}
                  onChange={(e) => setTextBgColor?.(e.target.value)}
                  className="h-7 w-full rounded cursor-pointer bg-transparent border border-neutral-800"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Speech Bubble Inpainting Action Section */}
      <div className="pt-3 border-t border-white/5 space-y-2">
        <label className="text-[9px] font-mono text-[#3B82F6] uppercase font-bold tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-[#3B82F6]" />
          <span>AI Inpainting & Cleaning</span>
        </label>
        <button
          type="button"
          disabled={isAiCleaning}
          onClick={handleAiBubbleClean}
          className="w-full py-2 bg-[#2A2A2A] hover:bg-[#2A2A2A] text-[#60A5FA] border border-[#2F2F2F] hover:border-[#2F2F2F] rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          {isAiCleaning ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#3B82F6]" />
          ) : (
            <Wand2 className="h-3.5 w-3.5 text-[#3B82F6]" />
          )}
          <span>
            {isAiCleaning
              ? "AI Inpainting Speech..."
              : "AI Clean Speech & Inpaint"}
          </span>
        </button>
      </div>

      {/* Global Actions Footer */}
      <div className="pt-3 border-t border-white/10 flex gap-2">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new Event("FABRIC_CLEAR_REQUEST"))
          }
          className="flex-1 py-2 bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-900/50 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold transition-all cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("FABRIC_SAVE_REQUEST"))}
          className="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold transition-all shadow-lg shadow-emerald-900/40 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" />
          Save & Apply Drawing
        </button>
      </div>
    </div>
  );
}
