import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Film,
  Layers,
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Eye,
  ChevronRight,
  Tv,
} from "lucide-react";
import { notify } from "@/features/app_notification";

interface ChapterItem {
  id: string;
  chapter_number: number;
  title: string;
  synopsis?: string;
  status: string;
  progress_percent: number;
  current_stage_label?: string;
  panels_count: number;
  video_url?: string;
  webtoon_strip_urls?: string[];
}

interface SeriesData {
  id: string;
  title: string;
  genre: string;
  medium_type: "anime" | "manhwa" | "comic";
  total_chapters: number;
  synopsis?: string;
  chapters: ChapterItem[];
}

export default function SeriesDashboardPage() {
  const seriesId = window.location.pathname.split("/series/")[1]?.split("/")[0] || "";
  const [series, setSeries] = useState<SeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSeries = async () => {
    if (!seriesId) return;
    try {
      const res = await fetch(`/api/v1/series/${seriesId}`);
      if (!res.ok) throw new Error("Failed to load series data");
      const data = await res.json();
      if (data.series) {
        setSeries(data.series);
      }
    } catch (err: any) {
      console.error("Series fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [seriesId]);

  // Real-time polling every 3 seconds while chapters are processing
  useEffect(() => {
    if (!series) return;
    const hasActive = series.chapters.some(
      (c) => c.status !== "ready" && c.status !== "failed"
    );
    if (!hasActive) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/series/${seriesId}/chapters`);
        if (res.ok) {
          const data = await res.json();
          if (data.chapters) {
            setSeries((prev) => (prev ? { ...prev, chapters: data.chapters } : null));
          }
        }
      } catch (err) {
        console.debug("Chapters poll error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [series, seriesId]);

  const handleBack = () => {
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") nav("/dashboard");
    else window.location.href = "/dashboard";
  };

  const handleOpenChapter = (chapter: ChapterItem) => {
    const nav = (window as any).navigateTo;
    if (series?.medium_type === "anime" && chapter.video_url) {
      if (typeof nav === "function") {
        nav(`/editor?project=${chapter.id}`);
      } else {
        window.location.href = `/editor?project=${chapter.id}`;
      }
    } else {
      if (typeof nav === "function") {
        nav(`/scraper/editor/series/${seriesId}/chapters/${chapter.id}`);
      } else {
        window.location.href = `/scraper/editor/series/${seriesId}/chapters/${chapter.id}`;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-xl font-bold text-neutral-200">Series Not Found</h2>
        <p className="text-sm text-neutral-500 mt-2">The requested series session could not be located.</p>
        <button
          onClick={handleBack}
          className="mt-6 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const completedCount = series.chapters.filter((c) => c.status === "ready").length;
  const overallProgress = Math.round((completedCount / Math.max(1, series.total_chapters)) * 100);
  const chapter1Ready = series.chapters.find((c) => c.chapter_number === 1)?.status === "ready";

  return (
    <div className="w-full flex-1 flex flex-col text-neutral-100 max-w-6xl mx-auto py-6 px-4 sm:px-6 text-left animate-fade-in space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO DASHBOARD</span>
        </button>

        <button
          onClick={() => {
            setIsRefreshing(true);
            fetchSeries();
          }}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Series Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                {series.medium_type === "anime" && <Film className="w-3.5 h-3.5" />}
                {series.medium_type === "manhwa" && <Layers className="w-3.5 h-3.5" />}
                {series.medium_type === "comic" && <BookOpen className="w-3.5 h-3.5" />}
                <span>{series.medium_type.toUpperCase()} SERIES</span>
              </span>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-neutral-800 text-neutral-300">
                {series.genre.replace("_", " ").toUpperCase()}
              </span>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-neutral-800 text-neutral-300">
                {series.total_chapters} CHAPTERS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {series.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {series.synopsis || "Full AI-generated seasonal storyline."}
            </p>
          </div>

          {/* Quick Action Button */}
          {chapter1Ready && (
            <button
              onClick={() => handleOpenChapter(series.chapters[0])}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2.5 transition-all cursor-pointer shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {series.medium_type === "anime" ? "Watch Episode 1" : "Read Chapter 1"}
              </span>
            </button>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="mt-8 pt-6 border-t border-neutral-800/60 flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>SERIES PRODUCTION PROGRESS</span>
              <span className="text-indigo-400 font-bold">{completedCount} / {series.total_chapters} READY ({overallProgress}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Sessions Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 font-mono">
          Episode & Chapter Sessions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {series.chapters.map((chapter) => {
            const isReady = chapter.status === "ready";
            const isProcessing = chapter.status !== "ready" && chapter.status !== "pending";

            return (
              <div
                key={chapter.id}
                className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                  isReady
                    ? "bg-neutral-900/90 border-neutral-800 hover:border-neutral-700"
                    : isProcessing
                    ? "bg-indigo-950/20 border-indigo-500/40 shadow-lg shadow-indigo-500/5"
                    : "bg-neutral-950/60 border-neutral-900 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-neutral-400">
                      EPISODE #{chapter.chapter_number}
                    </span>

                    {/* Status Badges */}
                    {isReady && (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>READY</span>
                      </span>
                    )}

                    {isProcessing && (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{Math.round(chapter.progress_percent)}%</span>
                      </span>
                    )}

                    {!isReady && !isProcessing && (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>QUEUED</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white leading-snug">
                    {chapter.title}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {chapter.synopsis || "Storyline outline in progress..."}
                  </p>
                </div>

                {/* Bottom Action / Stage info */}
                <div className="mt-4 pt-4 border-t border-neutral-800/40 flex items-center justify-between">
                  {isReady ? (
                    <button
                      onClick={() => handleOpenChapter(chapter)}
                      className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {series.medium_type === "anime" ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
                          <span>Watch Episode</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-purple-400" />
                          <span>Read Chapter</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                      {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />}
                      <span>{chapter.current_stage_label || "Waiting in background pipeline..."}</span>
                    </div>
                  )}

                  {isReady && chapter.video_url && (
                    <span className="text-[10px] font-mono text-neutral-500">1080p MP4</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
