import React from "react";
import { Sparkles } from "lucide-react";

export function SlicingBefore() {
  return (
    <div className="w-full h-full bg-[#0d0e15] p-5 flex flex-col items-center justify-start gap-4 overflow-y-auto custom-scrollbar">
      <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 self-start">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        Raw Vertical Webtoon Strip (Continuous)
      </div>

      {/* Comic Panel 1 */}
      <div className="w-full max-w-[280px] bg-gradient-to-br from-[#2A2A2A] via-slate-900 to-indigo-950 border border-neutral-700/60 rounded-xl p-3.5 space-y-2 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-[#60A5FA]">SCENE 01 • PROTAGONIST</span>
          <span className="text-[9px] font-mono text-neutral-400">Panel 1</span>
        </div>
        <div className="h-24 rounded-lg bg-gradient-to-r from-[#2A2A2A] to-indigo-800/40 border border-[#3B82F6]/20 flex flex-col items-center justify-center relative">
          <div className="text-2xl">⚡️</div>
          <span className="text-xs font-black text-white tracking-wide uppercase mt-1">Awakening</span>
          <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-neutral-300">
            "Is this... my power?"
          </div>
        </div>
      </div>

      {/* Comic Panel 2 */}
      <div className="w-full max-w-[280px] bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border border-neutral-700/60 rounded-xl p-3.5 space-y-2 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-blue-300">SCENE 02 • BATTLE CLASH</span>
          <span className="text-[9px] font-mono text-neutral-400">Panel 2</span>
        </div>
        <div className="h-28 rounded-lg bg-gradient-to-r from-blue-800/40 to-indigo-800/40 border border-blue-500/20 flex flex-col items-center justify-center relative">
          <div className="text-3xl">⚔️</div>
          <span className="text-xs font-black text-white tracking-wide uppercase mt-1">Shadow Strike</span>
          <div className="absolute bottom-2 left-2 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-rose-300">
            *CRASH!*
          </div>
        </div>
      </div>
    </div>
  );
}
