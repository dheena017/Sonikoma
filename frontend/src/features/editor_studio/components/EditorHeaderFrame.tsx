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
      className={`relative flex items-center justify-between w-full min-h-12 px-3.5 shrink-0 bg-gradient-to-r from-neutral-900/95 via-neutral-900/75 to-[#2A2A2A] border border-[#3B82F6]/30 rounded-2xl backdrop-blur-xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] select-none gap-2 z-10 ${className}`}
    >
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        {left}
      </div>
      {center && (
        <div className="flex items-center justify-center shrink-0">
          {center}
        </div>
      )}
      <div className="flex items-center gap-2 shrink-0 justify-end">
        {right}
      </div>
    </div>
  );
}
