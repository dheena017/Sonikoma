import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
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
  BookOpen,
  Tag,
} from "lucide-react";

import type { Chapter as BaseChapter } from "../types/ChapterTypes";
import { getProxiedImageUrl, getSourceName } from "@/shared/utils/imageProxy";

type ChapterCardChapter = BaseChapter & {
  duration?: string;
  progress?: number;
  isNew?: boolean;
  index?: number;
  language?: string;
  is_locked?: boolean;
};

interface ChapterCardProps {
  chapter: ChapterCardChapter;
  onClick: (chapter: ChapterCardChapter) => void;
  onPreviewClick?: (chapter: ChapterCardChapter) => void;
  onBookmark?: (chapterUrl: string) => void;
  onMarkReadToggle?: (chapterUrl: string) => void;
  isBookmarked?: boolean;
  isRead?: boolean;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (chapterUrl: string) => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
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
  const [imageError, setImageError] = useState(false);
  const getFirstPanel = () => {
    if (chapter.first_panel_image) return chapter.first_panel_image;
    if (chapter.images && chapter.images.length > 0) {
      const first = chapter.images[0];
      return typeof first === "string" ? first : first?.url || "";
    }
    return "";
  };

  const rawCover = chapter.cover_image || getFirstPanel() || "";
  const [imgSrc, setImgSrc] = useState<string>(() =>
    getProxiedImageUrl(rawCover, chapter.url)
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageError(false);
    const cover = chapter.cover_image || getFirstPanel() || "";
    setImgSrc(getProxiedImageUrl(cover, chapter.url));
  }, [chapter.cover_image, chapter.first_panel_image, chapter.images, chapter.url]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleScroll = () => setIsMenuOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isMenuOpen]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) onBookmark(chapter.url);
  };

  const handleCardClick = () => {
    if (isMultiSelectMode && onToggleSelect) {
      onToggleSelect(chapter.url);
    } else {
      onClick(chapter);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(chapter.url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setIsMenuOpen(false);
    }, 1500);
  };

  const handleExportSingleJSON = (e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonContent = JSON.stringify(chapter, null, 2);
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeCh = (chapter.number || "ch")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_");
    link.download = `Chapter_${safeCh}_metadata.json`;
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
    if (name.includes("webtoon") || name.includes("naver"))
      return "bg-emerald-500 shadow-emerald-500/35";
    if (name.includes("kakao") || name.includes("tapas"))
      return "bg-amber-500 shadow-amber-500/35";
    if (name.includes("lezhin")) return "bg-rose-500 shadow-rose-500/35";
    if (name.includes("toonily")) return "bg-fuchsia-500 shadow-fuchsia-500/35";
    if (name.includes("bato")) return "bg-sky-500 shadow-sky-500/35";
    if (name.includes("manga")) return "bg-indigo-500 shadow-indigo-500/35";
    return "bg-[#2A2A2A] shadow-black/50";
  };

  // Format Display Title with "Chapter [Num]" or custom subtitle
  const renderTitle = () => {
    const rawNum = (chapter.number || "").trim();
    const cleanNum = rawNum.replace(/^(?:episode|ep|chapter|ch)[\s._-]*/i, "").trim();
    const rawTitle = (chapter.title || "")
      .replace(
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}.*$/i,
        ""
      )
      .replace(/\blikes?\s*[\d,.]+[KMB]?.*$/i, "")
      .replace(/#\d+\s*$/, "")
      .replace(/^(?:episode|ep|chapter|ch)[\s._-]*\d+\s*[-:–—]?\s*/i, "")
      .replace(/^[-:–—\s]+|[-:–—\s]+$/g, "")
      .trim();

    const displayNum = cleanNum || rawNum || (chapter.index !== undefined ? String(chapter.index + 1) : "");

    // If there is no custom subtitle, render "Chapter [Num]"
    if (!rawTitle || rawTitle.toLowerCase() === displayNum.toLowerCase() || rawTitle.toLowerCase() === `chapter ${displayNum}`.toLowerCase()) {
      return (
        <h3
          className="text-sm font-bold text-white line-clamp-2 leading-snug flex-1 tracking-tight"
          title={`Chapter ${displayNum}`}
        >
          <span className="text-[#60A5FA] font-extrabold">
            {displayNum ? `Chapter ${displayNum}` : "Comic Chapter"}
          </span>
        </h3>
      );
    }

    // If there is a distinct subtitle, render "Chapter [Num]: [Subtitle]"
    return (
      <h3
        className="text-sm font-bold text-white line-clamp-2 leading-snug flex-1 tracking-tight"
        title={`Chapter ${displayNum}: ${rawTitle}`}
      >
        <span className="text-[#60A5FA] font-extrabold mr-1.5">
          {displayNum ? `Ch. ${displayNum}` : "Chapter"}
        </span>
        <span className="text-neutral-200 font-medium">{rawTitle}</span>
      </h3>
    );
  };

  const isPopular = chapter.rating && chapter.rating >= 4.0;
  const rawNum = (chapter.number || "").trim();
  const cleanBadgeNum = rawNum.replace(/^(?:episode|ep|chapter|ch)[\s._-]*/i, "").trim() || (chapter.index !== undefined ? String(chapter.index + 1) : "");

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full min-h-[300px] flex flex-col group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 bg-[#0e0e14] border ${
        isSelected
          ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/50 shadow-[0_0_30px_rgba(59,130,246,0.35)] bg-[#2A2A2A]"
          : "border-neutral-800/80 hover:border-[#3B82F6]/50 shadow-xl hover:shadow-2xl hover:shadow-black/50"
      }`}
    >
      {/* Top Banner / Image Area */}
      <div className="relative w-full bg-neutral-950 aspect-[16/9] overflow-hidden border-b border-neutral-850">
        {isMultiSelectMode && (
          <div
            className="absolute top-3 left-3 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(chapter.url)}
              className="w-5 h-5 rounded-md border-neutral-700 text-[#3B82F6] focus:ring-[#3B82F6]/50 focus:ring-offset-neutral-900 bg-neutral-955 cursor-pointer accent-purple-600 transition-transform duration-200 hover:scale-105 shadow-md"
            />
          </div>
        )}

        {imgSrc && !imageError ? (
          <img
            src={imgSrc}
            alt={chapter.title || `Chapter ${cleanBadgeNum}`}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
              isHovered ? "scale-105 brightness-105" : "scale-100"
            }`}
            onError={() => {
              const firstP = getFirstPanel();
              const proxiedFirstP = firstP ? getProxiedImageUrl(firstP, chapter.url) : "";
              if (imgSrc.includes("/api/proxy-image") && chapter.cover_image && imgSrc !== chapter.cover_image) {
                setImgSrc(chapter.cover_image);
              } else if (firstP && imgSrc !== proxiedFirstP && imgSrc !== firstP) {
                setImgSrc(proxiedFirstP || firstP);
              } else {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#2A2A2A] via-neutral-900 to-neutral-950 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2A2A2A] via-transparent to-transparent" />
            <div className="w-12 h-12 rounded-2xl bg-neutral-900/80 border border-[#3B82F6]/20 flex items-center justify-center shadow-lg shadow-black/50 mb-1.5 transition-transform group-hover:scale-110 duration-300">
              <Sparkles className="w-6 h-6 text-[#3B82F6]/80" />
            </div>
            <span className="text-[11px] font-bold text-[#60A5FA] font-mono tracking-wider">
              {cleanBadgeNum ? `CHAPTER ${cleanBadgeNum}` : "COMIC COVER"}
            </span>
            <span className="text-[9px] text-neutral-500 font-mono">
              Ready to Read &amp; Import
            </span>
          </div>
        )}

        {/* Gradient vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e14] via-[#0e0e14]/20 to-transparent pointer-events-none" />

        {/* Top-Left Floating Chapter Number & Status Badges */}
        <div
          className={`absolute top-2.5 ${
            isMultiSelectMode ? "left-10" : "left-2.5"
          } flex flex-wrap items-center gap-1.5 z-20 max-w-[70%] overflow-hidden`}
        >
          {cleanBadgeNum && (
            <span className="bg-black/80 backdrop-blur-md text-[#60A5FA] border border-[#3B82F6]/30 text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider font-mono shadow-md flex items-center gap-1">
              <BookOpen size={10} className="text-[#3B82F6]" />
              CH. {cleanBadgeNum}
            </span>
          )}

          {chapter.isNew && (
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
          {chapter.rating !== null && chapter.rating !== undefined && (
            <div className="bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md border border-white/10 shrink-0">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-extrabold text-amber-300 font-mono">
                {Number(chapter.rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Top Right Action Controls */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
          <button
            onClick={handleBookmarkClick}
            className={`p-1.5 rounded-xl backdrop-blur-md transition-all duration-200 border cursor-pointer ${
              isBookmarked
                ? "bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/25 scale-105"
                : "bg-black/70 text-neutral-300 hover:bg-white hover:text-black border-white/10"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Chapter"}
          >
            {isBookmarked ? (
              <BookmarkCheck size={14} className="fill-current" />
            ) : (
              <Bookmark size={14} />
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-xl backdrop-blur-md transition-all duration-200 border bg-black/70 text-neutral-300 hover:bg-white hover:text-black border-white/10 active:scale-90 cursor-pointer"
            title="Copy Chapter Link"
          >
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>

        {chapter.duration && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1 font-mono z-10">
            <Clock size={11} className="text-[#3B82F6]" />
            {chapter.duration}
          </div>
        )}
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 space-y-3 flex flex-col justify-between flex-1 relative">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            {renderTitle()}
            <div className="flex items-center gap-1 shrink-0">
              {chapter.index !== undefined && (
                <span
                  className="text-[10px] font-bold text-neutral-400 font-mono bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg"
                  title={`Release sequence #${chapter.index}`}
                >
                  #{chapter.index}
                </span>
              )}
              <button
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all p-1 rounded-lg active:scale-90 cursor-pointer"
                onClick={handleMenuToggle}
                title="More Actions"
              >
                <MoreVertical size={15} />
              </button>
            </div>
          </div>

          {/* Star Rating Visual Row (if available) */}
          {chapter.rating !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = chapter.rating! / 2 >= star;
                  const halfFilled =
                    !filled && chapter.rating! / 2 >= star - 0.5;
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
                {chapter.rating !== null && chapter.rating !== undefined
                  ? Number(chapter.rating).toFixed(1)
                  : "N/A"}
              </span>
              <span className="text-[10px] text-neutral-600 font-mono">
                /10
              </span>
            </div>
          )}

          {/* Source Platform Badge & Release Date Row */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 border-t border-neutral-850/60">
            {chapter.url && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-[#60A5FA] bg-[#2A2A2A] border border-[#3B82F6]/20 px-2 py-0.5 rounded-lg font-mono">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${getPlatformColor(
                    chapter.url
                  )} shadow-sm animate-pulse`}
                />
                {getSourceName(chapter.url).toUpperCase()}
              </span>
            )}

            <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
              <Calendar className="w-3.5 h-3.5 text-[#3B82F6]/70" />
              <span>{chapter.date || "Available"}</span>
            </div>
          </div>
        </div>

        {/* Interactive Bottom Action Bar */}
        <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {chapter.likes && (
              <div className="flex items-center gap-1 text-xs font-bold text-neutral-300 font-mono truncate">
                <ThumbsUp
                  size={12}
                  className="text-[#3B82F6] fill-purple-400/20 shrink-0"
                />
                <span>{chapter.likes}</span>
              </div>
            )}
            {chapter.views !== undefined && chapter.views > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-neutral-300 font-mono truncate">
                <Eye size={12} className="text-sky-400 shrink-0" />
                <span>
                  {chapter.views >= 1000
                    ? `${(chapter.views / 1000).toFixed(1)}K`
                    : chapter.views}
                </span>
              </div>
            )}
            {!chapter.likes && !chapter.views && (
              <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 truncate">
                <Tag size={10} className="text-neutral-600 shrink-0" />
                <span>{cleanBadgeNum ? `Chapter ${cleanBadgeNum}` : "Ready"}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreviewClick?.(chapter);
              }}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="Read Full Chapter Strip"
            >
              <Eye size={12} className="text-[#3B82F6]" />
              <span>Read</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick(chapter);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-black/50 cursor-pointer active:scale-95 border border-[#60A5FA]/30"
              title="Open Chapter in Storyboard Timeline Editor"
            >
              <span>Import</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* More Actions Dropdown Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 bottom-14 w-56 max-w-[calc(100%-1rem)] bg-neutral-950/98 backdrop-blur-xl border border-[#3B82F6]/25 rounded-2xl shadow-2xl shadow-black/60 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-neutral-200"
          >
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={(e) => {
                  handleBookmarkClick(e);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-xs rounded-xl hover:bg-[#3B82F6]/15 hover:text-[#93C5FD] flex items-center gap-2.5 transition-all cursor-pointer"
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck
                      size={14}
                      className="text-amber-400 fill-current"
                    />
                    <span>Remove Bookmark</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={14} className="text-neutral-400" />
                    <span>Bookmark Chapter</span>
                  </>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMarkReadToggle) onMarkReadToggle(chapter.url);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-xs rounded-xl hover:bg-[#3B82F6]/15 hover:text-[#93C5FD] flex items-center gap-2.5 transition-all cursor-pointer"
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
                className="w-full px-3 py-2.5 text-left text-xs rounded-xl hover:bg-[#3B82F6]/15 hover:text-[#93C5FD] flex items-center gap-2.5 transition-all font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="text-neutral-400" />
                    <span>Copy Chapter Link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportSingleJSON}
                className="w-full px-3 py-2.5 text-left text-xs rounded-xl hover:bg-[#3B82F6]/15 hover:text-[#93C5FD] flex items-center gap-2.5 transition-all cursor-pointer"
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

export const EpisodeCard = ChapterCard;
