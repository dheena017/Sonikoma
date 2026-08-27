// ─── ClipTrimHandles ─────────────────────────────────────────────────────────
// Canonical location: timeline/components/ClipTrimHandles.tsx
// Studio-grade left & right clip drag-to-resize trim handles with grip indicators,
// hover illumination, active state feedback, and Canva-style `···` action menu trigger.

import React from "react";
import { MoreHorizontal } from "lucide-react";

interface ClipTrimHandlesProps {
  clipKey: string;
  duration: number;
  isResizing?: boolean;
  activeSide?: "left" | "right" | null;
  onResizeStart: (
    e: React.MouseEvent,
    side: "left" | "right",
    currentDuration: number
  ) => void;
  onOpenMenu?: (e: React.MouseEvent) => void;
  accentColor?: "purple" | "indigo" | "cyan" | "emerald";
}

const colorMap = {
  purple: {
    handleBg: "bg-purple-500/30 hover:bg-purple-400/90",
    gripLine: "bg-white",
    glow: "shadow-[0_0_12px_rgba(192,132,252,0.8)]",
  },
  indigo: {
    handleBg: "bg-indigo-500/30 hover:bg-indigo-400/90",
    gripLine: "bg-white",
    glow: "shadow-[0_0_12px_rgba(129,140,248,0.8)]",
  },
  cyan: {
    handleBg: "bg-cyan-500/30 hover:bg-cyan-400/90",
    gripLine: "bg-white",
    glow: "shadow-[0_0_12px_rgba(103,232,249,0.8)]",
  },
  emerald: {
    handleBg: "bg-emerald-500/30 hover:bg-emerald-400/90",
    gripLine: "bg-white",
    glow: "shadow-[0_0_12px_rgba(52,211,153,0.8)]",
  },
};

export const ClipTrimHandles: React.FC<ClipTrimHandlesProps> = ({
  duration,
  isResizing = false,
  activeSide = null,
  onResizeStart,
  onOpenMenu,
  accentColor = "purple",
}) => {
  const styles = colorMap[accentColor] || colorMap.purple;

  return (
    <>
      {/* ─── Left Trim Handle ────────────────────────────────────────────── */}
      <div
        onMouseDown={(e) => onResizeStart(e, "left", duration)}
        className={`absolute top-0 bottom-0 left-0 w-3 z-30 cursor-col-resize flex items-center justify-center transition-opacity ${
          isResizing && activeSide === "left"
            ? `opacity-100 ${styles.handleBg} ${styles.glow} brightness-125`
            : `opacity-0 group-hover:opacity-100 ${styles.handleBg}`
        } rounded-l-sm select-none`}
        title="Drag left edge to trim start"
      >
        <div className="flex items-center gap-[1px]">
          <div className={`w-[1px] h-3.5 ${styles.gripLine} rounded-full opacity-80`} />
          <div className={`w-[1px] h-3.5 ${styles.gripLine} rounded-full opacity-50`} />
        </div>
      </div>

      {/* ─── Right Resize Handle ─────────────────────────────────────────── */}
      <div
        onMouseDown={(e) => onResizeStart(e, "right", duration)}
        className={`absolute top-0 bottom-0 right-0 w-3 z-30 cursor-col-resize flex items-center justify-center transition-opacity ${
          isResizing && activeSide === "right"
            ? `opacity-100 ${styles.handleBg} ${styles.glow} brightness-125`
            : `opacity-0 group-hover:opacity-100 ${styles.handleBg}`
        } rounded-r-sm select-none`}
        title="Drag right edge to resize duration"
      >
        <div className="flex items-center gap-[1px]">
          <div className={`w-[1px] h-3.5 ${styles.gripLine} rounded-full opacity-50`} />
          <div className={`w-[1px] h-3.5 ${styles.gripLine} rounded-full opacity-80`} />
        </div>
      </div>
    </>
  );
};

export default React.memo(ClipTrimHandles);
