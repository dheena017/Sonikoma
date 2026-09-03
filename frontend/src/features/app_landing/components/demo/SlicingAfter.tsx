import React from "react";
import { CheckCircle2, Scissors } from "lucide-react";

export function SlicingAfter() {
  return (
    <div className="w-full h-full bg-[#0d0e15] p-5 flex flex-col items-center justify-start gap-4 overflow-y-auto custom-scrollbar">
      <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 self-start">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        AI Vision Bounding Boxes Detected (2 Panels)
      </div>

      {/* Sliced Panel 1 */}
      <div className="w-full max-w-[280px] bg-gradient-to-br from-purple-900/90 via-slate-900 to-indigo-950 border-2 border-emerald-400 rounded-xl p-3.5 space-y-2 shadow-lg shadow-emerald-500/10 relative overflow-hidden transition-transform hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono text-[9px] font-extrabold flex items-center gap-1">
            <Scissors className="w-2.5 h-2.5" />
            PANEL 01 • 1080x1350 (99.8%)
          </span>
          <span className="text-[9px] font-mono text-emerald-400 font-bold">READY</span>
        </div>
        <div className="h-24 rounded-lg bg-gradient-to-r from-purple-800/50 to-indigo-800/50 border border-emerald-400/40 flex flex-col items-center justify-center relative">
          <div className="text-2xl">⚡️</div>
          <span className="text-xs font-black text-white tracking-wide uppercase mt-1">Awakening</span>
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-neutral-200">
            "Is this... my power?"
          </div>
        </div>
      </div>

      {/* Sliced Panel 2 */}
      <div className="w-full max-w-[280px] bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border-2 border-purple-400 rounded-xl p-3.5 space-y-2 shadow-lg shadow-purple-500/10 relative overflow-hidden transition-transform hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded bg-purple-500 text-white font-mono text-[9px] font-extrabold flex items-center gap-1">
            <Scissors className="w-2.5 h-2.5" />
            PANEL 02 • 1080x1920 (99.4%)
          </span>
          <span className="text-[9px] font-mono text-purple-300 font-bold">READY</span>
        </div>
        <div className="h-28 rounded-lg bg-gradient-to-r from-blue-800/50 to-indigo-800/50 border border-purple-400/40 flex flex-col items-center justify-center relative">
          <div className="text-3xl">⚔️</div>
          <span className="text-xs font-black text-white tracking-wide uppercase mt-1">Shadow Strike</span>
          <div className="absolute bottom-2 left-2 bg-rose-950/90 border border-rose-400 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-rose-300">
            *CRASH!*
          </div>
        </div>
      </div>
    </div>
  );
}
