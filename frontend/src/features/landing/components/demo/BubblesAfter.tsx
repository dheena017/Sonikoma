import React from "react";

export function BubblesAfter() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 relative overflow-hidden">
      {/* Comic Illustration - Clean inpainted */}
      <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-black border border-white/10 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-orange-400/80 blur-md animate-pulse" />
        <div className="absolute bottom-0 right-0 w-32 h-44 bg-neutral-800 rounded-t-[50px] border border-white/5" />
        <div className="absolute bottom-36 right-8 w-16 h-16 rounded-full bg-neutral-700" />
        {/* Clean area where bubble was */}
        <div className="absolute top-8 right-6 w-16 h-16 bg-purple-700/10 blur-xl rounded-full" />
        <div className="absolute top-4 right-10 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-400 text-[8px] font-mono font-bold">
          Speech Bubble Cleared
        </div>
      </div>
    </div>
  );
}
