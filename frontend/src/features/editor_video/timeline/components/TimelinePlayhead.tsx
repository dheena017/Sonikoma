// ─── TimelinePlayhead ─────────────────────────────────────────────────────────
// Canonical location: timeline/components/TimelinePlayhead.tsx

import React, { useState } from "react";

interface TimelinePlayheadProps {
  /** 0–100 percentage position within the scrollable track area. */
  playheadPercent: number;
  onScrubStart?: (e: React.MouseEvent) => void;
}

const TimelinePlayhead: React.FC<TimelinePlayheadProps> = ({ playheadPercent, onScrubStart }) => {
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

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute top-0 bottom-0 w-[2px] z-30 pointer-events-auto -translate-x-1/2 cursor-ew-resize group/playhead ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        left: `calc(7rem + (100% - 7rem) * ${playheadPercent / 100})`,
      }}
    >
      {/* Playhead Pin Head — top triangle stays visible inside the timeline container */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
        <svg
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-100 ${
            isDragging
              ? "scale-125 drop-shadow-[0_0_16px_rgba(255,255,255,0.35)]"
              : "group-hover/playhead:scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
          }`}
        >
          <path
            d="M9 0L18 20H0L9 0Z"
            fill="#ffffff"
            stroke="#a855f7"
            strokeWidth="1.4"
          />
        </svg>
      </div>

      {/* Vertical Line */}
      <div className="relative w-full h-full pointer-events-none">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/80" />
      </div>
    </div>
  );
};

export default React.memo(TimelinePlayhead);
