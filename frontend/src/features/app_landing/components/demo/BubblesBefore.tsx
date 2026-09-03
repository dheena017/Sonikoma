import React from "react";

export function BubblesBefore() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-[#0d0e15] relative overflow-hidden">
      {/* Comic Illustration Scene */}
      <div className="w-72 h-72 rounded-2xl bg-gradient-to-br from-[#2A2A2A] via-slate-900 to-indigo-950 border border-neutral-700/80 p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl">
        {/* Scene Background Artwork Simulation */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.35),transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-36 h-48 bg-gradient-to-t from-slate-950 to-indigo-900/60 rounded-tl-3xl border-l border-t border-[#3B82F6]/30" />

        {/* Character Aura */}
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-mono font-bold text-[#3B82F6] bg-black/50 px-2 py-0.5 rounded border border-[#3B82F6]/30 inline-block">
            CHAPTER 1 • CLIMAX
          </span>
        </div>

        {/* Character Silhouette & Energy */}
        <div className="absolute bottom-4 left-6 z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-2xl shadow-lg border border-white/20">
            🦸‍♂️
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-wider mt-1.5">Jin-Woo</span>
        </div>

        {/* Speech Bubble Covering Artwork */}
        <div className="absolute top-8 right-5 z-20 bg-white text-slate-950 p-3.5 rounded-2xl rounded-tr-none shadow-2xl max-w-[160px] border-2 border-slate-900">
          <p className="text-xs font-black leading-tight text-center">
            "I will never give up, no matter the cost!"
          </p>
          <div className="absolute -right-2 top-0 w-3.5 h-3.5 bg-white border-r-2 border-t-2 border-slate-900 rotate-45 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
