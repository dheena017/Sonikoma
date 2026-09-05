import React from "react";

export interface EditorHeaderFrameProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  centerClassName?: string;
}

export default function EditorHeaderFrame({
  left,
  center,
  right,
  className = "",
  centerClassName = "",
}: EditorHeaderFrameProps) {
  return (
    <div
      className={`editor-header-frame relative flex w-full min-h-12 shrink-0 items-center justify-between gap-2 rounded-2xl border border-[#3B82F6]/30 bg-gradient-to-r from-neutral-900/95 via-neutral-900/75 to-[#2A2A2A] p-3 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] select-none z-10 ${className}`}
    >
      <div className="editor-header-frame__left flex min-w-0 items-center gap-2.5">
        {left}
      </div>
      {center && (
        <div className={`editor-header-frame__center flex shrink-0 items-center justify-center ${centerClassName}`}>
          {center}
        </div>
      )}
      <div className="editor-header-frame__right flex shrink-0 items-center justify-end gap-2">
        {right}
      </div>
    </div>
  );
}
