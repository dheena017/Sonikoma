import React from "react";
import { Type, Clock, RotateCcw } from "lucide-react";
import { RecentItem } from "../RecentWorkspace";

export const RecentFontCard: React.FC<{ item: RecentItem; onAction: () => void }> = ({ item, onAction }) => (
  <div
    onClick={onAction}
    className="p-3 rounded-2xl bg-[#120e24]/90 border border-purple-900/40 hover:border-purple-500/70 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-md hover:shadow-[0_0_16px_rgba(168,85,247,0.25)]"
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-900/60 to-purple-950/90 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
        <Type className="h-5 w-5 text-purple-300" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-white group-hover:text-purple-200 leading-snug font-sans break-words">
            {item.title}
          </h4>
          <span className="text-[9px] font-mono bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-500/30 shrink-0">
            Used {item.usesCount}x
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-purple-400" /> {item.timeAgo}</span>
          {item.badge && <span className="text-neutral-400">• {item.badge}</span>}
        </div>
      </div>
    </div>

    <button
      onClick={(e) => { e.stopPropagation(); onAction(); }}
      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)] active:scale-95 cursor-pointer"
    >
      <RotateCcw className="h-3 w-3" /> Re-use
    </button>
  </div>
);
