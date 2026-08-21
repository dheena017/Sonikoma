import React from "react";
import { Loader2 } from "lucide-react";

interface ImportImagesOverlayProps {
  message?: string;
  count?: number;
}

export function ImportImagesOverlay({
  message = "Extracting frames from source...",
}: ImportImagesOverlayProps) {
  return (
    <div className="relative w-full flex-1 min-h-[320px] flex flex-col items-center justify-center p-6 sm:p-8 my-auto rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3 select-none">
      <div className="h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-xs sm:text-sm font-mono font-bold text-white uppercase tracking-wider">
          {message}
        </h3>
        <p className="text-xs text-neutral-400 font-mono leading-relaxed">
          Resolving high-resolution Webtoon frames and parsing panel structure...
        </p>
      </div>

      <div className="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden mt-2">
        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-1/3 animate-[lp-shimmer_1.5s_infinite_ease-in-out]" />
      </div>
    </div>
  );
}
