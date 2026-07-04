import type { ReactNode } from "react";
import { Image as ImageIcon } from "lucide-react";

interface LiveScraperDeckEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export default function LiveScraperDeckEmptyState({
  title = "No imported images yet",
  description = "Run the scraper or paste a supported webtoon URL to import frames into the Live Scraper Deck.",
  icon,
}: LiveScraperDeckEmptyStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/70 py-12 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
        {icon ?? <ImageIcon className="h-6 w-6" />}
      </div>
      <div className="space-y-2 max-w-xs">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-neutral-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
