import React, { useEffect, useState, useMemo } from "react";
import { Film, FolderOpen, Loader2, ArrowRight, Plus, Search, Filter, BarChart2, CheckCircle2, FileVideo, LayoutGrid, List } from "lucide-react";
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
  genre?: string;
  author?: string;
  cover_image?: string;
  synopsis?: string;
  episode?: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      (window as any).navigateTo?.(
        `/series/${project.series_slug}/chapters/${project.chapter_slug}/details`
      );
    } else {
      (window as any).navigateTo?.(`/workspace?id=${project.project_id}`);
    }
  };

  // Compute Stats
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status?.toLowerCase() === "completed").length;
    const totalPanels = projects.reduce((acc, p) => acc + (p.panels_count || 0), 0);
    return { totalProjects, completedProjects, totalPanels };
  }, [projects]);

  // Extract unique genres for the filter
  const uniqueGenres = useMemo(() => {
    const genres = projects.map(p => p.genre).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(genres))];
  }, [projects]);

  // Filter and Sort logic
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.title || "").toLowerCase().includes(q) || 
        (p.author || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter(p => (p.status || "Draft").toLowerCase() === statusFilter.toLowerCase());
    }

    // Genre filter
    if (genreFilter !== "All") {
      result = result.filter(p => p.genre === genreFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "Newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "Oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "Most Panels") return (b.panels_count || 0) - (a.panels_count || 0);
      if (sortBy === "A-Z") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

    return result;
  }, [projects, searchQuery, statusFilter, genreFilter, sortBy]);

  return (
    <div className="w-full min-h-full bg-[#070709] text-neutral-100 flex flex-col pt-10 px-6 sm:px-12 md:px-20 lg:px-32 animate-fade-in relative z-10 pb-20">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3 flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-purple-400" />
            Projects
          </h1>
          <p className="text-neutral-400 text-sm font-mono max-w-xl">
            Browse and manage all of your Webtoon-to-Video series and storyboard projects.
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

      {/* STATS BANNER */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg"><Film className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
              <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Total Projects</div>
            </div>
          </div>
          <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.completedProjects}</div>
              <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Completed</div>
            </div>
          </div>
          <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><BarChart2 className="w-6 h-6" /></div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalPanels.toLocaleString()}</div>
              <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Total Panels</div>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS SECTION */}
      {!loading && projects.length > 0 && (
        <div className="bg-[#0b0b0e] border border-neutral-800 rounded-xl p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-0 z-20">
          <div className="flex-1 w-full relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search by title or author..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111115] border border-neutral-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-[#111115] border border-neutral-700 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-white text-sm focus:outline-none cursor-pointer">
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#111115] border border-neutral-700 rounded-lg px-3 py-2">
              <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="bg-transparent text-white text-sm focus:outline-none cursor-pointer">
                {uniqueGenres.map(g => (
                  <option key={g} value={g}>{g === "All" ? "All Genres" : g}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#111115] border border-neutral-700 rounded-lg px-3 py-2">
              <span className="text-neutral-500 text-sm">Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-white text-sm focus:outline-none cursor-pointer">
                <option value="Newest">Newest First</option>
                <option value="Oldest">Oldest First</option>
                <option value="Most Panels">Most Panels</option>
                <option value="A-Z">Title (A-Z)</option>
              </select>
            </div>

            <div className="flex items-center bg-[#111115] border border-neutral-700 rounded-lg overflow-hidden ml-auto lg:ml-2">
              <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-purple-500/20 text-purple-400" : "text-neutral-500 hover:text-white"}`}>
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-purple-500/20 text-purple-400" : "text-neutral-500 hover:text-white"}`}>
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

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
              You haven't created any storyboard series yet. Start by scraping a webtoon URL!
            </p>
            <button
              onClick={handleNewSeries}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all cursor-pointer"
            >
              Start New Series
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto bg-neutral-900 rounded-full flex items-center justify-center text-neutral-600 mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
            <p className="text-neutral-500">Try adjusting your filters or search query.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.project_id}
                onClick={() => handleOpenProject(project)}
                className="bg-[#111115] border border-neutral-800 hover:border-purple-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/20 group flex flex-col h-full"
              >
                {/* Cover Image Header */}
                <div className="relative h-48 w-full bg-neutral-900 overflow-hidden">
                  {project.cover_image ? (
                    <>
                      <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111115] via-[#111115]/50 to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 bg-neutral-900/50">
                      <FolderOpen className="w-12 h-12 mb-2 opacity-50" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border backdrop-blur-md ${
                      project.status?.toLowerCase() === "completed"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : project.status?.toLowerCase() === "processing"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse"
                        : "bg-black/40 text-neutral-300 border-white/20"
                    }`}>
                      {project.status || "Draft"}
                    </div>
                  </div>

                  {/* Episode Badge */}
                  {project.episode !== undefined && project.episode !== null && (
                    <div className="absolute top-4 left-4">
                      <div className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-bold text-white tracking-wider">
                        EP {project.episode}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Body */}
                <div className="p-5 flex flex-col flex-1 relative z-10 -mt-8">
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors drop-shadow-md">
                    {project.title || "Untitled Series"}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {project.genre && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">
                        {project.genre}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400 line-clamp-1">{project.author || "Unknown Author"}</span>
                  </div>

                  {project.synopsis && (
                    <p className="text-xs text-neutral-500 line-clamp-2 mb-4 flex-1">
                      {project.synopsis}
                    </p>
                  )}

                  <div className="mt-auto">
                    <p className="text-[10px] text-neutral-600 font-mono mb-3">
                      {new Date(project.created_at).toLocaleDateString()} • {getSourceName(project.url)}
                    </p>
                    <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
                      <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                        <FileVideo className="w-4 h-4 text-neutral-500" />
                        <span className="text-white font-bold">{project.panels_count || 0}</span> panels
                      </div>
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredProjects.map((project) => (
              <div 
                key={project.project_id}
                onClick={() => handleOpenProject(project)}
                className="bg-[#111115] border border-neutral-800 hover:border-purple-500/50 rounded-xl p-4 flex items-center gap-6 cursor-pointer group transition-colors"
              >
                <div className="w-16 h-16 shrink-0 rounded-lg bg-neutral-900 overflow-hidden relative border border-neutral-800">
                  {project.cover_image ? (
                    <img src={project.cover_image} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <FolderOpen className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-700" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                      {project.title || "Untitled Series"}
                    </h3>
                    <div className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${
                      project.status?.toLowerCase() === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      project.status?.toLowerCase() === "processing" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-neutral-800 text-neutral-400 border-neutral-700"
                    }`}>
                      {project.status || "Draft"}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    {project.episode && <span>Episode {project.episode}</span>}
                    {project.genre && <span className="text-purple-400">{project.genre}</span>}
                    <span className="font-mono">{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-6 text-sm">
                  <div className="text-neutral-400 text-right">
                    <div className="font-bold text-white">{project.panels_count || 0}</div>
                    <div className="text-xs">panels</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
