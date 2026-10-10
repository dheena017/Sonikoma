import React from "react";
import { Sparkles, Check } from "lucide-react";

export function BubblesAfter() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 bg-[#0d0e15] relative overflow-hidden">
      <div className="relative w-full max-w-[280px] h-[320px] rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-2xl shadow-emerald-500/20 group">
        {/* Real Inpainted Clean Manhwa Art */}
        <img
          src="/demo-action-cleaned.jpg"
          alt="Inpaint cleaned Manhwa panel with background restored"
          className="w-full h-full object-cover object-center"
        />

        {/* Ambient Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Shimmer Highlight on Restored Region */}
        <div className="absolute top-4 right-4 bg-emerald-950/80 border border-emerald-400/50 backdrop-blur-md px-2.5 py-1 rounded-xl text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Texture Restored</span>
        </div>

        {/* Bottom Tag */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
          <span className="text-[10px] font-mono font-bold text-emerald-300 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1.5">
            <Check className="w-3 h-3 text-emerald-400" />
            100% Inpainted Clean
          </span>
          <span className="text-[10px] font-mono font-bold text-white bg-black/80 px-2 py-1 rounded-full border border-white/20">
            Pristine Art
          </span>
        </div>
      </div>
    </div>
  );
}
