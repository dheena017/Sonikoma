import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  MoreVertical,
  Clock,
  Play,
  Scissors,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Globe,
  Edit2,
  Download,
  Link,
  Layers,
  Sparkles,
} from "lucide-react";
import type { Series } from "@/features/workspace_projects/utils/seriesGrouping";
import { timeAgo } from "@/utils/dateUtils";
import { getProxiedImageUrl } from "@/utils";

interface SeriesCardProps {
  series: Series;
  onOpenSeries: (series: Series) => void;
  onOpenCreativeSuite?: (e: React.MouseEvent, series: Series) => void;
  onRename?: (e: React.MouseEvent, series: Series) => void;
  onExport?: (e: React.MouseEvent, series: Series) => void;
  onOpenDetails?: (e: React.MouseEvent, series: Series) => void;
  onDelete?: (e: React.MouseEvent, seriesId: string) => void;
  onCopyLink?: (e: React.MouseEvent, series: Series) => void;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent, seriesId: string) => void;
  showSelection?: boolean;
  openMenuId?: string | null;
  onToggleMenu?: (e: React.MouseEvent, seriesId: string) => void;
  renamingProjectId?: string | null;
  onSaveRename?: (seriesId: string, newName: string) => void;
}

export default function SeriesCard({
  series,
  onOpenSeries,
  onOpenCreativeSuite,
  onRename,
  onExport,
  onOpenDetails,
  onDelete,
  onCopyLink,
  isSelected = false,
  onToggleSelect,
  showSelection = false,
  openMenuId,
  onToggleMenu,
  renamingProjectId,
  onSaveRename,
}: SeriesCardProps) {
  const isRenaming = renamingProjectId === series.id;
  const [titleText, setTitleText] = useState(series.title || "Untitled Series");
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(() =>
    getProxiedImageUrl(series.cover, series.latestChapter?.url)
  );

  useEffect(() => {
    setTitleText(series.title || "Untitled Series");
  }, [series.title]);

  useEffect(() => {
    setImageError(false);
    setImgSrc(getProxiedImageUrl(series.cover, series.latestChapter?.url));
  }, [series.cover, series.latestChapter?.url]);

  const statusColors: Record<string, string> = {
    Completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "In Progress": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Draft: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30",
    Processing: "bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/30",
  };

  // Use the latest chapter's status or default to Draft
  const seriesStatus = series.latestChapter?.status || "Draft";
  const statusColor = statusColors[seriesStatus] || statusColors["Draft"];

  const getSourceIcon = (url?: string) => {
    if (!url) return FolderOpen;
    if (url.includes("webtoons.com")) return Globe;
    if (url.includes("tapas.io")) return Globe;
    return Globe;
  };
  const SourceIcon = getSourceIcon(series.latestChapter?.url);
  const getSourceName = (url?: string) => {
    if (!url) return "Local";
    if (url.includes("webtoons.com")) return "Webtoon";
    if (url.includes("tapas.io")) return "Tapas";
    try {
      const { hostname } = new URL(url);
      return hostname.replace("www.", "");
    } catch {
      return "Web";
    }
  };

  const isProcessing =
    series.latestChapter?.status?.toLowerCase() === "processing";

  return (
    <div
      onClick={() => onOpenSeries(series)}
      className={`group relative flex flex-col bg-neutral-900/70 backdrop-blur-xl border ${
        isSelected
          ? "border-[#3B82F6] shadow-lg shadow-black/50 ring-1 ring-[#3B82F6]/50"
          : "border-white/10 hover:border-[#3B82F6]/40 hover:shadow-[0_12px_36px_rgba(59,130,246,0.18)]"
      } rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer shadow-xl`}
    >
      {/* ─── Thumbnail / Header Section ────────────────── */}
      <div className="relative aspect-[16/10] w-full bg-neutral-950 overflow-hidden flex-shrink-0 rounded-t-3xl">
        {/* Selection checkbox overlay */}
        {showSelection && (
          <div
            className={`absolute top-2.5 left-2.5 z-20 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isSelected
                ? "bg-[#2A2A2A] border-[#3B82F6] text-white shadow-black/50"
                : "bg-black/40 border-white/30 text-transparent hover:border-white/60 backdrop-blur-sm"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(e, series.id);
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Cover image with Ambient Blurred Background */}
        {imgSrc && !imageError ? (
          <>
            <img
              src={imgSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-125 pointer-events-none"
            />
            <img
              src={imgSrc}
              alt={series.title}
              className={`relative z-[1] w-full h-full object-contain transition-transform duration-700 ease-out block ${
                isSelected ? "scale-105 opacity-90" : "group-hover:scale-105"
              }`}
              loading="lazy"
              onError={() => {
                if (imgSrc.includes("/api/proxy-image") && series.cover) {
                  setImgSrc(series.cover);
                } else {
                  setImageError(true);
                }
              }}
            />
            {/* Seamless bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none z-[2]" />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_45%)] z-[2]" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#2A2A2A] via-neutral-900 to-neutral-950 p-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900/80 border border-[#3B82F6]/20 flex items-center justify-center shadow-lg shadow-black/50 transition-transform group-hover:scale-110 duration-300">
              <Sparkles className="w-5 h-5 text-[#3B82F6]/80" />
            </div>
            <span className="text-[11px] text-neutral-300 font-bold font-mono tracking-wider text-center line-clamp-1">
              {series.title || "COMIC SERIES"}
            </span>
            <span className="text-[9px] text-neutral-500 font-mono">
              {series.chapterCount || 0} Chapters in Workspace
            </span>
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 backdrop-blur-[2px] z-10">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-black/50 scale-75 group-hover:scale-100 transition-transform duration-300 border border-[#60A5FA]/40">
            <Play className="h-4 w-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Top badges row */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {/* Status badge */}
          <div
            className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded-full border backdrop-blur-md shadow-md ${statusColor}`}
          >
            {seriesStatus}
          </div>

          {/* 3-dot menu */}
          <div
            className="relative z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleMenu?.(e, series.id);
              }}
              aria-label="Series actions & options"
              title="Series actions & options"
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-[#3B82F6] text-neutral-300 hover:text-white border border-white/20 hover:border-[#60A5FA] transition-all flex items-center justify-center cursor-pointer active:scale-90 shadow-lg backdrop-blur-md"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom thumbnail badges */}
        <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-between pointer-events-none">
          <div className="px-2 py-0.5 bg-black/80 backdrop-blur-md border border-white/15 rounded-lg text-[9px] font-extrabold text-white tracking-wider shadow-lg flex items-center gap-1 font-mono">
            <Layers className="w-2.5 h-2.5 text-[#3B82F6]" />
            <span>
              {series.chapterCount}{" "}
              {series.chapterCount === 1 ? "Chapter" : "Chapters"}
            </span>
          </div>

          <div className="px-2 py-0.5 bg-black/80 backdrop-blur-md border border-white/15 rounded-lg text-[9px] font-bold text-[#60A5FA] tracking-wider shadow-lg flex items-center gap-1 font-mono">
            <Clock className="w-2.5 h-2.5 text-[#3B82F6]" />
            <span>{timeAgo(series.latestUpdatedAt || "")}</span>
          </div>
        </div>
      </div>

      {/* Dropdown menu — at card level so thumbnail overflow-hidden doesn't clip it */}
      {openMenuId === series.id && (
        <div
          className="absolute right-2 top-11 w-52 bg-[#0c0d16]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onOpenSeries(series);
              onToggleMenu?.(e, series.id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] group-hover/item:bg-[#3B82F6]/20 group-hover/item:text-[#60A5FA] transition-colors">
              <Play className="w-3.5 h-3.5 fill-purple-400/20" />
            </div>
            <span className="font-semibold">Open Series</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onOpenDetails) {
                onOpenDetails(e, series);
              } else {
                onOpenSeries(series);
              }
              onToggleMenu?.(e, series.id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover/item:bg-blue-500/20 group-hover/item:text-blue-300 transition-colors">
              <FolderOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Details</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onRename) {
                onRename(e, series);
              } else {
                onOpenSeries(series);
              }
              onToggleMenu?.(e, series.id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover/item:bg-blue-500/20 group-hover/item:text-blue-300 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Rename</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onExport) {
                onExport(e, series);
              } else if (series.latestChapter) {
                const nav = (window as any).navigateTo;
                const target = `/scraper?id=${encodeURIComponent(
                  series.latestChapter.project_id
                )}&export=true`;
                if (typeof nav === "function") nav(target);
                else {
                  window.history.pushState({}, "", target);
                  window.dispatchEvent(new Event("popstate"));
                }
              }
              onToggleMenu?.(e, series.id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover/item:bg-emerald-500/20 group-hover/item:text-emerald-300 transition-colors">
              <Download className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Export</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onCopyLink) {
                onCopyLink(e, series);
              } else {
                const url = series.slug
                  ? `${window.location.origin}/projects/${series.slug}`
                  : `${window.location.origin}/projects`;
                navigator.clipboard.writeText(url);
                if (typeof (window as any).alertAsync === "function") {
                  (window as any).alertAsync(
                    "Series link copied to clipboard!",
                    "Success",
                    "emerald"
                  );
                }
              }
              onToggleMenu?.(e, series.id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover/item:bg-amber-500/20 group-hover/item:text-amber-300 transition-colors">
              <Link className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Copy Link</span>
          </button>
          <div className="h-px bg-white/10 my-1" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onDelete) {
                onDelete(e, series.id);
              }
              onToggleMenu?.(e, series.id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-rose-400 hover:bg-rose-500/15 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover/item:bg-rose-500/20 group-hover/item:text-rose-300 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Delete</span>
          </button>
        </div>
      )}

      {/* ─── Card Body ─────────────────────────────────── */}
      <div className="p-4 sm:p-4.5 flex flex-col flex-1 gap-2.5 relative z-10">
        {/* Source label */}
        <div className="flex items-center gap-1.5">
          <SourceIcon className="h-3 w-3 text-neutral-500" />
          <span className="text-[10.5px] text-neutral-500 font-mono tracking-wider uppercase truncate">
            {getSourceName(series.latestChapter?.url)}
          </span>
        </div>

        {/* Title */}
        {isRenaming ? (
          <input
            type="text"
            defaultValue={titleText}
            onBlur={(e) => onSaveRename?.(series.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                onSaveRename?.(series.id, e.currentTarget.value);
            }}
            autoFocus
            className="text-sm font-bold text-white bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 w-full"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-1 group-hover:text-[#93C5FD] transition-colors duration-200"
            title={titleText}
          >
            {titleText}
          </h3>
        )}

        {/* Genre + Author row */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {series.genre && (
            <span className="text-[10px] bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30 px-2 py-0.5 rounded-md font-bold">
              {series.genre}
            </span>
          )}
          {series.author && (
            <span className="text-[11px] text-neutral-400 font-medium truncate">
              {series.author}
            </span>
          )}
        </div>

        {/* ─── Footer ───────────────────────────────────── */}
        <div className="pt-1.5 mt-auto flex items-center justify-between gap-2">
          {/* Chapters Count */}
          <div
            className="flex items-center gap-1.5 text-neutral-300 font-mono text-xs truncate"
            title={`${series.chapterCount} ${
              series.chapterCount === 1 ? "Chapter" : "Chapters"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-[#3B82F6] shrink-0" />
            <span className="font-bold text-white whitespace-nowrap">
              {series.chapterCount}{" "}
              {series.chapterCount === 1 ? "chapter" : "chapters"}
            </span>
          </div>

          {/* Compact Open Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSeries(series);
            }}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-xl border border-[#60A5FA]/40 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-black/50 active:scale-95 shrink-0"
          >
            <span>Explore</span>
            <ArrowRight className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      {/* Processing shimmer bar */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 z-20">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-amber-500 animate-shimmer"
            style={{ width: "100%", backgroundSize: "200% 100%" }}
          />
        </div>
      )}
    </div>
  );
}
