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
    <div className="relative w-full h-[160px] sm:h-[180px] flex-none flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2 select-none">
      <div className="h-9 w-9 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
        {icon ?? <ImageIcon className="w-4.5 h-4.5" />}
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          {title}
        </h3>
        <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
