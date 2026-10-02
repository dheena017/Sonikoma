// ─── ClipResizeHandle ────────────────────────────────────────────────────────
// Canonical location: timeline/components/clips/ClipResizeHandle.tsx

import React from "react";

interface ClipResizeHandleProps {
  onResizeStart: (e: React.MouseEvent) => void;
  side?: "left" | "right";
}

const ClipResizeHandle: React.FC<ClipResizeHandleProps> = ({
  onResizeStart,
  side = "right",
}) => (
  <div
    onMouseDown={(e) => {
      e.stopPropagation();
      e.preventDefault();
      onResizeStart(e);
    }}
    className={`absolute top-0 bottom-0 w-1.5 z-20 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 transition-opacity hover:bg-[#2A2A2A] flex items-center justify-center ${
      side === "right" ? "right-0 rounded-r" : "left-0 rounded-l"
    }`}
  >
    <div className="w-0.5 h-3 bg-white/60 rounded-full" />
  </div>
);

export default React.memo(ClipResizeHandle);
