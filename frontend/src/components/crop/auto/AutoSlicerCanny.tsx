import React from "react";

interface AutoSlicerCannyProps {
  minHeightPx: number;
  setMinHeightPx: (val: number) => void;
  minAreaPct: number;
  setMinAreaPct: (val: number) => void;
  mergeThreshold: number;
  setMergeThreshold: (val: number) => void;
  closeKernelSize: number;
  setCloseKernelSize: (val: number) => void;
  cannyLow: number;
  setCannyLow: (val: number) => void;
  cannyHigh: number;
  setCannyHigh: (val: number) => void;
}

export default function AutoSlicerCanny({
  minHeightPx,
  setMinHeightPx,
  minAreaPct,
  setMinAreaPct,
  mergeThreshold,
  setMergeThreshold,
  closeKernelSize,
  setCloseKernelSize,
  cannyLow,
  setCannyLow,
  cannyHigh,
  setCannyHigh,
}: AutoSlicerCannyProps) {
  return (
    <div className="space-y-3.5 pt-2.5 animate-fadeIn">
      {/* Min Height Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-mono">
          <span className="text-neutral-500">Min Panel Height</span>
          <span className="text-emerald-400 font-bold">{minHeightPx}px</span>
        </div>
        <input
          type="range"
          min="30"
          max="300"
          value={minHeightPx}
          onChange={(e) => setMinHeightPx(Number(e.target.value))}
          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Min Width Percentage Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-mono">
          <span className="text-neutral-500">Min Panel Width Ratio</span>
          <span className="text-emerald-400 font-bold">{Math.round(minAreaPct * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.05"
          max="0.50"
          step="0.01"
          value={minAreaPct}
          onChange={(e) => setMinAreaPct(Number(e.target.value))}
          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Merge Threshold Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-mono">
          <span className="text-neutral-500">Grouping Proximity</span>
          <span className="text-emerald-400 font-bold">{mergeThreshold}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={mergeThreshold}
          onChange={(e) => setMergeThreshold(Number(e.target.value))}
          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Close Kernel Size */}
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-mono">
          <span className="text-neutral-500">Morph Close Size</span>
          <span className="text-emerald-400 font-bold">{closeKernelSize}px</span>
        </div>
        <input
          type="range"
          min="3"
          max="51"
          step="2"
          value={closeKernelSize}
          onChange={(e) => setCloseKernelSize(Number(e.target.value))}
          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Canny Edge Low & High sliders */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] font-mono">
            <span className="text-neutral-500">Canny Low</span>
            <span className="text-emerald-400 font-bold">{cannyLow}</span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            value={cannyLow}
            onChange={(e) => setCannyLow(Number(e.target.value))}
            className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] font-mono">
            <span className="text-neutral-500">Canny High</span>
            <span className="text-emerald-400 font-bold">{cannyHigh}</span>
          </div>
          <input
            type="range"
            min="50"
            max="255"
            value={cannyHigh}
            onChange={(e) => setCannyHigh(Number(e.target.value))}
            className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
