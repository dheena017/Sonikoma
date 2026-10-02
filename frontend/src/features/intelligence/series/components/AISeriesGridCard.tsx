import React, { useState } from "react";
import {
  Sparkles,
  Tv,
  Swords,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Layers,
  MoreVertical,
  Trash2,
  Copy,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { AISeriesProject } from "@/features/intelligence/series/api/aiSeries";
import { timeAgo } from "@/shared/utils/dateUtils";

interface AISeriesGridCardProps {
  series: AISeriesProject;
  onOpen?: (series: AISeriesProject) => void;
  onDelete?: (seriesId: string) => void;
  onCopyLink?: (series: AISeriesProject) => void;
}

export const AISeriesGridCard: React.FC<AISeriesGridCardProps> = ({
  series,
  onOpen,
  onDelete,
  onCopyLink,
}) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [coverLoading, setCoverLoading] = useState<boolean>(Boolean(series.cover_image_url));
  const [coverError, setCoverError] = useState<boolean>(false);
  const fmt = (series.format_type || "manhwa").toLowerCase();
  const isAnime = fmt === "anime";
  const isManga = fmt === "comic_manga";
  const FormatIcon = isAnime ? Tv : isManga ? Swords : BookOpen;

  const chapterCount =
    series.sessions?.[0]?.chapters?.length ||
    series.chapters_per_session ||
    series.total_episodes ||
    8;

  const studioUrl = `/ai-series/${series.series_id}?format=${fmt}`;

  const handleCardClick = () => {
    if (onOpen) {
      onOpen(series);
    } else {
      const nav = (window as any).navigateTo;
      if (typeof nav === "function") {
        nav(studioUrl);
      } else {
        window.history.pushState({}, "", studioUrl);
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenu(false);
    if (onCopyLink) {
      onCopyLink(series);
    } else {
      const fullUrl = `${window.location.origin}${studioUrl}`;
      navigator.clipboard.writeText(fullUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenu(false);
    if (onDelete && series.series_id) {
      onDelete(series.series_id);
    }
  };

  const formatLabel = isAnime
    ? "Anime Cinema"
    : isManga
    ? "Manga Grid"
    : "Webtoon Strip";

  const timeAgoText = timeAgo(series.updated_at || series.created_at);

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col rounded-2xl sm:rounded-3xl border border-[#282834] bg-[#121217] hover:bg-[#181822] hover:border-[#3B82F6]/60 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#3B82F6]/10 overflow-hidden text-left"
    >
      {/* ─── Top Thumbnail Banner ─── */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-neutral-900 via-[#181a29] to-[#0c0d14]">
        {series.cover_image_url && !coverError ? (
          <>
            {coverLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#141525] via-[#0c0d18] to-[#181a2e] flex flex-col items-center justify-center animate-pulse z-0">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin mb-1.5" />
                <span className="text-[10px] font-mono text-neutral-400">Loading Series Artwork...</span>
              </div>
            )}
            <img
              src={series.cover_image_url}
              alt={series.title}
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-out ${
                coverLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setCoverLoading(false)}
              onError={() => {
                setCoverLoading(false);
                setCoverError(true);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />
            <div className="w-14 h-14 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-center text-[#3B82F6] shadow-xl group-hover:scale-110 transition-transform duration-300">
              <FormatIcon className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-mono text-neutral-400 mt-2 font-bold tracking-wider uppercase">
              {formatLabel}
            </span>
          </div>
        )}

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges Row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wide border border-[#3B82F6]/30 bg-black/60 backdrop-blur-md text-[#60A5FA]">
            <FormatIcon className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="capitalize">{fmt.replace("_", " ")}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border border-emerald-500/30 bg-black/60 backdrop-blur-md text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              READY
            </span>

            {/* Menu Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu(!openMenu);
                }}
                className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/30 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {openMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-[#1A1A22] border border-[#2F2F3D] shadow-2xl p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95"
                >
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy Studio Link</span>
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete Series</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Badges Inside Thumbnail */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-neutral-300 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-white font-bold">
            <Layers className="w-3 h-3 text-[#3B82F6]" />
            {chapterCount} {chapterCount === 1 ? "Chapter" : "Chapters"}
          </span>
          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-neutral-400">
            <Clock className="w-3 h-3 text-neutral-400" />
            {timeAgoText}
          </span>
        </div>
      </div>

      {/* ─── Card Body ─── */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">
          {/* Title */}
          <h3
            className="text-base font-black text-white group-hover:text-[#60A5FA] transition-colors line-clamp-1"
            title={series.title}
          >
            {series.title}
          </h3>

          {/* Genre & Art Style Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[10px] font-bold bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 px-2 py-0.5 rounded-md">
              {series.genre || "Action Fantasy"}
            </span>
            <span className="text-[11px] font-mono text-neutral-400 capitalize">
              {series.art_style?.replace(/_/g, " ") || "2D Cel"}
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-[11px] font-mono text-amber-400/90 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              AI Studio
            </span>
          </div>

          {/* Logline */}
          {series.logline && (
            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
              {series.logline}
            </p>
          )}
        </div>

        {/* ─── Footer Action ─── */}
        <div className="pt-3 border-t border-[#282834] flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
            <span className="text-neutral-500">Pacing:</span>
            <span className="font-semibold text-neutral-300 capitalize">
              {series.pacing || "balanced"}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-blue-400/40 bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-blue-500/25 active:scale-95 shrink-0"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3 h-3 text-white group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISeriesGridCard;
