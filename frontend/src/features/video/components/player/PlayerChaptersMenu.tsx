import React from "react";

interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}

interface PlayerChaptersMenuProps {
  show: boolean;
  chapters: Chapter[];
  activeChapter: Chapter;
  onSelectChapter: (startTime: number) => void;
  formatTime: (sec: number) => string;
}

export const PlayerChaptersMenu: React.FC<PlayerChaptersMenuProps> = ({
  show,
  chapters,
  activeChapter,
  onSelectChapter,
  formatTime,
}) => {
  if (!show) return null;

  return (
    <div className="absolute bottom-20 left-6 bg-neutral-900/95 border border-neutral-800/80 rounded-2xl p-2 shadow-2xl backdrop-blur-md w-48 overflow-hidden flex flex-col gap-1 z-50 animate-fade-in pointer-events-auto">
      <div className="px-3.5 py-2 border-b border-neutral-800/60 mb-1">
        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-black block">
          Video Chapters
        </span>
      </div>
      {chapters.map((chapter, idx) => {
        const isActive = activeChapter.title === chapter.title;
        return (
          <button
            key={idx}
            onClick={() => onSelectChapter(chapter.startTime)}
            className={`flex items-center justify-between px-3.5 py-2 text-left rounded-xl transition-all cursor-pointer text-xs ${
              isActive
                ? "bg-purple-950/30 border border-purple-900/40 text-purple-400 font-bold"
                : "hover:bg-neutral-800/40 border border-transparent text-neutral-300"
            }`}
          >
            <span>{chapter.title}</span>
            <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
              {formatTime(chapter.startTime)}
            </span>
          </button>
        );
      })}
    </div>
  );
};
