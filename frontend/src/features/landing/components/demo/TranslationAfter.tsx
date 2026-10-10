import React from "react";
import { Languages, Check, Volume2 } from "lucide-react";

export function TranslationAfter() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 bg-[#0d0e15] relative overflow-hidden">
      <div className="relative w-full max-w-[280px] h-[320px] rounded-2xl overflow-hidden border-2 border-blue-400 shadow-2xl shadow-blue-500/20 group">
        {/* Real Inpainted Cyberpunk Art */}
        <img
          src="/demo-cyberpunk-cleaned.jpg"
          alt="Translated and dubbed Cyberpunk comic panel"
          className="w-full h-full object-cover object-center"
        />

        {/* Ambient Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Translated Language Badge */}
        <div className="absolute top-3 left-3 bg-blue-950/80 border border-blue-400/50 backdrop-blur-md px-2.5 py-1 rounded-xl text-blue-300 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg">
          <Languages className="w-3 h-3 text-blue-400" />
          <span>Translated & Dubbed (EN)</span>
        </div>

        {/* Audio Dub Status */}
        <div className="absolute top-3 right-3 bg-emerald-950/80 border border-emerald-400/50 backdrop-blur-md px-2 py-1 rounded-xl text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1 shadow-lg">
          <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>TTS Ready</span>
        </div>

        {/* Dynamic English Subtitle Overlay */}
        <div className="absolute bottom-3 inset-x-3 p-3 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 text-center space-y-0.5 z-10 shadow-2xl">
          <p className="text-white text-xs font-black tracking-wide leading-tight">
            "The city waits... only death is certain."
          </p>
          <div className="flex items-center justify-between text-[9px] font-mono font-bold pt-1 border-t border-white/10 text-neutral-300">
            <span className="text-blue-400 flex items-center gap-1">
              <Check className="w-2.5 h-2.5 text-blue-400" />
              Synced Subtitles
            </span>
            <span className="text-emerald-400">BrianNeural Voice</span>
          </div>
        </div>
      </div>
    </div>
  );
}
