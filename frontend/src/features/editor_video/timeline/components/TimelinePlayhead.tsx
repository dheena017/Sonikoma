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
      {/* Playhead Pin Head — bottom tip points exactly at top:0 where the line begins */}
      <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
        <svg
          width="14"
          height="16"
          viewBox="0 0 14 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-100 ${
            isDragging
              ? "scale-125 drop-shadow-[0_0_14px_rgba(168,85,247,1)]"
              : "group-hover/playhead:scale-110 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]"
          }`}
        >
          <path
            d="M7 16L1 9.5C0.3 8.7 0 7.6 0 6.5C0 2.9 3.1 0 7 0C10.9 0 14 2.9 14 6.5C14 7.6 13.7 8.7 13 9.5L7 16Z"
            fill="#a855f7"
            stroke="#f3e8ff"
            strokeWidth="1.2"
          />
          <circle cx="7" cy="6.2" r="2" fill="#ffffff" />
        </svg>
      </div>

      {/* Vertical Line */}
      <div className="relative w-full h-full pointer-events-none">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-purple-300/90" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-purple-500/20 rounded-full blur-2xl" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full border border-purple-300/30 bg-purple-500/20 shadow-[0_0_24px_rgba(168,85,247,0.28)]" />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white" />
      </div>
    </div>
  );
};

export default React.memo(TimelinePlayhead);
