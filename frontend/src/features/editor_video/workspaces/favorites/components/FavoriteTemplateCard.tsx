import React from "react";
import { LayoutTemplate, Trash2 } from "lucide-react";
import { FavoriteItem } from "../FavoritesWorkspace";

export const FavoriteTemplateCard: React.FC<{
  item: FavoriteItem;
  onUse: () => void;
  onRemove: () => void;
}> = ({ item, onUse, onRemove }) => (
  <div
    onClick={onUse}
    className="p-3 rounded-[1.75rem] bg-[#07060f] border border-white/5 shadow-[0_18px_42px_rgba(0,0,0,0.18)] hover:border-amber-400/25 hover:shadow-[0_18px_48px_rgba(245,158,11,0.22)] transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer"
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="h-11 w-11 rounded-3xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
        <LayoutTemplate className="h-5.5 w-5.5 text-amber-400" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h4 className="text-xs font-semibold text-white group-hover:text-amber-100 leading-tight font-sans truncate">
          {item.title}
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-400 font-mono">
          <span className="text-[9px] uppercase tracking-[0.18em] bg-amber-500/15 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold shrink-0">
            Templates
          </span>
          {item.badge && <span className="truncate">• {item.badge}</span>}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); onUse(); }}
        className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-neutral-950 text-[10px] font-mono font-bold uppercase tracking-[0.04em] transition-all shadow-[0_0_14px_rgba(245,158,11,0.25)] active:scale-95"
      >
        Use
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="p-2 rounded-2xl bg-neutral-900/85 border border-neutral-800 hover:border-red-500/40 text-neutral-300 hover:text-red-300 transition-all"
        title="Remove Favorite"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);
