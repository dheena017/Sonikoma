import React from "react";

export function TranslationAfter() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 relative overflow-hidden">
      <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-rose-900 via-purple-900 to-black border border-white/10 flex items-center justify-center relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-neutral-800 rounded-tr-[50px] border border-white/5" />
        <div className="absolute bottom-32 left-10 w-16 h-16 rounded-full bg-neutral-700" />

        {/* Translated speech bubble */}
        <div className="absolute top-10 right-6 bg-white text-black p-4 rounded-[20px] rounded-tl-none shadow-2xl max-w-[150px] border-2 border-black">
          <span className="text-sm font-bold text-center block">Amazing!</span>
          <span className="text-xs text-gray-600 block">This is awesome</span>
          <div className="absolute -left-2 top-0 w-4 h-4 bg-white border-l-2 border-t-2 border-black rotate-45 pointer-events-none" />
        </div>

        <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-400 text-[8px] font-mono font-bold">
          Typeset Auto-Translated (EN)
        </div>
      </div>
    </div>
  );
}
