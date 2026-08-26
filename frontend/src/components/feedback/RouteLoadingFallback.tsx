import React from "react";

interface RouteLoadingFallbackProps {
  status?: string;
}

export default function RouteLoadingFallback({
  status = "Loading...",
}: RouteLoadingFallbackProps) {
  return (
    <>
      {/* Top moving animated progress bar */}
      <div className="route-progress-bar" />

      {/* Sleek top-right floating status badge */}
      <div className="fixed top-3.5 right-6 z-[9999] pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d0e15]/90 border border-purple-500/30 backdrop-blur-md shadow-xl shadow-purple-950/40 animate-fade-in select-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
        </span>
        <span className="text-[11px] font-mono font-bold tracking-wider text-purple-200 uppercase">
          {status}
        </span>
      </div>
    </>
  );
}
