// ─── KeyframePanel ───────────────────────────────────────────────────────────
// Canonical location: timeline/components/keyframes/KeyframePanel.tsx

import React from "react";
import {
  Keyframe,
  KeyframeProperty,
  EasingMode,
  KEYFRAME_COLORS,
} from "../../types";
import { Diamond, Trash2, X } from "lucide-react";

interface KeyframePanelProps {
  keyframe: Keyframe | null;
  onClose: () => void;
  onUpdate: (patch: Partial<Omit<Keyframe, "id">>) => void;
  onDelete: () => void;
}

const PROPERTIES: KeyframeProperty[] = [
  "opacity",
  "x",
  "y",
  "scale",
  "rotation",
  "blur",
  "volume",
];
const EASINGS: EasingMode[] = [
  "linear",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "step",
];

const KeyframePanel: React.FC<KeyframePanelProps> = ({
  keyframe,
  onClose,
  onUpdate,
  onDelete,
}) => {
  if (!keyframe) return null;

  return (
    <div className="absolute right-2 top-2 z-40 w-64 bg-[#14141c] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Diamond className="h-3.5 w-3.5 fill-amber-400" />
          <span>Keyframe Inspector</span>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded text-neutral-400 hover:text-white hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Time */}
        <div className="flex items-center justify-between">
          <label className="text-neutral-400 text-[10px]">Time Position</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min="0"
              value={keyframe.time}
              onChange={(e) =>
                onUpdate({ time: parseFloat(e.target.value) || 0 })
              }
              className="w-16 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-right font-mono text-white text-[11px]"
            />
            <span className="text-neutral-500 font-mono text-[10px]">s</span>
          </div>
        </div>

        {/* Property */}
        <div className="flex items-center justify-between">
          <label className="text-neutral-400 text-[10px]">
            Target Property
          </label>
          <select
            value={keyframe.property}
            onChange={(e) =>
              onUpdate({ property: e.target.value as KeyframeProperty })
            }
            className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-white text-[11px]"
          >
            {PROPERTIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Value */}
        <div className="flex items-center justify-between">
          <label className="text-neutral-400 text-[10px]">Value</label>
          <input
            type="number"
            step="0.05"
            value={keyframe.value}
            onChange={(e) =>
              onUpdate({ value: parseFloat(e.target.value) || 0 })
            }
            className="w-20 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-right font-mono text-white text-[11px]"
          />
        </div>

        {/* Easing */}
        <div className="flex items-center justify-between">
          <label className="text-neutral-400 text-[10px]">Easing Mode</label>
          <select
            value={keyframe.easing}
            onChange={(e) => onUpdate({ easing: e.target.value as EasingMode })}
            className="bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-white text-[11px]"
          >
            {EASINGS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-colors text-[10px]"
        >
          <Trash2 className="h-3 w-3" />
          <span>Remove Keyframe</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(KeyframePanel);
