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
  ArrowUpRight,
  Sparkles,
  Zap,
} from "lucide-react";

import type { Episode as BaseEpisode } from "@/features/workspace_scraper/components/EpisodeTypes";
import { getProxiedImageUrl, getSourceName } from "@/shared/utils/url";

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
    const safeEp = (episode.number || 'ep').replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
    link.download = `Episode_${safeEp}_metadata.json`;
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

  const renderRatingStars = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined || isNaN(rating)) return null;
    const isScale10 = rating > 5.0;
    const maxVal = isScale10 ? 10 : 5;
    const scaledRating = isScale10 ? rating / 2 : rating;

    return (
      <div className="flex items-center gap-0.5" title={`Rating: ${Number(rating).toFixed(1)}/${maxVal}`}>
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
                    : "text-neutral-700"
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

    if (!title || title.toLowerCase() === num.toLowerCase()) {
      return (
        <h3 className="text-sm font-bold text-white line-clamp-1 leading-tight flex-1" title={num || title}>
          <span className="text-purple-400 font-extrabold font-mono">{num || title}</span>
        </h3>
      );
    }

    if (!num) {
      return (
        <h3 className="text-sm font-bold text-white line-clamp-1 leading-tight flex-1" title={title}>
          <span className="text-neutral-100">{title}</span>
        </h3>
      );
    }

    const cleanNum = num.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (cleanNum === cleanTitle) {
      return (
        <h3 className="text-sm font-bold text-white line-clamp-1 leading-tight flex-1" title={title}>
          <span className="text-purple-400 font-extrabold font-mono">{title}</span>
        </h3>
      );
    }

    if (cleanTitle.startsWith(cleanNum)) {
      const remainder = title.slice(num.length).replace(/^[-_:\s•·/\\|]+/, "").trim();
      return (
        <h3 className="text-sm font-bold text-white line-clamp-1 leading-tight flex-1" title={title}>
          <span className="text-purple-400 font-extrabold font-mono mr-1.5">{num}</span>
          {remainder && <span className="text-neutral-100">{remainder}</span>}
        </h3>
      );
    }

    return (
      <h3 className="text-sm font-bold text-white line-clamp-1 leading-tight flex-1" title={`${num}: ${title}`}>
        <span className="text-purple-400 font-extrabold mr-1.5 font-mono">{num}</span>
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
      className={`w-full flex flex-col group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 bg-[#0d0d12] border ${
        isSelected
          ? "border-purple-500 ring-2 ring-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-neutral-900"
          : "border-neutral-800/80 hover:border-purple-500/50 shadow-xl hover:shadow-2xl hover:shadow-purple-950/20"
      }`}
    >
      {/* Top Banner / Image Area */}
      <div className="relative w-full bg-neutral-950 aspect-[16/9] overflow-hidden border-b border-neutral-850">
        {isMultiSelectMode && (
          <div className="absolute top-3 left-3 z-20" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(episode.url)}
              className="w-5 h-5 rounded-md border-neutral-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-neutral-900 bg-neutral-950 cursor-pointer accent-purple-600 transition-transform duration-200 hover:scale-105 shadow-md"
            />
          </div>
        )}

        {episode.thumbnail ? (
          <img
            src={getProxiedImageUrl(episode.thumbnail, episode.url)}
            alt={episode.title}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
              isHovered ? "scale-105 brightness-105" : "scale-100"
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23171717' width='100' height='100'/%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-900 to-neutral-950">
            <ImageIcon className="w-10 h-10 text-neutral-700" />
            <span className="text-[10px] text-neutral-600 font-mono">No Image</span>
          </div>
        )}

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/30 to-transparent pointer-events-none" />

        {/* Hover Quick Action Buttons (z-30 to sit above all badges) */}
        {!isMultiSelectMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
            <div className="flex flex-col sm:flex-row items-center gap-2 transform scale-90 group-hover:scale-100 transition-transform duration-300 px-4 w-full justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(episode);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-xl shadow-purple-900/40 transition-all active:scale-95 text-xs tracking-wider cursor-pointer"
              >
                <Zap size={14} className="text-amber-300" />
                Import Images
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewClick?.(episode);
                }}
                className="w-full sm:w-auto px-3.5 py-2 bg-neutral-900/90 hover:bg-neutral-800 border border-white/15 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 text-xs cursor-pointer"
              >
                <Eye size={14} className="text-purple-300" />
                Preview
              </button>
            </div>
          </div>
        )}

        {/* Status badges (Single clean row, fades out on hover) */}
        <div
          className={`absolute top-2.5 ${isMultiSelectMode ? "left-10" : "left-2.5"} flex items-center gap-1.5 transition-all duration-200 z-10 max-w-[70%] overflow-hidden group-hover:opacity-0 group-hover:pointer-events-none`}
        >
          {episode.isNew && (
            <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md border border-rose-400/20 font-mono shrink-0">
              NEW
            </span>
          )}
          {isRead && (
            <span className="bg-emerald-500/90 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md flex items-center gap-0.5 border border-emerald-400/20 font-mono shrink-0">
              <CheckCircle2 size={10} className="fill-current" /> READ
            </span>
          )}
          {isPopular && (
            <span className="bg-amber-500/90 text-black text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md flex items-center gap-0.5 border border-amber-300/40 font-mono shrink-0">
              <Flame size={10} className="fill-current text-black" /> POPULAR
            </span>
          )}
          {episode.rating !== null && episode.rating !== undefined && (
            <div className="bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md border border-white/10 shrink-0">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-extrabold text-amber-300 font-mono">{Number(episode.rating).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Top Right Action Controls */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20 group-hover:opacity-0 group-hover:pointer-events-none transition-opacity duration-200">
          <button
            onClick={handleBookmarkClick}
            className={`p-1.5 rounded-xl backdrop-blur-md transition-all duration-200 border ${
              isBookmarked
                ? "bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/25"
                : "bg-black/60 text-neutral-300 hover:bg-white hover:text-black border-white/10"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Episode"}
          >
            {isBookmarked ? <BookmarkCheck size={14} className="fill-current" /> : <Bookmark size={14} />}
          </button>

          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-xl backdrop-blur-md transition-all duration-200 border bg-black/60 text-neutral-300 hover:bg-white hover:text-black border-white/10 active:scale-90"
            title="Copy Episode Link"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {episode.duration && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1 font-mono group-hover:opacity-0 transition-opacity duration-200 z-10">
            <Clock size={11} className="text-purple-400" />
            {episode.duration}
          </div>
        )}
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 space-y-2.5 flex flex-col justify-between flex-1 relative">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            {renderTitle()}
            <div className="flex items-center gap-1 shrink-0">
              {episode.index !== undefined && (
                <span className="text-[10px] font-bold text-neutral-500 font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-md" title={`Episode Index: ${episode.index}`}>
                  #{episode.index}
                </span>
              )}
              <button
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all p-1 rounded-lg active:scale-90"
                onClick={handleMenuToggle}
                title="More Actions"
              >
                <MoreVertical size={15} />
              </button>
            </div>
          </div>

          {/* Star Rating Visual Row */}
          {episode.rating !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = episode.rating! / 2 >= star;
                  const halfFilled = !filled && episode.rating! / 2 >= star - 0.5;
                  return (
                    <Star
                      key={star}
                      size={11}
                      className={
                        filled
                          ? "fill-amber-400 text-amber-400"
                          : halfFilled
                          ? "fill-amber-400/50 text-amber-400"
                          : "fill-neutral-800 text-neutral-700"
                      }
                    />
                  );
                })}
              </div>
              <span className="text-[10px] font-extrabold text-amber-300 font-mono">
                {episode.rating !== null && episode.rating !== undefined ? Number(episode.rating).toFixed(1) : "N/A"}
              </span>
              <span className="text-[10px] text-neutral-600 font-mono">/10</span>
            </div>
          )}

          {/* Source Platform Badge & Date Row */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-0.5">
            {episode.url && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-purple-400 bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-md font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${getPlatformColor(episode.url)} shadow-sm animate-pulse`} />
                {getSourceName(episode.url).toUpperCase()}
              </span>
            )}

            {episode.date && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>{episode.date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Bottom Bar */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {episode.likes && (
              <div className="flex items-center gap-1 text-xs font-bold text-neutral-300 font-mono">
                <ThumbsUp size={12} className="text-purple-400 fill-purple-400/20" />
                <span>{episode.likes}</span>
              </div>
            )}
            {episode.views !== undefined && episode.views > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-neutral-300 font-mono">
                <Eye size={12} className="text-sky-400" />
                <span>{episode.views >= 1000 ? `${(episode.views / 1000).toFixed(1)}K` : episode.views}</span>
              </div>
            )}
            {!episode.likes && !episode.views && (
              <div className="text-[10px] font-mono text-neutral-600">Ready to import</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreviewClick?.(episode);
              }}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Eye size={12} />
              Read
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick(episode);
              }}
              className="px-3 py-1 bg-purple-600/90 hover:bg-purple-500 text-white rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 shadow-md shadow-purple-950/40 cursor-pointer active:scale-95"
            >
              <span>Import</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* More Actions Dropdown Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-4 bottom-12 w-52 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-neutral-200"
          >
            <div className="py-1.5 px-1 space-y-0.5">
              <button
                onClick={(e) => {
                  handleBookmarkClick(e);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2.5 transition-all"
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck size={14} className="text-amber-400 fill-current" />
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
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2.5 transition-all"
              >
                {isRead ? (
                  <>
                    <XCircle size={14} className="text-rose-400" />
                    <span>Mark as Unread</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>Mark as Read</span>
                  </>
                )}
              </button>

              <div className="h-px bg-neutral-800 my-1 mx-2" />

              <button
                onClick={handleCopyLink}
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2.5 transition-all font-medium"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
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
                className="w-full px-3 py-2 text-left text-xs rounded-xl hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2.5 transition-all"
              >
                <Download size={14} className="text-neutral-400" />
                <span>Export Metadata (JSON)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
