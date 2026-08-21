import type { ReactNode } from "react";
import { Image as ImageIcon } from "lucide-react";

interface ChapterScraperDeckEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export default function ChapterScraperDeckEmptyState({
  title = "No Imported Panels Yet",
  description = "Paste a Webtoon episode URL above or import images to extract panels into the asset deck.",
  icon,
}: ChapterScraperDeckEmptyStateProps) {
  return (
    <div className="relative w-full flex-1 min-h-[320px] flex flex-col items-center justify-center p-6 sm:p-8 my-auto rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3 select-none">
      <div className="h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
        {icon ?? <ImageIcon className="w-5 h-5" />}
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-xs sm:text-sm font-mono font-bold text-white uppercase tracking-wider">
          {title}
        </h3>
        <p className="text-xs text-neutral-400 font-mono leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
