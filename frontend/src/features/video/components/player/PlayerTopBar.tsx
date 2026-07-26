import React from "react";
import { Monitor, X } from "lucide-react";

interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}

interface PlayerTopBarProps {
  visible: boolean;
  activeChapter: Chapter;
  panelCounterText: string;
  onClose: () => void;
}

export const PlayerTopBar: React.FC<PlayerTopBarProps> = ({
  visible,
  activeChapter,
  panelCounterText,
  onClose,
}) => {
  return (
    <div
      className={`absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-30 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center">
          <Monitor className="h-3.5 w-3.5 text-purple-400" />
        </div>
        <div>
          <span className="text-[10px] font-mono text-purple-400 uppercase font-black tracking-widest block">
            Adaptation Player
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-200">
              {activeChapter ? `${activeChapter.title} Segment` : "Preview Track"}
            </span>
            {/* PANEL/SCENE COUNTER CHIP */}
            <span className="bg-neutral-900/90 border border-neutral-800/80 rounded px-2 py-0.5 text-[9px] font-mono font-bold text-purple-300 tracking-wider">
              {panelCounterText}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="h-10 w-10 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
        title="Back to Studio Workspace"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
