// ─── ClipBlock ───────────────────────────────────────────────────────────────
// Canonical location: timeline/components/clips/ClipBlock.tsx

import React, { useState, useRef } from "react";
import ClipResizeHandle from "./ClipResizeHandle";
import SyncStatusBadge, { SyncStatus } from "../SyncStatusBadge";

interface ClipBlockProps {
  clipKey: string;
  panelIdx: number;
  label: string;
  duration: number;
  selected: boolean;
  baseColorClass: string;
  style?: React.CSSProperties;
  status?: SyncStatus;
  hasKeyframes?: boolean;
  onClipClick: (key: string, idx: number) => void;
  onContextMenu: (e: React.MouseEvent, key: string, idx: number) => void;
  onDurationChange?: (key: string, newDuration: number) => void;
  children?: React.ReactNode;
}

const ClipBlock: React.FC<ClipBlockProps> = ({
  clipKey,
  panelIdx,
  label,
  duration,
  selected,
  baseColorClass,
  style,
  status = "synced",
  hasKeyframes = false,
  onClipClick,
  onContextMenu,
  onDurationChange,
  children,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startDurationRef = useRef(duration);

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startDurationRef.current = duration;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startXRef.current;
      const deltaSecs = dx / 20; // 20px per second scale
      const nextDuration = Math.max(
        0.5,
        Math.min(30, startDurationRef.current + deltaSecs)
      );
      onDurationChange?.(clipKey, parseFloat(nextDuration.toFixed(1)));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      onClick={() => onClipClick(clipKey, panelIdx)}
      onContextMenu={(e) => onContextMenu(e, clipKey, panelIdx)}
      style={style}
      className={`group/clip absolute flex items-center justify-between cursor-pointer truncate transition-all rounded-lg border text-[10px] font-semibold px-2 ${baseColorClass} ${
        selected
          ? "ring-2 ring-white/60 brightness-115 z-10 shadow-lg"
          : "hover:brightness-110"
      } ${isResizing ? "ring-2 ring-purple-400" : ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-0 truncate">
        <SyncStatusBadge status={status} />
        <span className="truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-1">
        {hasKeyframes && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)]"
            title="Contains keyframes"
          />
        )}
        <span className="text-[9px] font-mono text-white/70 bg-black/40 px-1 py-0.2 rounded border border-white/10 font-bold">
          {duration.toFixed(1)}s
        </span>
      </div>

      {children}

      <ClipResizeHandle onResizeStart={handleResizeStart} side="right" />
    </div>
  );
};

export default React.memo(ClipBlock);
