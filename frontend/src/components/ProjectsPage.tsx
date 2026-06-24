import React, { useEffect, useState } from "react";
import { Film, FolderOpen, Loader2, ArrowRight, Plus } from "lucide-react";
import { getSourceName } from "../utils.js";

interface Project {
  project_id: string;
  title: string;
  url: string;
  created_at: string;
  status: string;
  panels_count: number;
  series_slug?: string;
  chapter_slug?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token") ||
              ""
            }`,
          },
        });
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleNewSeries = () => {
    (window as any).navigateTo?.("/workspace");
  };

  const handleOpenProject = (project: Project) => {
    if (project.series_slug && project.chapter_slug) {
      // Navigate using slug-based URL → opens the chapter details page
      (window as any).navigateTo?.(
        `/series/${project.series_slug}/chapters/${project.chapter_slug}/details`
      );
    } else {
      // Fallback: open in workspace editor by project ID
      (window as any).navigateTo?.(`/workspace?id=${project.project_id}`);
    }
  };

  return (
    <div className="w-full min-h-full bg-[#070709] text-neutral-100 flex flex-col pt-10 px-6 sm:px-12 md:px-20 lg:px-32 animate-fade-in relative z-10 pb-20">
      {/* HEADER SECTION */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3 flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-purple-400" />
            Projects
          </h1>
          <p className="text-neutral-400 text-sm font-mono max-w-xl">
            Browse and manage all of your Webtoon-to-Video series and storyboard
            projects.
          </p>
        </div>

        <div className="flex shrink-0">
          <button
            onClick={handleNewSeries}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">New Series</span>
          </button>
        </div>
      </div>

      {/* CONTENT LAYOUT */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-20 text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
              <Film className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              No projects yet
            </h3>
            <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
              You haven't created any storyboard series yet. Start by scraping a
              webtoon URL!
            </p>
            <button
              onClick={handleNewSeries}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all cursor-pointer"
            >
              Start New Series
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((project) => (
              <div
                key={project.project_id}
                onClick={() => handleOpenProject(project)}
                className="bg-[#0b0b0e]/80 border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 cursor-pointer transition-all hover:bg-neutral-900/80 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/10 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-900/20 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Film className="h-6 w-6" />
                    </div>
                    <div
                      className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg border ${
                        project.status?.toLowerCase() === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : project.status?.toLowerCase() === "processing"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-neutral-800/50 text-neutral-400 border-white/5"
                      }`}
                    >
                      {project.status || "Draft"}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
                    {project.title || "Untitled Series"}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-mono mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                    <span>
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="truncate">
                      {getSourceName(project.url)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                  <div className="text-xs text-neutral-400 font-semibold">
                    <span className="text-white font-bold">
                      {project.panels_count || 0}
                    </span>{" "}
                    panels
                  </div>
                  <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold">
                    <span>Open</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
