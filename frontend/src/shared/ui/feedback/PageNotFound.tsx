import React from"react";
import { Compass, ArrowLeft } from"lucide-react";

interface PageNotFoundProps {
  onNavigateHome: () => void;
  customTitle?: string;
  customMessage?: string;
}

export default function PageNotFound({
  onNavigateHome,
  customTitle,
  customMessage,
}: PageNotFoundProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 md:py-24 relative overflow-hidden bg-transparent">

      {/* Main glassmorphic card */}
      <div className="relative w-full max-w-xl bg-neutral-950/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-8 md:p-12 text-center shadow-2xl shadow-black/50 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        {/* Animated Compass Icon */}
        <div className="relative z-10 flex justify-center mb-8">
          <div className="relative p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 shadow-inner group">
            <Compass className="h-16 w-16 text-[#3B82F6] animate-float" />
          </div>
        </div>

        {/* 404 Header Text with Gradient */}
        <h1 className="relative z-10 font-sans font-extrabold text-8xl md:text-9xl tracking-tighter bg-gradient-to-r from-blue-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent select-none leading-none mb-4">
          404
        </h1>

        {/* Subtitle & Message */}
        <h2 className="relative z-10 text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">
          Page Not Found
        </h2>

        <p className="relative z-10 text-sm text-neutral-300 max-w-md mx-auto mb-8 font-sans leading-relaxed">
          The route you are trying to reach is not defined in this application.
          It may have been moved, renamed, or vanished into the digital ether.
        </p>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all duration-300 shadow-lg hover:scale-[1.02] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-200 font-medium hover:bg-neutral-800 hover:text-white hover:border-neutral-700 transition-all duration-300 cursor-pointer"
          >
            Reload Page
          </button>
        </div>

        {/* Details Footer */}
        <div className="relative z-10 mt-10 pt-6 border-t border-neutral-800/60 flex items-center justify-center gap-2 text-xs text-neutral-500 font-mono">
          <span>Requested:</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[#3B82F6]">
            {window.location.pathname}
          </span>
        </div>
      </div>
    </div>
  );
}
