// ─── KeyframeDiamond ─────────────────────────────────────────────────────────
// Canonical location: timeline/components/keyframes/KeyframeDiamond.tsx

import React from "react";
import { Keyframe, KEYFRAME_COLORS } from "../../types";

interface KeyframeDiamondProps {
  keyframe: Keyframe;
  clipDuration: number;
  selected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onCycleEasing: (id: string, e: React.MouseEvent) => void;
}

const KeyframeDiamond: React.FC<KeyframeDiamondProps> = ({
  keyframe,
  clipDuration,
  selected,
  onSelect,
  onCycleEasing,
}) => {
  const leftPct = clipDuration > 0 ? (keyframe.time / clipDuration) * 100 : 0;
  const colorClass =
    KEYFRAME_COLORS[keyframe.property] || "bg-purple-400 border-purple-300";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(keyframe.id, e);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onCycleEasing(keyframe.id, e);
      }}
      title={`${keyframe.property}: ${keyframe.value} (${keyframe.easing}) — Right-click to change easing`}
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-30 group/kf"
      style={{ left: `${leftPct}%` }}
    >
      <div
        className={`w-2.5 h-2.5 rotate-45 border shadow-sm transition-transform ${colorClass} ${
          selected
            ? "ring-2 ring-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
            : "hover:scale-110"
        }`}
      />
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded bg-black/90 text-white text-[8px] font-mono whitespace-nowrap opacity-0 group-hover/kf:opacity-100 transition-opacity pointer-events-none z-40 border border-white/10">
        {keyframe.property} = {keyframe.value} ({keyframe.easing})
      </div>
    </div>
  );
};

export default React.memo(KeyframeDiamond);
