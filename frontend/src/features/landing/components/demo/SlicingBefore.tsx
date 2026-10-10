import React from "react";

export function SlicingBefore() {
  return (
    <div className="w-full h-full bg-[#0d0e15] p-3 sm:p-4 flex flex-col items-center justify-start gap-3 overflow-y-auto custom-scrollbar">
      <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 self-start shrink-0">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Raw Vertical Webtoon Strip (Continuous Scroll)
      </div>

      {/* Comic Panel 1 in strip */}
      <div className="w-full max-w-[280px] h-36 rounded-xl border border-neutral-700/60 overflow-hidden relative shadow-md shrink-0 group">
        <img
          src="/motion-scroll-dungeon.jpg"
          alt="Raw continuous webtoon strip - panel 1"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-neutral-300">
          Unsegmented Strip • Frame A
        </div>
      </div>

      {/* Strip Gutter */}
      <div className="w-16 h-1 bg-neutral-800 rounded-full shrink-0" />

      {/* Comic Panel 2 in strip */}
      <div className="w-full max-w-[280px] h-36 rounded-xl border border-neutral-700/60 overflow-hidden relative shadow-md shrink-0 group">
        <img
          src="/motion-scroll-dungeon.jpg"
          alt="Raw continuous webtoon strip - panel 2"
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-neutral-300">
          Unsegmented Strip • Frame B
        </div>
      </div>
    </div>
  );
}
