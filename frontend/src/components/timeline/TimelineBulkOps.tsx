import React from "react";

interface TimelineBulkOpsProps {
  bulkDuration: number;
  setBulkDuration: (val: number) => void;
  handleBulkSetDuration: () => void;
  bulkMotion: string;
  setBulkMotion: (val: string) => void;
  handleBulkSetMotion: () => void;
  bulkPreset: string;
  setBulkPreset: (val: string) => void;
  handleBulkSetPreset: () => void;
  handleClearTimeline: () => void;
}

export default function TimelineBulkOps({
  bulkDuration,
  setBulkDuration,
  handleBulkSetDuration,
  bulkMotion,
  setBulkMotion,
  handleBulkSetMotion,
  bulkPreset,
  setBulkPreset,
  handleBulkSetPreset,
  handleClearTimeline,
}: TimelineBulkOpsProps) {
  return (
    <div className="bg-neutral-950/70 p-3 sm:p-4 rounded-xl border border-purple-900/30 grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 animate-fadeIn">
      {/* Duration */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">
          Bulk Set Timing
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={45}
            step={0.5}
            value={bulkDuration}
            onChange={(e) => setBulkDuration(parseFloat(e.target.value) || 4.0)}
            className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-[11px] text-white w-20 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              console.log("[TimelineBulkOps] Bulk set duration");
              handleBulkSetDuration();
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold py-1 rounded transition-colors cursor-pointer"
          >
            Apply All
          </button>
        </div>
      </div>

      {/* Camera Motion */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">
          Bulk Set Cam Motion
        </label>
        <div className="flex gap-2">
          <select
            value={bulkMotion}
            onChange={(e) => setBulkMotion(e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-[11px] text-white outline-none cursor-pointer"
          >
            <option value="zoom_in">Zoom In</option>
            <option value="zoom_out">Zoom Out</option>
            <option value="pan_right">Pan Right</option>
            <option value="pan_left">Pan Left</option>
            <option value="pan_down">Pan Down</option>
          </select>
          <button
            type="button"
            onClick={() => {
              console.log("[TimelineBulkOps] Bulk set motion");
              handleBulkSetMotion();
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded transition-colors cursor-pointer"
          >
            Apply All
          </button>
        </div>
      </div>

      {/* Color Grading Presets */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">
          Bulk Set Color Preset
        </label>
        <div className="flex gap-2">
          <select
            value={bulkPreset}
            onChange={(e) => setBulkPreset(e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-[11px] text-white outline-none cursor-pointer"
          >
            <option value="none">Original</option>
            <option value="anime_vibrant">Anime Vibrant</option>
            <option value="cinematic_drama">Cinematic Dark</option>
            <option value="hdr_clear">Clarity HDR</option>
            <option value="vintage_warm">Vintage Warm</option>
            <option value="neon_cyber">Neon Cyberpunk</option>
          </select>
          <button
            type="button"
            onClick={() => {
              console.log("[TimelineBulkOps] Bulk set preset");
              handleBulkSetPreset();
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded transition-colors cursor-pointer"
          >
            Apply All
          </button>
        </div>
      </div>

      {/* Reset / Actions */}
      <div className="flex flex-col justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            console.log("[TimelineBulkOps] Clear timeline requested");
            handleClearTimeline();
          }}
          className="w-full bg-red-950/40 hover:bg-red-950/60 border border-red-900/40 text-red-400 text-[10px] font-bold py-1.5 rounded transition-colors cursor-pointer"
        >
          Clear Storyboard Timeline
        </button>
      </div>
    </div>
  );
}
