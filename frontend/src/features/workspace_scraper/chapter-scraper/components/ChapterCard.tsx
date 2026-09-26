import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Star,
  ThumbsUp,
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
  Layers,
  MessageSquare,
  Lock,
  Globe,
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
  page_count?: number;
  images_count?: number;
  comment_count?: number;
  author?: string;
  genre?: string;
  summary?: string;
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

const formatLikesCount = (likesStr?: string): string => {
  if (!likesStr) return "";
  const cleaned = likesStr.replace(/likes?/gi, "").replace(/,/g, "").trim();
  if (!cleaned) return "";
  if (/[0-9.]+[KMB]$/i.test(cleaned)) return cleaned.toUpperCase();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return cleaned;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
};

const formatViewsCount = (views?: number): string => {
  if (views === undefined || views === null || views <= 0) return "";
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return String(views);
};

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
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeCh = (chapter.number || "ch").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
    link.download = `Chapter_${safeCh}_metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const rawNum = (chapter.number || "").trim();
  const cleanNum =
    rawNum.replace(/^(?:episode|ep|chapter|ch)[\s._-]*/i, "").trim() ||
    (chapter.index !== undefined ? String(chapter.index + 1) : "");

  const rawTitle = (chapter.title || "")
    .replace(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}.*$/i, "")
    .replace(/\blikes?\s*[\d,.]+[KMB]?.*$/i, "")
    .replace(/#\d+\s*$/, "")
    .replace(/^(?:episode|ep|chapter|ch)[\s._-]*\d+\s*[-:��]?\s*/i, "")
    .replace(/^[-:��\s]+|[-:��\s]+$/g, "")
    .trim();

  const titleIsSameAsNum =
    !rawTitle ||
    rawTitle.toLowerCase() === cleanNum.toLowerCase() ||
    rawTitle.toLowerCase() === `chapter ${cleanNum}`.toLowerCase();

  const sourceName = chapter.url ? getSourceName(chapter.url).toUpperCase() : "";
  const formattedLikes = formatLikesCount(chapter.likes);
  const formattedViews = formatViewsCount(chapter.views);
  const panelCount =
    chapter.page_count ||
    chapter.images_count ||
    ((chapter.images?.length ?? 0) > 0 ? chapter.images.length : undefined);

  const isPopular =
    (chapter.rating && chapter.rating >= 4.0) ||
    (chapter.likes && chapter.likes.toLowerCase().includes("m"));

  return (
    <div
      onClick={handleCardClick}
      className={`w-full flex flex-col group relative rounded-2xl overflow-hidden cursor-pointer bg-[#111116] border transition-all duration-200 ${
        isSelected
          ? "border-[#3B82F6]/60 shadow-lg shadow-[#3B82F6]/10"
          : "border-[#1E1E26] hover:border-[#2E2E3A] hover:shadow-xl hover:shadow-black/40"
      }`}
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#0A0A10]">
        {isMultiSelectMode && (
          <div className="absolute top-2.5 left-2.5 z-30" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(chapter.url)}
              className="w-4 h-4 rounded border-neutral-700 text-[#3B82F6] bg-neutral-900 cursor-pointer accent-blue-600"
            />
          </div>
        )}

        {imgSrc && !imageError ? (
          <img
            src={imgSrc}
            alt={chapter.title || `Chapter ${cleanNum}`}
            className="w-full h-full object-cover"
            onError={() => {
              const firstP = getFirstPanel();
              const proxiedFirstP = firstP ? getProxiedImageUrl(firstP, chapter.url) : "";
              if (imgSrc.includes("/api/v1/proxy/image") && chapter.cover_image && imgSrc !== chapter.cover_image) {
                setImgSrc(chapter.cover_image);
              } else if (firstP && imgSrc !== proxiedFirstP && imgSrc !== firstP) {
                setImgSrc(proxiedFirstP || firstP);
              } else {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1A1A24] to-[#0A0A10]">
            <div className="w-10 h-10 rounded-xl bg-[#1E1E2A] border border-[#3B82F6]/15 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-[#3B82F6]/60" />
            </div>
            <span className="text-[10px] font-bold text-neutral-500 font-mono tracking-wider">
              {cleanNum ? `CH. ${cleanNum}` : "NO COVER"}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-transparent to-transparent pointer-events-none" />

        {/* Chapter badge */}
        {cleanNum && (
          <div className={`absolute top-2.5 ${isMultiSelectMode ? "left-9" : "left-2.5"} z-20`}>
            <span className="inline-flex items-center gap-1 bg-black/70 backdrop-blur-sm text-[#60A5FA] text-[10px] font-black px-2 py-0.5 rounded-md font-mono border border-white/5">
              <BookOpen size={9} />
              CH. {cleanNum}
            </span>
          </div>
        )}

        {/* Status badges */}
        <div className={`absolute top-9 ${isMultiSelectMode ? "left-9" : "left-2.5"} z-20 flex flex-col gap-1`}>
          {isRead && (
            <span className="inline-flex items-center gap-0.5 bg-emerald-500/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md font-mono">
              <CheckCircle2 size={8} /> READ
            </span>
          )}
          {chapter.isNew && !isRead && (
            <span className="bg-rose-500/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md font-mono">NEW</span>
          )}
          {isPopular && (
            <span className="inline-flex items-center gap-0.5 bg-amber-500/80 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md font-mono">
              <Flame size={8} /> HOT
            </span>
          )}
        </div>

        {/* Top right controls */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
          <button
            onClick={handleBookmarkClick}
            className={`p-1.5 rounded-lg backdrop-blur-sm transition-all border cursor-pointer ${
              isBookmarked
                ? "bg-amber-500 text-black border-amber-400/50"
                : "bg-black/60 text-neutral-300 hover:bg-white/10 border-white/5"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
          >
            {isBookmarked ? <BookmarkCheck size={12} className="fill-current" /> : <Bookmark size={12} />}
          </button>
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg backdrop-blur-sm bg-black/60 text-neutral-300 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
            title="Copy Link"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {panelCount && panelCount > 0 ? (
            <span className="inline-flex items-center gap-1 bg-black/60 text-neutral-400 text-[9px] font-mono px-1.5 py-0.5 rounded-md">
              <Layers size={9} className="text-sky-400" />
              {panelCount}p
            </span>
          ) : <span />}
          {chapter.is_locked !== undefined && (
            <span className={`inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
              chapter.is_locked
                ? "bg-rose-950/70 text-rose-400 border border-rose-500/20"
                : "bg-emerald-950/70 text-emerald-400 border border-emerald-500/20"
            }`}>
              <Lock size={8} />
              {chapter.is_locked ? "Locked" : "Free"}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="px-3.5 pt-3 pb-3 flex flex-col gap-2 flex-1 relative">

        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 min-w-0 text-sm font-bold text-white leading-snug line-clamp-2 tracking-tight">
            <span className="text-[#60A5FA]">{cleanNum ? `Ch. ${cleanNum}` : "Chapter"}</span>
            {!titleIsSameAsNum && rawTitle && (
              <span className="text-neutral-300 font-medium ml-1.5">{rawTitle}</span>
            )}
          </h3>
          <div className="flex items-center gap-0.5 shrink-0">
            {chapter.index !== undefined && (
              <span className="text-[10px] text-neutral-600 font-mono">#{chapter.index}</span>
            )}
            <button
              className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-[#1A1A26] transition-all cursor-pointer"
              onClick={handleMenuToggle}
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Rating */}
        {chapter.rating !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = chapter.rating! / 2 >= star;
                const half = !filled && chapter.rating! / 2 >= star - 0.5;
                return (
                  <Star
                    key={star}
                    size={10}
                    className={filled ? "fill-amber-400 text-amber-400" : half ? "fill-amber-400/40 text-amber-400" : "fill-[#1E1E26] text-neutral-700"}
                  />
                );
              })}
            </div>
            <span className="text-[10px] font-bold text-amber-400 font-mono">{Number(chapter.rating).toFixed(1)}</span>
            <span className="text-[10px] text-neutral-600 font-mono">/10</span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between border-t border-[#1A1A22] pt-2">
          <div className="flex items-center gap-2">
            {sourceName && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest text-[#60A5FA] bg-[#1A1A2A] border border-[#3B82F6]/15 px-1.5 py-0.5 rounded-md font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {sourceName}
              </span>
            )}
            {chapter.language && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-neutral-500 font-mono">
                <Globe size={9} />
                {chapter.language.toUpperCase()}
              </span>
            )}
          </div>
          {chapter.date && (
            <span className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
              <Calendar size={10} className="text-[#3B82F6]/50" />
              {chapter.date}
            </span>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2.5 text-[11px] text-neutral-500 font-mono overflow-hidden">
            {formattedLikes && (
              <span className="flex items-center gap-1 shrink-0">
                <ThumbsUp size={11} className="text-[#3B82F6]" />
                {formattedLikes}
              </span>
            )}
            {formattedViews && (
              <span className="flex items-center gap-1 shrink-0">
                <Eye size={11} className="text-sky-400" />
                {formattedViews}
              </span>
            )}
            {chapter.comment_count && chapter.comment_count > 0 && (
              <span className="flex items-center gap-1 shrink-0">
                <MessageSquare size={11} className="text-purple-400" />
                {chapter.comment_count}
              </span>
            )}
            {!formattedLikes && !formattedViews && !chapter.comment_count && panelCount && (
              <span className="flex items-center gap-1 shrink-0">
                <Layers size={11} className="text-neutral-600" />
                {panelCount} panels
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onPreviewClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onPreviewClick(chapter); }}
                className="px-2.5 py-1.5 bg-[#1A1A22] hover:bg-[#222230] border border-[#2A2A36] text-neutral-300 hover:text-white rounded-lg text-[11px] font-bold font-mono flex items-center gap-1 cursor-pointer transition-all"
              >
                <Eye size={11} className="text-[#3B82F6]" />
                Read
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onClick(chapter); }}
              className="px-3 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-[11px] font-bold font-mono flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-blue-900/30"
            >
              Import
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* Dropdown */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 bottom-14 w-52 bg-[#0E0E14]/98 backdrop-blur-xl border border-[#2A2A36] rounded-xl shadow-2xl shadow-black/70 z-40 overflow-hidden py-1"
          >
            <button
              onClick={(e) => { handleBookmarkClick(e); setIsMenuOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-neutral-200 hover:bg-[#1A1A26] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              {isBookmarked ? (
                <><BookmarkCheck size={13} className="text-amber-400 fill-current" /><span>Remove Bookmark</span></>
              ) : (
                <><Bookmark size={13} className="text-neutral-400" /><span>Bookmark Chapter</span></>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (onMarkReadToggle) onMarkReadToggle(chapter.url); setIsMenuOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-neutral-200 hover:bg-[#1A1A26] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              {isRead ? (
                <><XCircle size={13} className="text-rose-400" /><span>Mark as Unread</span></>
              ) : (
                <><CheckCircle2 size={13} className="text-emerald-400" /><span>Mark as Read</span></>
              )}
            </button>
            <div className="h-px bg-[#1E1E28] mx-2 my-1" />
            <button
              onClick={handleCopyLink}
              className="w-full px-3 py-2 text-left text-xs text-neutral-200 hover:bg-[#1A1A26] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <><Check size={13} className="text-emerald-400" /><span>Copied!</span></>
              ) : (
                <><Copy size={13} className="text-neutral-400" /><span>Copy Chapter Link</span></>
              )}
            </button>
            <button
              onClick={handleExportSingleJSON}
              className="w-full px-3 py-2 text-left text-xs text-neutral-200 hover:bg-[#1A1A26] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Download size={13} className="text-neutral-400" />
              <span>Export Metadata (JSON)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const EpisodeCard = ChapterCard;
