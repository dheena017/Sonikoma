import React from "react";
import { Film } from "lucide-react";
import { SliderRow } from "./EnhancementsColors.js";

interface EnhancementsCinematicProps {
  activeStoryboardPanel: any;
  handleModifyDuration: (panelId: number, val: number) => void;
  handleModifyMotionType: (panelId: number, val: string) => void;
  handleModifyCropPadding: (panelId: number, val: number) => void;
}

export function EnhancementsCinematic({
  activeStoryboardPanel,
  handleModifyDuration,
  handleModifyMotionType,
  handleModifyCropPadding,
}: EnhancementsCinematicProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/15">
          <Film className="h-3 w-3 text-indigo-400" />
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
          Cinematic Properties
        </span>
      </div>

      {/* Motion Type Dropdown */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
          Camera Motion Effect
        </label>
        <div className="relative">
          <select
            value={activeStoryboardPanel?.motion_type || "static"}
            disabled={!activeStoryboardPanel}
            onChange={(e) => activeStoryboardPanel && handleModifyMotionType(activeStoryboardPanel.id, e.target.value)}
            className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-purple-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="static">Static (No Motion)</option>
            <option value="zoom_in">Zoom In Animation</option>
            <option value="zoom_out">Zoom Out Animation</option>
            <option value="pan_right">Pan Right</option>
            <option value="pan_left">Pan Left</option>
            <option value="pan_down">Pan Down</option>
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none text-neutral-500">▼</span>
        </div>
      </div>

      {/* Playback Duration */}
      <SliderRow
        label="Scene Timing (Duration)"
        value={activeStoryboardPanel?.duration ?? 4.5}
        min={1}
        max={10}
        step={0.5}
        unit="s"
        disabled={!activeStoryboardPanel}
        onChange={(val) =>
          activeStoryboardPanel &&
          handleModifyDuration(activeStoryboardPanel.id, val)
        }
      />

      {/* Crop Margins Padding */}
      <SliderRow
        label="Margin Crop Padding"
        value={activeStoryboardPanel?.crop_padding ?? 10}
        min={0}
        max={40}
        step={1}
        unit="px"
        disabled={!activeStoryboardPanel}
        onChange={(val) =>
          activeStoryboardPanel &&
          handleModifyCropPadding(activeStoryboardPanel.id, val)
        }
      />
    </div>
  );
}
