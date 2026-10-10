import React from "react";
import { AlertCircle } from "lucide-react";

export function BubblesBefore() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 bg-[#0d0e15] relative overflow-hidden">
      <div className="relative w-full max-w-[280px] h-[320px] rounded-2xl overflow-hidden border border-neutral-700/80 shadow-2xl group">
        {/* Real Authentic Manhwa Comic Art with Speech Bubbles */}
        <img
          src="/demo-action-hero.jpg"
          alt="Raw Manhwa panel with speech bubbles"
          className="w-full h-full object-cover object-center"
        />

        {/* Ambient Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Detection Box Overlay on Top Speech Bubble */}
        <div className="absolute top-3 right-3 w-32 h-16 border-2 border-dashed border-rose-500 bg-rose-500/20 rounded-xl flex items-center justify-center animate-pulse pointer-events-none">
          <span className="text-[10px] font-mono font-bold text-rose-300 bg-black/80 px-1.5 py-0.5 rounded border border-rose-500/40">
            Detected Bubble #1
          </span>
        </div>

        {/* Detection Box on SFX text */}
        <div className="absolute top-4 left-4 w-28 h-12 border-2 border-dashed border-amber-500 bg-amber-500/20 rounded-xl flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-mono font-bold text-amber-300 bg-black/80 px-1.5 py-0.5 rounded border border-amber-500/40">
            SFX Sound Text
          </span>
        </div>

        {/* Bottom Tag */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
          <span className="text-[10px] font-mono font-bold text-rose-300 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-rose-500/40 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            2 Bubbles Covering Art
          </span>
          <span className="text-[10px] font-mono font-bold text-white bg-black/80 px-2 py-1 rounded-full border border-white/20">
            Raw Chapter
          </span>
        </div>
      </div>
    </div>
  );
}
