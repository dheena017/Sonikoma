import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Youtube,
  ExternalLink,
  Film,
  Calendar,
  Clock,
  Mic,
  Globe,
  Layers,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import { AgentRunResponse } from "../types";

interface AgentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AgentRunResponse[];
  onSelectRun: (run: AgentRunResponse) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AgentHistoryModal: React.FC<AgentHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRun,
  onRefresh,
  isLoading,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    onRefresh?.();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const container = document.getElementById("main-scroll-container");
    const prevContainerOverflow = container ? container.style.overflow : "";
    if (container) container.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      if (container) container.style.overflow = prevContainerOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSourceDomain = (url?: string) => {
    if (!url) return null;
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      return hostname;
    } catch {
      return null;
    }
  };

  const getStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case "completed":
        return {
          label: "Completed",
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
        };
      case "failed":
        return {
          label: "Failed",
          color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: <AlertCircle className="w-3 h-3 text-rose-400" />,
        };
      case "stopped":
        return {
          label: "Stopped",
          color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: <AlertCircle className="w-3 h-3 text-amber-400" />,
        };
      case "awaiting_review":
        return {
          label: "Awaiting Review",
          color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          icon: <Clock className="w-3 h-3 text-purple-400" />,
        };
      case "scraping":
        return {
          label: `Scraping (${progress}%)`,
          color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          icon: <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />,
        };
      case "processing_images":
        return {
          label: `Auto-Cropping (${progress}%)`,
          color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
          icon: <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />,
        };
      case "generating_narrative":
        return {
          label: `AI Scripting (${progress}%)`,
          color: "bg-violet-500/10 text-violet-400 border-violet-500/30",
          icon: <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />,
        };
      case "synthesizing_audio":
        return {
          label: `Voiceover TTS (${progress}%)`,
          color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          icon: <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />,
        };
      case "rendering_video":
        return {
          label: `Rendering MP4 (${progress}%)`,
          color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />,
        };
      case "publishing_youtube":
        return {
          label: `Publishing YouTube (${progress}%)`,
          color: "bg-red-500/10 text-red-400 border-red-500/30",
          icon: <Loader2 className="w-3 h-3 text-red-400 animate-spin" />,
        };
      default:
        return {
          label: status,
          color: "bg-neutral-800 text-neutral-300 border-neutral-700",
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
        };
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        {/* Glow Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 blur-[1px]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-800/80 shrink-0 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Previous Agent Generations
              </h2>
              <p className="text-[11px] text-neutral-400 font-sans">
                Historical autonomous video pipelines and publications ({history.length} records)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-800 p-2 rounded-full transition-all cursor-pointer border border-white/5 active:scale-95 disabled:opacity-50"
                title="Refresh history"
                aria-label="Refresh history"
              >
                <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-800 p-2 rounded-full transition-all cursor-pointer border border-white/5 active:scale-95"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List of Runs */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 text-left">
          {history.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-900/80 border border-white/5 flex items-center justify-center text-neutral-500 shadow-inner">
                <Film className="w-6 h-6 opacity-60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">No agent runs recorded yet</p>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Launch your first 1-click autonomous motion comic agent to see episode history here.
                </p>
              </div>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="mt-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
                  <span>Refresh Records</span>
                </button>
              )}
            </div>
          ) : (
            history.map((run) => {
              const isDone = run.status === "completed";
              const isFailed = run.status === "failed";
              const isActive = !isDone && !isFailed && run.status !== "awaiting_review";
              const statusBadge = getStatusBadge(run.status, run.progress);

              const previewThumb =
                run.cover_image ||
                run.youtube_metadata?.thumbnail_url ||
                (run.panels && run.panels[0]?.image_url);

              const sourceDomain = getSourceDomain(run.source_url);
              const panelCount = run.panels?.length || run.raw_images_count || 0;
              const isShorts = run.video_format === "shorts";

              const displayTitle =
                run.scraped_title ||
                (run.series_title
                  ? `${run.series_title}${run.chapter_title ? ` - ${run.chapter_title}` : ""}`
                  : null) ||
                run.youtube_metadata?.title ||
                "Webtoon Episode Recap";

              return (
                <div
                  key={run.run_id}
                  className="p-4 rounded-2xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-900/80 hover:border-blue-500/40 transition-all flex flex-col sm:flex-row gap-4 group shadow-sm text-left"
                >
                  {/* Thumbnail Preview on Left */}
                  <div className="w-full sm:w-36 h-32 sm:h-auto sm:aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950 border border-white/10 shrink-0 relative flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                    {previewThumb ? (
                      <img
                        src={previewThumb}
                        alt={displayTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-600 gap-1.5 p-2">
                        <Film className="w-7 h-7 text-neutral-600" />
                        <span className="text-[10px] font-mono text-neutral-500">Generating</span>
                      </div>
                    )}

                    {/* Format overlay badge */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 text-[9px] font-mono font-bold text-white flex items-center gap-1 shadow-sm">
                      {isShorts ? (
                        <>
                          <Smartphone className="w-2.5 h-2.5 text-purple-400" />
                          <span>9:16 Shorts</span>
                        </>
                      ) : (
                        <>
                          <Monitor className="w-2.5 h-2.5 text-blue-400" />
                          <span>16:9 Video</span>
                        </>
                      )}
                    </div>

                    {/* Duration overlay badge if available */}
                    {run.duration && run.duration > 0 && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 text-[9px] font-mono font-bold text-emerald-400">
                        {run.duration.toFixed(0)}s
                      </div>
                    )}
                  </div>

                  {/* Run Details in Center */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1.5">
                      {/* Top Badges */}
                      <div className="flex items-center gap-2 flex-wrap text-left">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1.5 ${statusBadge.color}`}
                        >
                          {statusBadge.icon}
                          <span>{statusBadge.label}</span>
                        </span>

                        {/* Date Timestamp */}
                        <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          {new Date(run.created_at * 1000).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        {/* Source Host domain badge */}
                        {sourceDomain && (
                          <span className="text-[10px] font-mono text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                            {sourceDomain}
                          </span>
                        )}

                        {/* Run ID */}
                        <span className="text-[10px] font-mono text-neutral-500">
                          #{run.run_id.slice(0, 11)}
                        </span>
                      </div>

                      {/* Series / Story Title */}
                      <h4 className="text-sm sm:text-base font-bold text-neutral-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {displayTitle}
                      </h4>

                      {/* Source URL if available */}
                      {run.source_url && (
                        <p className="text-[11px] font-mono text-neutral-500 truncate max-w-lg hover:text-neutral-400">
                          {run.source_url}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar for Active Runs */}
                    {isActive && run.progress > 0 && (
                      <div className="space-y-1 py-1">
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                          <span className="truncate max-w-[260px] text-blue-400">
                            {run.current_action || "Processing episode pipeline..."}
                          </span>
                          <span className="font-bold text-white">{run.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                            style={{ width: `${run.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Metadata Specs Bar (Panels, Voice, Language, Duration) */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-neutral-400 font-mono">
                      {panelCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800/60 border border-white/5">
                          <Layers className="w-3 h-3 text-neutral-500" />
                          <span>{panelCount} Panels</span>
                        </span>
                      )}

                      {run.voice && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800/60 border border-white/5">
                          <Mic className="w-3 h-3 text-neutral-500" />
                          <span className="capitalize">{run.voice}</span>
                        </span>
                      )}

                      {run.language && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800/60 border border-white/5">
                          <Globe className="w-3 h-3 text-neutral-500" />
                          <span className="uppercase">{run.language}</span>
                        </span>
                      )}

                      {run.duration && run.duration > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800/60 border border-white/5">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{run.duration.toFixed(1)}s</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                      {/* Left: YouTube or Stream Link */}
                      <div className="flex items-center gap-2">
                        {run.youtube_url && (
                          <a
                            href={run.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span>YouTube Video</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        )}

                        {run.video_url && (
                          <a
                            href={run.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Play className="w-3 h-3 text-blue-400 shrink-0" />
                            <span>Watch MP4</span>
                          </a>
                        )}
                      </div>

                      {/* Right: Select / Resume Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRun(run);
                          onClose();
                        }}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 ml-auto"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-900/60 border-t border-neutral-800/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-400 font-mono">
            {history.length} {history.length === 1 ? "pipeline recorded" : "pipelines recorded"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-700 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AgentHistoryModal;
