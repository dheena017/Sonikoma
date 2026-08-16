import React, { useState } from "react";
import { ArrowRight, BookOpen, X, Clock, Eye, Star } from "lucide-react";
import { getProxiedImageUrl } from "@/shared/utils/url";
import type { FavoriteSeries } from "../utils/FavoritesManager";
import { FavoritesManager } from "../utils/FavoritesManager";

interface RecentSeriesCardProps {
  series: FavoriteSeries;
  onSelect: (series: FavoriteSeries) => void;
  onRemove?: (titleNo: string) => void;
}

export const RecentSeriesCard: React.FC<RecentSeriesCardProps> = ({
  series,
  onSelect,
  onRemove,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(series);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      const titleNoStr = String(series.title_no);
      onRemove(titleNoStr);
      FavoritesManager.removeRecent(titleNoStr);
    }
  };

  const getTimeAgo = (timestamp: string | number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      onClick={() => onSelect(series)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Open episodes for ${series.title || "untitled series"}`}
      className="group relative min-h-[160px] bg-gradient-to-br from-neutral-900/60 to-neutral-950/40 hover:from-purple-950/30 hover:to-neutral-950/60 border border-neutral-800/60 hover:border-purple-500/50 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20 flex flex-col justify-between overflow-hidden"
    >
      {/* Remove Button */}
      {isHovered && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 z-10 transition-all"
          title="Remove from recent"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Cover Image */}
      <div className="flex items-start gap-3 mb-2">
        {series.cover_image ? (
          <img
            src={getProxiedImageUrl(series.cover_image, series.url)}
            alt={series.title}
            className="w-16 h-20 object-cover rounded-lg border border-neutral-700/60 flex-shrink-0 group-hover:scale-105 transition-transform shadow-md"
          />
        ) : (
          <div className="w-16 h-20 bg-gradient-to-br from-purple-900/40 to-purple-950/60 border border-purple-700/40 rounded-lg flex items-center justify-center text-purple-400 flex-shrink-0 shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
        )}

        {/* Genre Badge */}
        {series.genre && (
          <div className="flex-grow min-w-0 flex items-start">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono whitespace-nowrap">
              {series.genre.split("/")[0]}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-tight mb-2">
        {series.title || "Untitled Series"}
      </h4>

      {/* Metadata */}
      <div className="space-y-1.5 mb-3 text-[10px] text-neutral-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Opened {getTimeAgo(series.timestamp)}</span>
        </div>
        {series.episode_count && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 text-yellow-400" />
            <span>{series.episode_count} episodes</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-purple-400 group-hover:text-purple-300 transition-colors pt-2 border-t border-neutral-800/40">
        <span>Open Episodes</span>
        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
};
