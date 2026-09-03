import React from "react";
import { Languages, Check } from "lucide-react";

export function TranslationAfter() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-[#0d0e15] relative overflow-hidden">
      <div className="w-72 h-72 rounded-2xl bg-gradient-to-br from-rose-950 via-slate-900 to-purple-950 border-2 border-[#60A5FA] p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-purple-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_60%)]" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-[#3B82F6] bg-black/50 px-2 py-0.5 rounded border border-[#3B82F6]/30 flex items-center gap-1">
            <Languages className="w-3 h-3" />
            TRANSLATED (EN)
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-500 text-white text-[9px] font-mono font-extrabold flex items-center gap-1">
            <Check className="w-2.5 h-2.5" />
            Auto Typeset
          </span>
        </div>

        {/* Character Visual */}
        <div className="absolute bottom-4 left-6 z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-blue-500 flex items-center justify-center text-2xl shadow-lg border border-white/20">
            🥷
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-wider mt-1.5">Cha Hae-In</span>
        </div>

        {/* Translated English Speech Bubble */}
        <div className="absolute top-8 right-5 z-20 bg-white text-slate-950 p-3.5 rounded-2xl rounded-tr-none shadow-2xl max-w-[160px] border-2 border-purple-600 animate-fade-in">
          <p className="text-xs font-black leading-snug text-center text-purple-950">
            "I will definitely protect this world!"
          </p>
          <span className="text-[9px] text-purple-600 font-bold block text-center mt-0.5 font-mono">
            ★ English Dub Ready
          </span>
          <div className="absolute -right-2 top-0 w-3.5 h-3.5 bg-white border-r-2 border-t-2 border-purple-600 rotate-45 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
