import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    baseBorder: "border-purple-400/30",
    hoverBg: "bg-purple-600",
    activeGlow: "shadow-[0_0_14px_rgba(192,132,252,1)] bg-purple-500",
    iconColor: "text-purple-200",
  },
  indigo: {
    baseBorder: "border-indigo-400/30",
    hoverBg: "bg-indigo-600",
    activeGlow: "shadow-[0_0_14px_rgba(129,140,248,1)] bg-indigo-500",
    iconColor: "text-indigo-200",
  },
  cyan: {
    baseBorder: "border-cyan-400/30",
    hoverBg: "bg-cyan-600",
    activeGlow: "shadow-[0_0_14px_rgba(103,232,249,1)] bg-cyan-500",
    iconColor: "text-cyan-200",
  },
  emerald: {
    baseBorder: "border-emerald-400/30",
    hoverBg: "bg-emerald-600",
    activeGlow: "shadow-[0_0_14px_rgba(52,211,153,1)] bg-emerald-500",
    iconColor: "text-emerald-200",
  },
};

export const ClipTrimHandles: React.FC<ClipTrimHandlesProps> = ({
  duration,
  isResizing = false,
  activeSide = null,
  onResizeStart,
  accentColor = "purple",
}) => {
  const styles = colorMap[accentColor] || colorMap.purple;

  return (
    <>
      {/* ─── Left Trim Handle (↔ Start) ─────────────────────────────────── */}
      <div
        onMouseDown={(e) => onResizeStart(e, "left", duration)}
        className={`group/handle absolute top-0 bottom-0 left-0 w-3.5 z-30 flex items-center justify-center transition-all select-none ${
          isResizing && activeSide === "left"
            ? `opacity-100 ${styles.activeGlow} border-r border-white`
            : `opacity-70 group-hover:opacity-100 hover:${styles.hoverBg} border-r ${styles.baseBorder} hover:border-white/80 bg-black/40 hover:bg-opacity-90`
        } rounded-l-md`}
        style={{ cursor: "ew-resize" }}
        title="Drag left edge to trim start (↔)"
      >
        <div className="flex flex-col items-center justify-center gap-0.5 pointer-events-none">
          <ChevronLeft className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] stroke-[2.5]" />
          <div className="w-[1.5px] h-2 bg-white/70 rounded-full" />
        </div>
      </div>

      {/* ─── Right Resize Handle (↔ End) ────────────────────────────────── */}
      <div
        onMouseDown={(e) => onResizeStart(e, "right", duration)}
        className={`group/handle absolute top-0 bottom-0 right-0 w-3.5 z-30 flex items-center justify-center transition-all select-none ${
          isResizing && activeSide === "right"
            ? `opacity-100 ${styles.activeGlow} border-l border-white`
            : `opacity-70 group-hover:opacity-100 hover:${styles.hoverBg} border-l ${styles.baseBorder} hover:border-white/80 bg-black/40 hover:bg-opacity-90`
        } rounded-r-md`}
        style={{ cursor: "ew-resize" }}
        title="Drag right edge to resize duration (↔)"
      >
        <div className="flex flex-col items-center justify-center gap-0.5 pointer-events-none">
          <ChevronRight className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] stroke-[2.5]" />
          <div className="w-[1.5px] h-2 bg-white/70 rounded-full" />
        </div>
      </div>
    </>
  );
};

export default React.memo(ClipTrimHandles);
