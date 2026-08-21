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
      className={`relative grid w-full items-center px-4 min-h-12 shrink-0 bg-neutral-950/70 backdrop-blur-xl border-b border-white/10 select-none gap-3 z-10 shadow-sm ${className}`}
      style={{
        gridTemplateColumns: center
          ? "minmax(0, 1fr) auto minmax(0, 1fr)"
          : "minmax(0, 1fr) auto",
      }}
    >
      <div className="flex items-center justify-self-start gap-2.5 min-w-0 overflow-hidden py-1">
        {left}
      </div>
      {center && (
        <div className="flex items-center justify-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0 justify-self-center backdrop-blur-md">
          {center}
        </div>
      )}
      <div className="flex items-center justify-self-end gap-2 min-w-0 overflow-hidden py-1">
        {right}
      </div>
    </div>
  );
}
