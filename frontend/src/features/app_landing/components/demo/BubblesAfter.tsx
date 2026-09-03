import React from "react";
import { Sparkles, Check } from "lucide-react";

export function BubblesAfter() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-[#0d0e15] relative overflow-hidden">
      {/* Comic Illustration Scene - Clean Inpainted */}
      <div className="w-72 h-72 rounded-2xl bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-950 border-2 border-emerald-400 p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-emerald-500/10">
        {/* Full Unobstructed Artwork */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.45),transparent_60%)]" />
        <div className="absolute top-8 right-6 w-32 h-32 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 rounded-full blur-xl border border-purple-500/20 flex items-center justify-center">
          <div className="text-3xl opacity-80">🌌</div>
        </div>
        <div className="absolute bottom-0 right-0 w-36 h-48 bg-gradient-to-t from-slate-950 to-indigo-900/60 rounded-tl-3xl border-l border-t border-purple-500/30" />

        {/* Status Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-purple-400 bg-black/50 px-2 py-0.5 rounded border border-purple-500/30">
            CHAPTER 1 • CLIMAX
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-mono font-extrabold flex items-center gap-1">
            <Check className="w-2.5 h-2.5" />
            AI Inpainted Clean
          </span>
        </div>

        {/* Character Silhouette & Restored Energy */}
        <div className="absolute bottom-4 left-6 z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-400 flex items-center justify-center text-2xl shadow-lg border border-white/20">
            🦸‍♂️
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-wider mt-1.5">Jin-Woo</span>
        </div>

        {/* Restored Artwork Shimmer Badge */}
        <div className="absolute top-12 right-6 z-20 bg-emerald-950/80 border border-emerald-400/50 px-2.5 py-1 rounded-xl text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Background Restored
        </div>
      </div>
    </div>
  );
}
