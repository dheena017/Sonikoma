import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Film,
  Scissors,
  Plus,
  Video,
  Play,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { getSourceName } from "../utils.js";

interface Project {
  project_id: string;
  title: string;
  url: string;
  created_at: string;
  status: string;
  panels_count: number;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("anivox_token") ||
              sessionStorage.getItem("anivox_token") ||
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

  const handleNewProject = () => {
    (window as any).navigateTo?.("/workspace");
  };

  const handleOpenProject = (id: string) => {
    (window as any).navigateTo?.(`/workspace?id=${id}`);
  };

  const completedCount = projects.filter(
    (p) => p.status?.toLowerCase() === "completed"
  ).length;
  const processingCount = projects.filter(
    (p) => p.status?.toLowerCase() === "processing"
  ).length;
  const totalPanels = projects.reduce(
    (acc, p) => acc + (p.panels_count || 0),
    0
  );

  return (
    <div className="w-full min-h-full bg-[#070709] text-neutral-100 flex flex-col pt-10 px-6 sm:px-12 md:px-20 lg:px-32 animate-fade-in relative z-10">
      {/* HEADER SECTION */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
              Dashboard
            </span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base font-mono max-w-xl">
            Your command center for converting webtoons to stunning narrated
            videos. Manage projects, track AI pipeline progress, and start new
            conversions.
          </p>
        </div>

        <div className="flex shrink-0">
          <button
            onClick={handleNewProject}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-1"
          >
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-12">
        <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Film className="h-32 w-32" />
          </div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">
            Total Projects
          </p>
          <div className="text-4xl font-black text-white">
            {projects.length}
          </div>
        </div>

        <div className="bg-[#0b0b0e]/80 border border-emerald-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
            <Video className="h-32 w-32" />
          </div>
          <p className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mb-1">
            Completed
          </p>
          <div className="text-4xl font-black text-white">{completedCount}</div>
        </div>

        <div className="bg-[#0b0b0e]/80 border border-amber-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
            <Loader2 className="h-32 w-32" />
          </div>
          <p className="text-xs font-bold text-amber-500/70 uppercase tracking-widest mb-1">
            Processing
          </p>
          <div className="text-4xl font-black text-white">
            {processingCount}
          </div>
        </div>

        <div className="bg-[#0b0b0e]/80 border border-indigo-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-indigo-500">
            <Scissors className="h-32 w-32" />
          </div>
          <p className="text-xs font-bold text-indigo-500/70 uppercase tracking-widest mb-1">
            Total Panels
          </p>
          <div className="text-4xl font-black text-white">{totalPanels}</div>
        </div>
      </div>

      {/* RECENT PROJECTS */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-purple-400" />
            Recent Projects
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
              <Film className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              No projects yet
            </h3>
            <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
              You haven't created any storyboard projects yet. Start by scraping
              a webtoon URL!
            </p>
            <button
              onClick={handleNewProject}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all"
            >
              Start New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.slice(0, 9).map((project) => (
              <div
                key={project.project_id}
                onClick={() => handleOpenProject(project.project_id)}
                className="bg-[#0b0b0e]/80 border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 cursor-pointer transition-all hover:bg-neutral-900/80 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/10 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-900/20 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Film className="h-6 w-6" />
                  </div>
                  <div
                    className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg border ${
                      project.status?.toLowerCase() === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : project.status?.toLowerCase() === "processing"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                        : "bg-neutral-800/50 text-neutral-400 border-white/5"
                    }`}
                  >
                    {project.status || "Draft"}
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
                  {project.title || "Untitled Project"}
                </h3>
                <p className="text-[10px] text-neutral-500 font-mono mb-4 flex items-center gap-1.5">
                  <span>
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{getSourceName(project.url)}</span>
                </p>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
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
