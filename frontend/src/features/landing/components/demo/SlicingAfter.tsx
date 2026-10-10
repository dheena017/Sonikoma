import React from "react";
import { CheckCircle2, Scissors } from "lucide-react";

export function SlicingAfter() {
  return (
    <div className="w-full h-full bg-[#0d0e15] p-3 sm:p-4 flex flex-col items-center justify-start gap-3 overflow-y-auto custom-scrollbar">
      <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 self-start shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        AI Vision Bounding Boxes Detected (2 Panels Isolated)
      </div>

      {/* Sliced Panel 1 */}
      <div className="w-full max-w-[280px] h-36 rounded-xl border-2 border-emerald-400 overflow-hidden relative shadow-lg shadow-emerald-500/10 shrink-0 group transition-transform hover:scale-[1.02]">
        <img
          src="/motion-scroll-dungeon.jpg"
          alt="AI Sliced comic panel 1"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono text-[9px] font-extrabold flex items-center gap-1">
            <Scissors className="w-2.5 h-2.5" />
            PANEL 01 • 1080x1440
          </span>
          <span className="text-[9px] font-mono text-emerald-300 bg-black/70 px-1.5 py-0.5 rounded border border-emerald-500/40 font-bold">
            99.8% Match
          </span>
        </div>
      </div>

      {/* Sliced Panel 2 */}
      <div className="w-full max-w-[280px] h-36 rounded-xl border-2 border-blue-400 overflow-hidden relative shadow-lg shadow-blue-500/10 shrink-0 group transition-transform hover:scale-[1.02]">
        <img
          src="/motion-scroll-dungeon.jpg"
          alt="AI Sliced comic panel 2"
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[9px] font-extrabold flex items-center gap-1">
            <Scissors className="w-2.5 h-2.5" />
            PANEL 02 • 1080x1920
          </span>
          <span className="text-[9px] font-mono text-blue-300 bg-black/70 px-1.5 py-0.5 rounded border border-blue-500/40 font-bold">
            99.5% Match
          </span>
        </div>
      </div>
    </div>
  );
}
