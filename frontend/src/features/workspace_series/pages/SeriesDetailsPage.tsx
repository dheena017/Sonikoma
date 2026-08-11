import React, { useEffect, useState } from "react";
import { FolderOpen, ArrowLeft, Loader2, Plus, AlertCircle, Clock } from "lucide-react";
import { groupProjectsIntoSeries, Series } from "@/features/workspace_projects/utils/seriesGrouping";
import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";
import ProjectCard from "@/features/workspace_projects/components/ProjectCard";
import { useProjectsActions } from "@/features/workspace_projects/hooks";

interface SeriesDetailsPageProps {
  onNavigateHome: () => void;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: typeof fetch;
}

export default function SeriesDetailsPage({
  onNavigateHome,
  navigateTo,
  fetchWithInterceptor,
}: SeriesDetailsPageProps) {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seriesSlug = window.location.pathname.split("/projects/")[1]?.split("/")[0] || "";

  const actions = useProjectsActions();

  useEffect(() => {
    async function fetchSeriesDetails() {
      if (!seriesSlug) {
        setError("Invalid series URL.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetchWithInterceptor("/api/projects");
        if (!res.ok) {
          throw new Error("Failed to load projects");
        }
        const data = await res.json();
        const allProjects: Project[] = data.projects || [];

        const allSeries = groupProjectsIntoSeries(allProjects);

        const foundSeries = allSeries.find((s) => s.slug === seriesSlug || s.id === seriesSlug);

        if (foundSeries) {
          setSeries(foundSeries);
        } else {
          setError("Series not found.");
        }
      } catch (err: any) {
        console.error("Failed to fetch series details", err);
        setError(err.message || "An error occurred while loading series details.");
      } finally {
        setLoading(false);
      }
    }

    fetchSeriesDetails();
  }, [seriesSlug, fetchWithInterceptor]);

  const handleNewChapter = () => {
    if (series) {
        // Ideally we can pass a series context so the scraper creates it under this series
        navigateTo(`/scraper?series_slug=${encodeURIComponent(series.slug)}`);
    } else {
        navigateTo("/scraper");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full pt-32 text-neutral-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading series...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32">
        <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Unable to load this series.</h3>
        <p className="text-neutral-400 mb-6 font-mono max-w-md text-center">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-all"
          >
            Retry
          </button>
          <button
            onClick={() => navigateTo("/projects")}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-neutral-955 text-neutral-100 flex flex-col pt-6 px-4 md:px-8 lg:px-12 pb-32 animate-fade-in relative z-10">

      {/* Back button */}
      <button
        onClick={() => navigateTo("/projects")}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-bold">Back to Projects</span>
      </button>

      {/* Series Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
        {/* Cover */}
        <div className="w-48 h-64 md:w-64 md:h-80 shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl relative">
          {series.cover ? (
             <img src={series.cover} alt={series.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-950/20 via-neutral-900 to-neutral-950">
              <FolderOpen className="w-12 h-12 text-purple-500/40" />
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-[0.2em]">No Cover</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4 flex-1">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white line-clamp-2">
            {series.title}
          </h1>

          {series.synopsis && (
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed max-w-3xl line-clamp-3">
              {series.synopsis}
            </p>
          )}

          <div className="flex flex-wrap gap-4 items-center mt-2">
            <div className="flex items-center gap-2 bg-neutral-900 border border-white/5 px-4 py-2 rounded-xl text-sm font-bold">
              <span className="text-white">{series.chapterCount} Chapters</span>
            </div>

            <div className="flex items-center gap-2 text-neutral-400 text-sm font-mono">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Last updated: {series.latestUpdatedAt ? new Date(series.latestUpdatedAt).toLocaleDateString() : 'Recently'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Header + Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          Chapters
          <span className="text-sm font-mono bg-white/10 px-2.5 py-0.5 rounded-full text-neutral-300">
            {series.chapterCount}
          </span>
        </h2>

        <button
          onClick={handleNewChapter}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">New Chapter</span>
        </button>
      </div>

      {/* Chapters Grid */}
      {series.chapters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 stagger-container">
          {series.chapters.map((chapter) => (
            <ProjectCard
              key={chapter.project_id}
              project={chapter}
              onOpenProject={(p) => actions.handleOpenProject(p)}
              onRename={(e, p) => actions.handleRename(e, p, () => {})} // we might need local rename handling later
              onExport={(e, p) => actions.handleExport(e, p)}
              onOpenDetails={(e, p) => actions.handleOpenDetails(e, p)}
              onDelete={(e, pid) => actions.handleDeleteSingle(e, pid, () => {
                // local UI update after delete
                setSeries(prev => prev ? { ...prev, chapters: prev.chapters.filter(c => c.project_id !== pid) } : null);
              }, () => {})}
              onCopyLink={(e, p) => actions.handleCopyLink(e, p)}
            />
          ))}
        </div>
      ) : (
        <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-4">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No chapters yet</h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
            Create your first chapter to start editing this series.
          </p>
          <button
            onClick={handleNewChapter}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">New Chapter</span>
          </button>
        </div>
      )}
    </div>
  );
}
