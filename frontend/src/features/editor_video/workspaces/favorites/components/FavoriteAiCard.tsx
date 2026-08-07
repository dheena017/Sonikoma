import React from "react";
import { Wand2, Trash2 } from "lucide-react";
import { FavoriteItem } from "../FavoritesWorkspace";

export const FavoriteAiCard: React.FC<{
  item: FavoriteItem;
  onUse: () => void;
  onRemove: () => void;
}> = ({ item, onUse, onRemove }) => (
  <div
    onClick={onUse}
    className="p-3 rounded-2xl bg-[#141026]/90 border border-amber-500/30 hover:border-amber-400 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-md hover:shadow-[0_0_16px_rgba(245,158,11,0.2)]"
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
        <Wand2 className="h-4.5 w-4.5 text-amber-400" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h4 className="text-xs font-bold text-white group-hover:text-amber-200 leading-tight font-sans truncate">
          {item.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
          <span className="text-[8px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 shrink-0 font-semibold">
            AI Studio
          </span>
          {item.badge && <span className="truncate">• {item.badge}</span>}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); onUse(); }}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[10px] font-mono font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.35)] active:scale-95 cursor-pointer"
      >
        Use
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-red-500/50 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
        title="Remove Favorite"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);
