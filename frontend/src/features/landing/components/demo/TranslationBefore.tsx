import React from "react";
import { Globe } from "lucide-react";

export function TranslationBefore() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 bg-[#0d0e15] relative overflow-hidden">
      <div className="relative w-full max-w-[280px] h-[320px] rounded-2xl overflow-hidden border border-neutral-700/80 shadow-2xl group">
        {/* Real Sci-Fi Cyberpunk Comic Panel with Korean text & dialogue */}
        <img
          src="/demo-cyberpunk.jpg"
          alt="Raw Korean Cyberpunk comic panel"
          className="w-full h-full object-cover object-center"
        />

        {/* Ambient Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Raw Language Badge */}
        <div className="absolute top-3 left-3 bg-rose-950/80 border border-rose-500/40 backdrop-blur-md px-2.5 py-1 rounded-xl text-rose-300 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg">
          <Globe className="w-3 h-3 text-rose-400" />
          <span>Korean OCR (한국어)</span>
        </div>

        {/* Highlight on Korean text */}
        <div className="absolute top-4 right-4 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
          SFX: 쏴아아...
        </div>

        {/* Bottom Tag */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
          <span className="text-[10px] font-mono font-bold text-rose-300 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-rose-500/40">
            Raw Untranslated Source
          </span>
          <span className="text-[10px] font-mono font-bold text-white bg-black/80 px-2 py-1 rounded-full border border-white/20">
            Chapter 14
          </span>
        </div>
      </div>
    </div>
  );
}
