import React from "react";

export function SlicingAfter() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 space-y-6 bg-neutral-950 overflow-y-auto scrollbar-thin">
      <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-2 border-b border-purple-500/10 w-full pb-2 text-center">
        Detected Bounding Boxes
      </div>
      <div className="w-48 h-32 rounded-xl bg-gradient-to-br from-indigo-950 to-blue-900 flex items-center justify-center border border-purple-500 relative overflow-hidden shrink-0 shadow-lg shadow-purple-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2),transparent_70%)]" />
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 animate-pulse" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600 text-white font-mono text-[8px] font-bold shadow-md">
          PANEL 01 (99.8%)
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-purple-300 font-mono text-[8px]">
          x:0, y:0, w:192, h:128
        </div>
      </div>
      <div className="w-48 h-40 rounded-xl bg-gradient-to-br from-purple-950 to-indigo-900 flex items-center justify-center border border-emerald-500 relative overflow-hidden shrink-0 shadow-lg shadow-emerald-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),transparent_70%)]" />
        <div className="w-12 h-24 bg-white/5 rounded-lg border border-white/10" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[8px] font-bold shadow-md">
          PANEL 02 (99.4%)
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-emerald-300 font-mono text-[8px]">
          x:0, y:152, w:192, h:160
        </div>
      </div>
      <div className="w-48 h-36 rounded-xl bg-gradient-to-br from-emerald-950 to-teal-900 flex items-center justify-center border border-indigo-500 relative overflow-hidden shrink-0 shadow-lg shadow-indigo-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.2),transparent_70%)]" />
        <div className="w-20 h-10 bg-white/5 rounded border border-white/10" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[8px] font-bold shadow-md">
          PANEL 03 (98.9%)
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-indigo-300 font-mono text-[8px]">
          x:0, y:336, w:192, h:144
        </div>
      </div>
    </div>
  );
}
