/**
 * AutoCropAdvancedTab — Edge sensitivity, min panel height/width, overlap merge,
 * Canny boundary sliders, morph close kernel, and JSON payload debugger.
 */
import React, { useState } from "react";
import { Filter, FileJson, ChevronDown } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { AutoCropSharedProps } from "./tabTypes";

interface AutoCropAdvancedTabProps
  extends Pick<
    AutoCropSharedProps,
    | "useLocalCV"
    | "cropModel"
    | "autoSplitTallStrips"
    | "cropSensitivity"
    | "setCropSensitivity"
    | "cropPaddingPx"
    | "cropBackgroundMode"
    | "aspectRatioLock"
    | "minPanelAreaPct"
    | "setMinPanelAreaPct"
    | "overlapMergeThreshold"
    | "setOverlapMergeThreshold"
    | "cropMinHeightPx"
    | "setCropMinHeightPx"
    | "cropCannyLow"
    | "setCropCannyLow"
    | "cropCannyHigh"
    | "setCropCannyHigh"
    | "cropCloseKernelSize"
    | "setCropCloseKernelSize"
  > {}

export function AutoCropAdvancedTab({
  useLocalCV,
  cropModel,
  autoSplitTallStrips,
  cropSensitivity,
  setCropSensitivity,
  cropPaddingPx,
  cropBackgroundMode,
  aspectRatioLock,
  minPanelAreaPct,
  setMinPanelAreaPct,
  overlapMergeThreshold,
  setOverlapMergeThreshold,
  cropMinHeightPx,
  setCropMinHeightPx,
  cropCannyLow,
  setCropCannyLow,
  cropCannyHigh,
  setCropCannyHigh,
  cropCloseKernelSize,
  setCropCloseKernelSize,
}: AutoCropAdvancedTabProps) {
  const [showJsonDebugger, setShowJsonDebugger] = useState(false);

  const jsonPayload = JSON.stringify({
    sensitivity: cropSensitivity,
    backgroundColorMode: cropBackgroundMode,
    aspectRatio: aspectRatioLock,
    minAreaPct: minPanelAreaPct / 100.0,
    mergeThreshold: overlapMergeThreshold,
    strategy: useLocalCV ? "local-cv" : "balanced",
    model: cropModel,
    cannyLow: cropCannyLow,
    cannyHigh: cropCannyHigh,
    closeKernelSize: cropCloseKernelSize,
    minHeightPx: cropMinHeightPx,
  }, null, 2);

  const sliderClass = "w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-indigo-500";
  const cardClass = "space-y-1.5 p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl";
  const labelClass = "flex justify-between items-center text-[10px] font-mono";

  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
      {/* Row 1: Edge Sensitivity + Min Height */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cardClass}>
          <div className={labelClass}>
            <span className="text-neutral-500 uppercase tracking-wider font-bold">Edge Sensitivity</span>
            <span className="text-indigo-400 font-bold">{cropSensitivity}%</span>
          </div>
          <input type="range" min="10" max="90" value={cropSensitivity} onChange={(e) => setCropSensitivity(Number(e.target.value))} className={sliderClass} />
          <p className="text-[8px] text-neutral-600 leading-normal">Color gutter cutoff contrast. Higher values locate borders aggressively, lower is more selective.</p>
        </div>

        <div className={cardClass}>
          <div className={labelClass}>
            <span className="text-neutral-500 uppercase tracking-wider font-bold">Min Panel Height</span>
            <span className="text-indigo-400 font-bold">{cropMinHeightPx}px</span>
          </div>
          <input type="range" min="30" max="300" value={cropMinHeightPx} onChange={(e) => setCropMinHeightPx(Number(e.target.value))} className={sliderClass} />
          <p className="text-[8px] text-neutral-600 leading-normal">Ignores slice boundaries smaller than this vertical height limit to avoid cropping speech dialogue blocks.</p>
        </div>
      </div>

      {/* Row 2: Min Width Ratio + Overlap Merge */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cardClass}>
          <div className={labelClass}>
            <span className="text-neutral-500 uppercase tracking-wider font-bold">Min Panel Width Ratio</span>
            <span className="text-indigo-400 font-bold">{minPanelAreaPct}%</span>
          </div>
          <input type="range" min="0.5" max="10.0" step="0.5" value={minPanelAreaPct} onChange={(e) => setMinPanelAreaPct(Number(e.target.value))} className={sliderClass} />
          <p className="text-[8px] text-neutral-600 leading-normal">Discards elements whose width is less than this percentage ratio of the full page width.</p>
        </div>

        <div className={cardClass}>
          <div className={labelClass}>
            <span className="text-neutral-500 uppercase tracking-wider font-bold">Overlap Merge</span>
            <span className="text-indigo-400 font-bold">{overlapMergeThreshold}%</span>
          </div>
          <input type="range" min="0" max="80" step="5" value={overlapMergeThreshold} onChange={(e) => setOverlapMergeThreshold(Number(e.target.value))} className={sliderClass} />
          <p className="text-[8px] text-neutral-600 leading-normal">Merges panel borders overlapping vertically by more than this percentage margin of the smaller frame.</p>
        </div>
      </div>

      {/* Canny Edge details */}
      <div className="p-4.5 bg-neutral-950/40 border border-neutral-800 rounded-2xl space-y-4">
        <SectionTitle icon={<Filter className="h-3 w-3" />}>Canny Boundary Finders</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-neutral-500">Canny Low Edge</span>
              <span className="text-emerald-400 font-bold">{cropCannyLow}</span>
            </div>
            <input type="range" min="0" max="150" value={cropCannyLow} onChange={(e) => setCropCannyLow(Number(e.target.value))} className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-mono">
              <span className="text-neutral-500">Canny High Edge</span>
              <span className="text-emerald-400 font-bold">{cropCannyHigh}</span>
            </div>
            <input type="range" min="50" max="255" value={cropCannyHigh} onChange={(e) => setCropCannyHigh(Number(e.target.value))} className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          </div>
        </div>
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[8px] font-mono">
            <span className="text-neutral-500">Morph Close Kernel Size</span>
            <span className="text-emerald-400 font-bold">{cropCloseKernelSize}px</span>
          </div>
          <input type="range" min="3" max="51" step="2" value={cropCloseKernelSize} onChange={(e) => setCropCloseKernelSize(Number(e.target.value))} className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          <p className="text-[7.5px] text-neutral-600 leading-normal">Closes small gaps in black boundaries. Higher sizes group separated sketches into unified panels.</p>
        </div>
      </div>

      {/* JSON Payload Debugger */}
      <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950/50">
        <button type="button" onClick={() => setShowJsonDebugger(!showJsonDebugger)}
          className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/40 hover:bg-neutral-900/80 transition-colors border-b border-neutral-800 text-neutral-400 hover:text-white cursor-pointer select-none">
          <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-wider uppercase">
            <FileJson className="h-3.5 w-3.5 text-indigo-400" />
            <span>API JSON Request Payload Debugger</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showJsonDebugger ? "rotate-180 text-indigo-400" : ""}`} />
        </button>
        {showJsonDebugger && (
          <div className="p-4 bg-[#08080c] font-mono text-[9px] text-neutral-300 leading-relaxed overflow-x-auto select-all max-h-[160px] animate-fadeIn">
            <pre>{jsonPayload}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
