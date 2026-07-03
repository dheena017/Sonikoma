import React from "react";

export function SlicingBefore() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 space-y-6 bg-neutral-950 overflow-y-auto scrollbar-thin">
      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2 border-b border-white/5 w-full pb-2 text-center">
        Raw Vertical Strip Layout
      </div>
      <div className="w-48 h-32 rounded-xl bg-gradient-to-br from-indigo-950 to-blue-900 flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2),transparent_70%)]" />
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 animate-pulse" />
      </div>
      <div className="w-48 h-40 rounded-xl bg-gradient-to-br from-purple-950 to-indigo-900 flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),transparent_70%)]" />
        <div className="w-12 h-24 bg-white/5 rounded-lg border border-white/10" />
      </div>
      <div className="w-48 h-36 rounded-xl bg-gradient-to-br from-emerald-950 to-teal-900 flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.2),transparent_70%)]" />
        <div className="w-20 h-10 bg-white/5 rounded border border-white/10" />
      </div>
    </div>
  );
}
