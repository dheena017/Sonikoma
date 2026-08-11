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
} from "lucide-react";
import type { Series } from "@/features/workspace_projects/utils/seriesGrouping";
import { timeAgo } from "@/utils/dateUtils";

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

  useEffect(() => {
    setTitleText(series.title || "Untitled Series");
  }, [series.title]);

  const statusColors: Record<string, string> = {
    Completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "In Progress": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Draft: "bg-neutral-500/20 text-neutral-300 border-neutral-500/30",
    Processing: "bg-purple-500/20 text-purple-300 border-purple-500/30",
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

  const isProcessing = series.latestChapter?.status?.toLowerCase() === "processing";

  return (
    <div
      onClick={() => onOpenSeries(series)}
      className={`group relative flex flex-col bg-[#111116] border ${
        isSelected ? "border-purple-500 shadow-lg shadow-purple-500/20" : "border-white/10 hover:border-purple-500/50"
      } rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer shadow-xl`}
    >
      {/* ─── Thumbnail / Header Section ────────────────── */}
      <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden border-b border-white/10 shrink-0">

        {/* Selection checkbox overlay */}
        {showSelection && (
          <div
            className={`absolute top-3 left-3 z-20 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isSelected
                ? "bg-purple-500 border-purple-500 text-white shadow-purple-500/40"
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

        {/* Cover image or fallback */}
        {series.cover ? (
          <img
            src={series.cover}
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1 opacity-90 group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-950/20 via-neutral-900 to-neutral-950">
            <FolderOpen className="w-10 h-10 text-purple-500/40" />
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em]">No Cover</span>
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 backdrop-blur-[2px] z-10">
          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-purple-900/60 scale-75 group-hover:scale-100 transition-transform duration-300 border border-purple-400/40">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Top badges row */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {/* Status badge */}
          <div className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] rounded-full border backdrop-blur-md shadow-md ${statusColor}`}>
            {seriesStatus}
          </div>

          {/* 3-dot menu */}
          <button
            onClick={(e) => onToggleMenu?.(e, series.id)}
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-purple-600 text-neutral-300 hover:text-white border border-white/15 transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-lg backdrop-blur-md"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom thumbnail badges */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
          <div className="px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/15 rounded-xl text-[9px] font-extrabold text-white tracking-wider shadow-lg flex items-center gap-1.5 font-mono">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>{series.chapterCount} {series.chapterCount === 1 ? 'Chapter' : 'Chapters'}</span>
          </div>

          <div className="px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/15 rounded-xl text-[9px] font-bold text-purple-300 tracking-wider shadow-lg flex items-center gap-1.5 font-mono">
            <Clock className="w-3 h-3 text-purple-400" />
            <span>{timeAgo(series.latestUpdatedAt || '')}</span>
          </div>
        </div>

      </div>

      {/* Dropdown menu — at card level so thumbnail overflow-hidden doesn't clip it */}
      {openMenuId === series.id && (
        <div
          className="absolute right-2.5 top-10 w-44 bg-[#16161b] border border-white/10 rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { onOpenSeries(series); onToggleMenu?.(e, series.id); }}
            className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Open Series
          </button>
          {onOpenDetails && (
            <button onClick={(e) => onOpenDetails(e, series)} className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
              <FolderOpen className="w-3.5 h-3.5" /> Details
            </button>
          )}
          {onRename && (
            <button onClick={(e) => onRename(e, series)} className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Rename
            </button>
          )}
          {onExport && (
            <button onClick={(e) => onExport(e, series)} className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
          {onCopyLink && (
            <button onClick={(e) => onCopyLink(e, series)} className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
              <Link className="w-3.5 h-3.5" /> Copy Link
            </button>
          )}
          {onDelete && (
            <>
              <div className="h-px bg-white/5 my-1" />
              <button onClick={(e) => onDelete(e, series.id)} className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* ─── Card Body ─────────────────────────────────── */}
      <div className="px-4.5 pt-3.5 pb-4.5 flex flex-col flex-1 gap-2.5 relative z-10">
        {/* Source label */}
        <div className="flex items-center gap-1.5">
          <SourceIcon className="h-3.5 w-3.5 text-neutral-500" />
          <span className="text-xs text-neutral-500 font-mono tracking-wider uppercase truncate">
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
              if (e.key === "Enter") onSaveRename?.(series.id, e.currentTarget.value);
            }}
            autoFocus
            className="text-base font-bold text-white bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 w-full"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="text-base font-extrabold text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors duration-200">
            {titleText}
          </h3>
        )}

        {/* Genre + Author row */}
        <div className="flex items-center gap-2 flex-wrap">
          {series.genre && (
            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
              {series.genre}
            </span>
          )}
          {series.author && (
            <span className="text-xs text-neutral-400 font-medium truncate">
              {series.author}
            </span>
          )}
        </div>

        {/* Synopsis (optional) */}
        {series.synopsis && (
          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed flex-1">
            {series.synopsis}
          </p>
        )}

        {/* ─── Footer ───────────────────────────────────── */}
        <div className="pt-3 mt-auto border-t border-neutral-800/60 space-y-3">
          {/* Metadata Row: Panels Count + Time Ago */}
          <div className="flex items-center justify-between text-xs">
            {(() => {
              const totalPanels = series.chapters.reduce((acc, c) => acc + (c.panels_count || 0), 0);
              const totalImported = series.chapters.reduce((acc, c) => acc + (c.imported_assets_count || 0), 0);
              const displayCount = totalPanels || totalImported || 0;
              const hasDiff = totalPanels > 0 && totalImported > 0 && totalPanels !== totalImported;

              return (
                <div
                  className="flex items-center gap-1.5 text-neutral-300 font-mono truncate"
                  title={
                    hasDiff
                      ? `Timeline: ${totalPanels} panels | Imported: ${totalImported} assets`
                      : `${displayCount} panels`
                  }
                >
                  <Scissors className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="font-bold text-white">{displayCount} panels</span>
                  {totalImported > 0 && (
                    <span className="text-[10px] text-neutral-400 font-normal">
                      ({totalImported} imp)
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center gap-1 text-xs text-neutral-400 font-mono shrink-0">
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              <span>{timeAgo(series.latestUpdatedAt || '')}</span>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="w-full pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSeries(series);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border border-purple-400/40 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-[0_4px_14px_rgba(168,85,247,0.35)] active:scale-95 shrink-0"
            >
              <span>Open Series</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Processing shimmer bar */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 z-20">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-amber-500 animate-shimmer"
            style={{ width: "100%", backgroundSize: "200% 100%" }}
          />
        </div>
      )}
    </div>
  );
}
