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
      className={`relative grid w-full items-center px-4 h-12 shrink-0 bg-[#09090e]/95 backdrop-blur-md border-b border-neutral-800/80 select-none gap-3 ${className}`}
      style={{ gridTemplateColumns: center ? "minmax(0, 1fr) auto minmax(0, 1fr)" : "minmax(0, 1fr) auto" }}
    >
      <div className="flex items-center justify-self-start gap-2.5 min-w-0 overflow-hidden">{left}</div>
      {center && (
        <div className="flex items-center justify-center gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800/80 shrink-0 justify-self-center">
          {center}
        </div>
      )}
      <div className="flex items-center justify-self-end gap-2 min-w-0 overflow-hidden">{right}</div>
    </div>
  );
}
