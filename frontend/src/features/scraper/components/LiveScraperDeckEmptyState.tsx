import type { ReactNode } from "react";
import { Image as ImageIcon, Zap, Sparkles } from "lucide-react";

interface LiveScraperDeckEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

/**
 * State-of-the-art Empty State for LiveScraperDeck displayed when no Webtoon images are imported.
 * Designed with clean dark glassmorphism layout, gradient icon badge, and feature pills.
 */
export default function LiveScraperDeckEmptyState({
  title = "No Imported Panels Yet",
  description = "Paste a Webtoon episode URL in the input above to extract high-resolution panels into the live scraper deck.",
  icon,
}: LiveScraperDeckEmptyStateProps) {
  return (
    <div className="relative w-full flex flex-col items-center justify-center p-8 sm:p-12 my-2 rounded-2xl bg-neutral-950/80 border border-neutral-850 shadow-2xl backdrop-blur-xl text-center space-y-5 animate-in fade-in duration-300">
      {/* Animated Hero Icon Badge */}
      <div className="relative flex items-center justify-center">
        <div className="relative p-0.5 rounded-2xl bg-gradient-to-br from-purple-500/80 via-cyan-500/80 to-purple-600/80 shadow-lg">
          <div className="w-14 h-14 rounded-[14px] bg-neutral-950 flex items-center justify-center text-purple-400">
            {icon ?? <ImageIcon className="w-6 h-6 text-purple-400" />}
          </div>
        </div>
      </div>

      {/* Header & Description */}
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-sm font-mono font-bold text-neutral-100 uppercase tracking-wider">
          {title}
        </h3>
        <p className="text-xs text-neutral-400 font-sans leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {/* Feature Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] font-mono text-neutral-400">
        <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-purple-400" />
          <span>Auto-Stitcher</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>AI Bubble Cleaner</span>
        </span>
      </div>
    </div>
  );
}
