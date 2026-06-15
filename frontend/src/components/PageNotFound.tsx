import React from "react";
import { Compass, ArrowLeft } from "lucide-react";

interface PageNotFoundProps {
  onNavigateHome: () => void;
}

export default function PageNotFound({ onNavigateHome }: PageNotFoundProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 md:py-24 relative overflow-hidden bg-[#070709]">
      {/* Background decorative glowing orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main glassmorphic card */}
      <div className="relative w-full max-w-xl bg-neutral-950/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 md:p-12 text-center shadow-2xl shadow-purple-950/10 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        {/* Animated Compass Icon */}
        <div className="relative z-10 flex justify-center mb-8">
          <div className="relative p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-inner group">
            {/* Pulsing outer glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <Compass className="h-16 w-16 text-purple-400 animate-float" />
          </div>
        </div>

        {/* 404 Header Text with Gradient */}
        <h1 className="relative z-10 font-sans font-extrabold text-8xl md:text-9xl tracking-tighter bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent select-none filter drop-shadow-[0_0_20px_rgba(168,85,247,0.25)] leading-none mb-4">
          404
        </h1>

        {/* Subtitle & Message */}
        <h2 className="relative z-10 text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">
          Page Not Found
        </h2>

        <p className="relative z-10 text-sm text-neutral-400 max-w-md mx-auto mb-8 font-sans leading-relaxed">
          The route you are trying to reach is not defined in this application.
          It may have been moved, renamed, or vanished into the digital ether.
        </p>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-[1.02] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border border-neutral-800 bg-neutral-900/40 text-neutral-300 font-medium hover:bg-neutral-900 hover:text-white hover:border-neutral-700 transition-all duration-300 cursor-pointer"
          >
            Reload Page
          </button>
        </div>

        {/* Details Footer */}
        <div className="relative z-10 mt-10 pt-6 border-t border-neutral-800/60 flex items-center justify-center gap-2 text-xs text-neutral-500 font-mono">
          <span>Requested:</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-purple-400">
            {window.location.pathname}
          </span>
        </div>
      </div>
    </div>
  );
}
