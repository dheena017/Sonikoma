import React from "react";

export interface EditorHeaderFrameProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export default function EditorHeaderFrame({
  left,
  center,
  right,
  className = "",
}: EditorHeaderFrameProps) {
  return (
    <div
      className={`relative flex items-center justify-between w-full min-h-11 px-3.5 shrink-0 bg-neutral-950/80 backdrop-blur-xl border-b border-white/10 select-none gap-2 z-10 ${className}`}
    >
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        {left}
      </div>
      {center && (
        <div className="flex items-center justify-center gap-1 bg-black/60 p-0.5 rounded-xl border border-white/10 shrink-0 backdrop-blur-md">
          {center}
        </div>
      )}
      <div className="flex items-center gap-2 shrink-0 justify-end pr-1">
        {right}
      </div>
    </div>
  );
}
