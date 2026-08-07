import React from "react";
import { Music, Clock, RotateCcw } from "lucide-react";
import { RecentItem } from "../RecentWorkspace";

export const RecentAudioCard: React.FC<{ item: RecentItem; onAction: () => void }> = ({ item, onAction }) => (
  <div
    onClick={onAction}
    className="p-3 rounded-[1.75rem] bg-[#07060f] border border-white/5 shadow-[0_18px_42px_rgba(0,0,0,0.18)] hover:border-violet-500/25 hover:shadow-[0_18px_48px_rgba(168,85,247,0.22)] transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer"
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="h-11 w-11 rounded-3xl bg-violet-500/12 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
        <Music className="h-5.5 w-5.5 text-violet-300" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h4 className="text-xs font-semibold text-white group-hover:text-violet-100 leading-tight font-sans truncate">
          {item.title}
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-400 font-mono">
          <span className="text-[9px] uppercase tracking-[0.18em] bg-violet-500/15 text-violet-200 px-2 py-0.5 rounded-full border border-violet-500/20 font-semibold shrink-0">
            Used {item.usesCount}x
          </span>
          <span className="flex items-center gap-1 shrink-0"><Clock className="h-3 w-3 text-violet-400" /> {item.timeAgo}</span>
          {item.badge && <span className="truncate">• {item.badge}</span>}
        </div>
      </div>
    </div>

    <button
      onClick={(e) => { e.stopPropagation(); onAction(); }}
      className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-500 text-white text-[10px] font-mono font-bold uppercase tracking-[0.04em] flex items-center gap-1.5 shrink-0 transition-all shadow-[0_0_14px_rgba(168,85,247,0.25)] active:scale-95"
    >
      <RotateCcw className="h-3 w-3" /> Re-use
    </button>
  </div>
);
