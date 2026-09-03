import React, { useState } from "react";
import { ArrowRight, BookOpen, X, Clock, Star } from "lucide-react";
import { getProxiedImageUrl } from "@/shared/utils/imageProxy";
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
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(() =>
    getProxiedImageUrl(series.cover_image, series.url)
  );

  React.useEffect(() => {
    setImageError(false);
    setImgSrc(getProxiedImageUrl(series.cover_image, series.url));
  }, [series.cover_image, series.url]);

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
      aria-label={`Open chapters for ${series.title || "untitled series"}`}
      className="group relative min-h-[160px] bg-gradient-to-br from-neutral-900/60 to-neutral-950/40 hover:from-[#2A2A2A] hover:to-neutral-950/60 border border-neutral-800/60 hover:border-[#3B82F6]/50 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/50 flex flex-col justify-between overflow-hidden"
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
        {imgSrc && !imageError ? (
          <img
            src={imgSrc}
            alt={series.title}
            className="w-16 h-20 object-cover rounded-lg border border-neutral-700/60 flex-shrink-0 group-hover:scale-105 transition-transform shadow-md"
            onError={() => {
              if (imgSrc.includes("/api/proxy-image") && series.cover_image) {
                setImgSrc(series.cover_image);
              } else {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div className="w-16 h-20 bg-gradient-to-br from-[#2A2A2A] to-[#2A2A2A] border border-[#2F2F2F] rounded-lg flex items-center justify-center text-[#3B82F6] flex-shrink-0 shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
        )}

        {/* Genre Badge */}
        {series.genre && (
          <div className="flex-grow min-w-0 flex items-start">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30 font-mono whitespace-nowrap">
              {series.genre.split("/")[0]}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-white group-hover:text-[#93C5FD] transition-colors line-clamp-2 leading-tight mb-2">
        {series.title || "Untitled Series"}
      </h4>

      {/* Metadata */}
      <div className="space-y-1.5 mb-3 text-[10px] text-neutral-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>Opened {getTimeAgo(series.timestamp)}</span>
        </div>
        {(series.chapter_count || series.episode_count) && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 text-yellow-400" />
            <span>{series.chapter_count || series.episode_count} chapters</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#3B82F6] group-hover:text-[#93C5FD] transition-colors pt-2 border-t border-neutral-800/40">
        <span>Open Chapters</span>
        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
};
