import React from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { getProxiedImageUrl } from "@/shared/utils/url";
import type { FavoriteSeries } from "../utils/FavoritesManager";

interface RecentSeriesCardProps {
  series: FavoriteSeries;
  onSelect: (series: FavoriteSeries) => void;
}

export const RecentSeriesCard: React.FC<RecentSeriesCardProps> = ({ series, onSelect }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(series);
    }
  };

  return (
    <div
      onClick={() => onSelect(series)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open episodes for ${series.title || "untitled series"}`}
      className="group min-h-[132px] bg-neutral-955 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/20 flex items-center gap-4"
    >
      {series.cover_image ? (
        <img
          src={getProxiedImageUrl(series.cover_image, series.url)}
          alt={series.title}
          className="w-20 h-24 object-cover rounded-xl border border-neutral-800 flex-shrink-0 group-hover:scale-105 transition-transform"
        />
      ) : (
        <div className="w-20 h-24 bg-purple-950/20 border border-purple-800/30 rounded-xl flex items-center justify-center text-purple-400 flex-shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
      )}

      <div className="flex-grow min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          {series.genre && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-mono">
              {series.genre}
            </span>
          )}
          <span className="text-[10px] text-neutral-600 font-mono">#{series.title_no}</span>
        </div>
        <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
          {series.title || "Untitled Series"}
        </h4>
        <span className="block text-[10px] text-neutral-600 font-mono">
          Opened {new Date(series.timestamp).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-purple-400">
          <span>Open Episodes List</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};
