import React from "react";
import { Sparkles } from "lucide-react";

export interface BatchPresetsControlsProps {
  cropSensitivity?: number;
  setCropSensitivity?: (v: number) => void;
  autoSplitTallStrips?: boolean;
  setAutoSplitTallStrips?: (v: boolean) => void;
}

export const BatchPresetsControls: React.FC<BatchPresetsControlsProps> = ({
  cropSensitivity = 50,
  setCropSensitivity,
  autoSplitTallStrips = true,
  setAutoSplitTallStrips,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Batch Presets
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
          <div>
            <p className="text-[11px] font-bold text-neutral-200">
              Auto-Crop Sensitivity
            </p>
            <p className="text-[9px] text-neutral-500 font-mono">
              Edge detection threshold
            </p>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={cropSensitivity}
            onChange={(e) => setCropSensitivity?.(parseInt(e.target.value))}
            className="w-24 accent-purple-500"
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
          <p className="text-[11px] font-bold text-neutral-200">
            Auto-Split Strips
          </p>
          <button
            type="button"
            onClick={() => setAutoSplitTallStrips?.(!autoSplitTallStrips)}
            className={`w-10 h-5 rounded-full relative ${
              autoSplitTallStrips ? "bg-purple-600" : "bg-neutral-800"
            }`}
          >
            <div
              className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                autoSplitTallStrips ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
