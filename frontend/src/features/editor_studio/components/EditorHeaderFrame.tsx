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
      className={`editor-header-frame relative flex flex-wrap lg:flex-nowrap w-full min-h-12 shrink-0 items-center justify-between gap-2 overflow-visible rounded-2xl border border-neutral-800 bg-neutral-950/80 p-2.5 sm:p-3 pr-3.5 sm:pr-4 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] select-none z-30 ${className}`}
    >
      <div className="editor-header-frame__left flex min-w-0 items-center gap-2 shrink-0">
        {left}
      </div>
      {center && (
        <div className={`editor-header-frame__center flex shrink-0 items-center justify-center ${centerClassName}`}>
          {center}
        </div>
      )}
      <div className="editor-header-frame__right flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 ml-auto">
        {right}
      </div>
    </div>
  );
}
