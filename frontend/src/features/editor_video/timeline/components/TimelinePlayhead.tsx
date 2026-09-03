// ─── TimelinePlayhead ─────────────────────────────────────────────────────────
// Canonical location: timeline/components/TimelinePlayhead.tsx
// High-precision scrubber needle locked to exact timeline time coordinates.

import React, { useState } from "react";

interface TimelinePlayheadProps {
  /** Current timeline time in seconds. */
  currentTime?: number;
  /** 0–100 percentage position within the scrollable track area. */
  playheadPercent?: number;
  zoomLevel?: number;
  onScrubStart?: (e: React.MouseEvent) => void;
  trackBounds?: { left: number; width: number } | null;
}

const TimelinePlayhead: React.FC<TimelinePlayheadProps> = ({
  currentTime,
  playheadPercent = 0,
  zoomLevel = 30,
  onScrubStart,
  trackBounds,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    onScrubStart?.(e);

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mouseup", onMouseUp);
  };

  const pxPerSec = zoomLevel;
  const left = 224 + Math.max(0, (currentTime ?? 0)) * pxPerSec;

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute top-0 bottom-0 w-[2px] z-[60] pointer-events-auto -translate-x-1/2 cursor-ew-resize group/playhead ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ left: `${left}px` }}
    >
      {/* Playhead Pin Head — stays on top above everything (z-[60]) */}
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-[60]">
        <svg
          width="16"
          height="18"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-100 ${
            isDragging
              ? "scale-125 drop-shadow-[0_0_16px_rgba(59,130,246,0.8)]"
              : "group-hover/playhead:scale-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]"
          }`}
        >
          <path
            d="M9 20L0 0H18L9 20Z"
            fill="#3B82F6"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Vertical Blue Scrubber Line */}
      <div className="relative w-full h-full pointer-events-none">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      </div>
    </div>
  );
};

export default React.memo(TimelinePlayhead);
