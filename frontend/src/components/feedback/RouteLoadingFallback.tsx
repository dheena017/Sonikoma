import React from "react";
import { Loader2 } from "lucide-react";

interface RouteLoadingFallbackProps {
  status?: string;
}

export default function RouteLoadingFallback({
  status = "Loading Studio...",
}: RouteLoadingFallbackProps) {
  return (
    <div className="w-full flex-1 min-h-[460px] flex flex-col items-center justify-center p-6 animate-fade-in select-none">
      {/* Prominent, Centered Studio Loading Card */}
      <div className="flex flex-col items-center gap-5 px-10 py-8 rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
        {/* Spinner Icon */}
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-[#121212] border border-[#2F2F2F] shadow-inner">
          <Loader2 className="h-7 w-7 text-[#3B82F6] animate-spin" />
        </div>

        {/* Text */}
        <div className="space-y-1 relative z-10">
          <h4 className="text-base font-extrabold text-[#E5E5E5] font-sans tracking-tight">
            {status}
          </h4>
          <p className="text-xs font-mono text-[#9CA3AF]">
            Please wait a moment...
          </p>
        </div>

        {/* Active Moving Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[#121212] border border-[#2F2F2F] overflow-hidden relative z-10 mt-1">
          <div className="h-full bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#00FFFF] rounded-full animate-progress-slider w-full" />
        </div>
      </div>
    </div>
  );
}
