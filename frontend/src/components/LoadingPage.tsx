import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface LoadingPageProps {
  status?: string;
  progress?: number;
}

const LOADING_TIPS = [
  "Anivox uses advanced variance-based CV row scanning to isolate webtoon panels.",
  "Adjust the sensitivity slider in edit mode if panels have thin borders or extra spacing.",
  "Zoom and pan camera paths can be customized to follow action panels dynamically.",
  "You can translate comic scripts into multiple languages using Gemini AI in the storyboard.",
  "Multi-character dialogue tracks are auto-generated and aligned with voiceover speech rate.",
  "Connecting to GPU-accelerated video compilation modules...",
  "Rendering keyframes, layering audio mixers, and synthesizing voice tracks...",
];

export default function LoadingPage({
  status = "Connecting to Computational Engine...",
  progress,
}: LoadingPageProps) {
  const [simulatedProgress, setSimulatedProgress] = React.useState(10);
  const [activeTipIdx, setActiveTipIdx] = React.useState(0);

  // Auto-increment progress slowly if parent doesn't provide a real progress value
  React.useEffect(() => {
    if (progress !== undefined) return;
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + 1;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [progress]);

  // Cycle through loading tips
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveTipIdx((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const displayProgress = progress !== undefined ? progress : simulatedProgress;

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center space-y-6 relative overflow-hidden text-white font-sans">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      {/* Main glassmorphic card */}
      <div className="w-full max-w-md p-8 bg-[#0f0f13]/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl flex flex-col items-center space-y-6 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-600/20 blur-[30px] rounded-full animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white uppercase bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent font-sans">
            Anivox Studio
          </h2>
          <p className="text-purple-400 text-xs font-mono tracking-wider uppercase animate-pulse">
            {status}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
              Processing...
            </span>
            <span>{Math.round(displayProgress)}%</span>
          </div>
        </div>

        {/* Tips Box */}
        <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-left min-h-[90px] flex flex-col justify-center">
          <span className="text-[9px] font-bold tracking-wider uppercase text-purple-400 block mb-1">
            💡 Creator Tip
          </span>
          <p className="text-neutral-300 text-xs leading-relaxed font-medium transition-all duration-500">
            {LOADING_TIPS[activeTipIdx]}
          </p>
        </div>
      </div>

      <div className="absolute bottom-6">
        <p className="text-neutral-600 text-[10px] uppercase font-black tracking-[0.25em]">
          Built for the future of webcomics
        </p>
      </div>
    </div>
  );
}
