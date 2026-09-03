import React from "react";

export function TranslationBefore() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-[#0d0e15] relative overflow-hidden">
      <div className="w-72 h-72 rounded-2xl bg-gradient-to-br from-rose-950 via-slate-900 to-[#2A2A2A] border border-neutral-700/80 p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.25),transparent_60%)]" />

        <div className="relative z-10">
          <span className="text-[10px] font-mono font-bold text-rose-400 bg-black/50 px-2 py-0.5 rounded border border-rose-500/30">
            RAW KOREAN (한국어)
          </span>
        </div>

        {/* Character Visual */}
        <div className="absolute bottom-4 left-6 z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-blue-500 flex items-center justify-center text-2xl shadow-lg border border-white/20">
            🥷
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-wider mt-1.5">Cha Hae-In</span>
        </div>

        {/* Korean Speech Bubble */}
        <div className="absolute top-8 right-5 z-20 bg-white text-slate-950 p-3.5 rounded-2xl rounded-tr-none shadow-2xl max-w-[160px] border-2 border-slate-900">
          <p className="text-sm font-black leading-snug text-center">
            "이 세계를 반드시 지키겠어!"
          </p>
          <span className="text-[9px] text-slate-500 block text-center mt-0.5 font-mono">
            (Raw Manhwa Bubble)
          </span>
          <div className="absolute -right-2 top-0 w-3.5 h-3.5 bg-white border-r-2 border-t-2 border-slate-900 rotate-45 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
