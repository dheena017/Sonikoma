import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Image as ImageIcon,
  Star,
  ThumbsUp,
  Clock,
  Bookmark,
  BookmarkCheck,
  MoreVertical,
  Download,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Eye,
  Flame,
} from "lucide-react";

import type { Episode as BaseEpisode } from "./EpisodeTypes";
import { getProxiedImageUrl, getSourceName } from "@/utils/url";

type EpisodeCardEpisode = BaseEpisode & {
  duration?: string;
  progress?: number;
  isNew?: boolean;
  index?: number;
};

interface EpisodeCardProps {
  episode: EpisodeCardEpisode;
  onClick: (episode: EpisodeCardEpisode) => void;
  onPreviewClick?: (episode: EpisodeCardEpisode) => void;
  onBookmark?: (episodeUrl: string) => void;
  onMarkReadToggle?: (episodeUrl: string) => void;
  isBookmarked?: boolean;
  isRead?: boolean;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (episodeUrl: string) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  onClick,
  onPreviewClick,
  onBookmark,
  onMarkReadToggle,
  isBookmarked = false,
  isRead = false,
  isMultiSelectMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) onBookmark(episode.url);
  };

  const handleCardClick = () => {
    if (isMultiSelectMode && onToggleSelect) {
      onToggleSelect(episode.url);
    } else {
      onClick(episode);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(episode.url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setIsMenuOpen(false);
    }, 1500);
  };

  const handleExportSingleJSON = (e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonContent = JSON.stringify(episode, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `episode_${episode.number.replace(/\s+/g, "_")}_metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const getPlatformColor = (url: string) => {
    const name = getSourceName(url).toLowerCase();
    if (name.includes("webtoon") || name.includes("naver")) return "bg-emerald-500 shadow-emerald-500/35";
    if (name.includes("kakao") || name.includes("tapas")) return "bg-amber-500 shadow-amber-500/35";
    if (name.includes("lezhin")) return "bg-rose-500 shadow-rose-500/35";
    return "bg-purple-500 shadow-purple-500/35";
  };

  const renderRatingStars = (rating: number) => {
    const isScale10 = rating > 5.0;
    const maxVal = isScale10 ? 10 : 5;
    const scaledRating = isScale10 ? rating / 2 : rating;

    return (
      <div className="flex items-center gap-0.5" title={`Rating: ${rating.toFixed(1)}/${maxVal}`}>
        {Array(5)
          .fill(0)
          .map((_, i) => {
            const isFilled = i < Math.round(scaledRating);
            return (
              <Star
                key={i}
                size={11}
                className={`transition-all duration-350 ${
                  isFilled
                    ? "fill-amber-400 text-amber-450 drop-shadow-[0_0_3px_rgba(245,158,11,0.6)]"
                    : "text-neutral-600"
                }`}
              />
            );
          })}
      </div>
    );
  };

  const renderTitle = () => {
    const num = (episode.number || "").trim();
    const title = (episode.title || "").trim();

    if (!title) {
      return (
        <h3 className="text-[13px] font-bold text-white line-clamp-2 leading-tight flex-1">
          {num}
        </h3>
      );
    }

    if (!num) {
      return (
        <h3 className="text-[13px] font-bold text-white line-clamp-2 leading-tight flex-1">
          {title}
        </h3>
      );
    }

    const cleanNum = num.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (cleanNum === cleanTitle) {
      return (
        <h3 className="text-[13px] font-bold text-white line-clamp-2 leading-tight flex-1" title={title}>
          {title}
        </h3>
      );
    }

    if (cleanTitle.startsWith(cleanNum)) {
      const remainingTitle = title.substring(num.length).replace(/^[-_:\s•·/\\|]+/, "").trim();
      if (!remainingTitle) {
        return (
          <h3 className="text-[13px] font-bold text-white line-clamp-2 leading-tight flex-1" title={title}>
            {title}
          </h3>
        );
      }
      return (
        <h3 className="text-[13px] font-bold text-white line-clamp-2 leading-tight flex-1" title={title}>
          <span className="text-blue-400 font-extrabold mr-1.5">{num}</span>
          <span className="text-neutral-100">{remainingTitle}</span>
        </h3>
      );
    }

    return (
      <h3 className="text-[13px] font-bold text-white line-clamp-2 leading-tight flex-1" title={`${num}: ${title}`}>
        <span className="text-blue-400 font-extrabold mr-1.5">{num}</span>
        <span className="text-neutral-100">{title}</span>
      </h3>
    );
  };

  const isPopular = episode.rating && episode.rating >= 4.0;

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-[280px] flex-shrink-0 snap-start group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 bg-neutral-900/50 backdrop-blur-md border ${
        isSelected
          ? "border-purple-500 ring-2 ring-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.25)] bg-neutral-900"
          : "border-neutral-850 hover:border-purple-500/40 shadow-lg hover:shadow-2xl hover:shadow-purple-950/10"
      }`}
    >
      <div className="relative w-full bg-neutral-950 aspect-video overflow-hidden border-b border-neutral-900/50">
        {isMultiSelectMode && (
          <div className="absolute top-2.5 left-2.5 z-10" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(episode.url)}
              className="w-4.5 h-4.5 rounded border-neutral-700 text-purple-650 focus:ring-purple-500 focus:ring-offset-neutral-900 bg-neutral-950 cursor-pointer accent-purple-650 transition-transform duration-200 hover:scale-105"
            />
          </div>
        )}

        {episode.thumbnail ? (
          <img
            src={getProxiedImageUrl(episode.thumbnail)}
            alt={episode.title}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
              isHovered ? "scale-105" : "scale-100"
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23171717' width='100' height='100'/%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-900">
            <ImageIcon className="w-8 h-8 text-neutral-500" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/10 to-transparent pointer-events-none" />

        {!isMultiSelectMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/0 group-hover:bg-neutral-950/75 backdrop-blur-[1px] transition-all duration-300">
            <div
              className={`transform transition-all duration-300 ${
                isHovered ? "scale-100 opacity-100" : "scale-85 opacity-0"
              } flex flex-col gap-2.5 items-center w-full px-4`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(episode);
                }}
                className="w-3/4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(147,51,234,0.3)] transition-all duration-200 active:scale-95 text-[11px] uppercase tracking-wide"
              >
                <Download size={13} />
                Import Images
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewClick?.(episode);
                }}
                className="w-3/4 bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-750 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all duration-200 active:scale-95 text-[11px] uppercase tracking-wide"
              >
                <Eye size={13} />
                Quick Preview
              </button>
            </div>
          </div>
        )}

        <div
          className={`absolute top-2.5 ${isMultiSelectMode ? "left-9" : "left-2.5"} flex flex-col gap-1.5 transition-all duration-250 z-10`}
        >
          {episode.isNew && (
            <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md w-fit border border-rose-400/20">
              New
            </span>
          )}
          {isRead && (
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-0.5 w-fit border border-emerald-400/20">
              <CheckCircle2 size={10} className="fill-current" /> Read
            </span>
          )}
          {isPopular && (
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-0.5 w-fit border border-orange-400/20">
              <Flame size={10} className="fill-current text-white animate-pulse" /> Popular
            </span>
          )}
          {episode.rating && (
            <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-md border border-white/10">
              {renderRatingStars(episode.rating)}
              <span className="text-[11px] font-extrabold text-amber-200">{episode.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
          <button
            onClick={handleBookmarkClick}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-250 border ${
              isBookmarked
                ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 opacity-100 shadow-lg shadow-yellow-500/25 border-yellow-300 scale-105"
                : "bg-neutral-950/60 text-neutral-300 hover:bg-white hover:text-neutral-950 opacity-0 group-hover:opacity-100 border-white/5"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Episode"}
          >
            {isBookmarked ? <BookmarkCheck size={13} className="fill-current" /> : <Bookmark size={13} />}
          </button>

          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-full backdrop-blur-md transition-all duration-250 border bg-neutral-950/60 text-neutral-300 hover:bg-white hover:text-neutral-950 opacity-0 group-hover:opacity-100 border-white/5 active:scale-90"
            title="Copy Episode Link"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>

        {episode.duration && (
          <div className="absolute bottom-2.5 right-2.5 bg-neutral-950/85 backdrop-blur-xs text-neutral-250 text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/5 flex items-center gap-1">
            <Clock size={11} className="text-neutral-455" />
            {episode.duration}
          </div>
        )}

        {episode.progress !== undefined && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
              style={{ width: `${Math.min(100, Math.max(0, episode.progress))}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-4 space-y-2.5 relative">
        <div className="flex justify-between items-start gap-2.5">
          {renderTitle()}
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {episode.index !== undefined && (
              <span className="text-[10px] font-extrabold text-neutral-500 font-mono select-none" title={`Episode Index: ${episode.index}`}>
                #{episode.index}
              </span>
            )}
            <button
              className="text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all p-1.5 rounded-lg active:scale-90"
              onClick={handleMenuToggle}
              title="More Actions"
            >
              <MoreVertical size={15} />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-4 bottom-12 w-52 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-neutral-200"
          >
            <div className="py-1.5 px-1 space-y-0.5">
              <button
                onClick={(e) => {
                  handleBookmarkClick(e);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2.5 transition-all"
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck size={14} className="text-yellow-500 fill-current" />
                    <span>Remove Bookmark</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={14} className="text-neutral-400" />
                    <span>Bookmark Episode</span>
                  </>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMarkReadToggle) onMarkReadToggle(episode.url);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2.5 transition-all"
              >
                {isRead ? (
                  <>
                    <XCircle size={14} className="text-rose-400" />
                    <span>Mark as Unread</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-450" />
                    <span>Mark as Read</span>
                  </>
                )}
              </button>

              <div className="h-px bg-neutral-800 my-1 mx-2" />

              <button
                onClick={handleCopyLink}
                className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2.5 transition-all font-medium"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-450" />
                    <span>Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="text-neutral-400" />
                    <span>Copy Episode Link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportSingleJSON}
                className="w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2.5 transition-all"
              >
                <Download size={14} className="text-neutral-400" />
                <span>Export Metadata (JSON)</span>
              </button>
            </div>
          </div>
        )}

        {/* Source Platform Badge */}
        {episode.url && (
          <div className="pt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold tracking-widest text-purple-400 bg-purple-950/30 border border-purple-500/15 px-2 py-0.5 rounded-md">
              <span className={`w-1.5 h-1.5 rounded-full ${getPlatformColor(episode.url)} shadow-sm animate-pulse`} />
              {getSourceName(episode.url).toUpperCase()}
            </span>
          </div>
        )}

        {/* Footer Meta Row */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/50 mt-1">
          {episode.date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span className="font-medium text-neutral-400">{episode.date}</span>
            </div>
          )}

          {episode.likes && (
            <div className="flex items-center gap-1.5">
              <ThumbsUp size={12} className="text-indigo-400 fill-indigo-400/10" />
              <span className="font-bold text-neutral-300">{episode.likes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
