import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Film,
  FolderOpen,
  Loader2,
  ArrowRight,
  Plus,
  Search,
  Filter,
  BarChart2,
  CheckCircle2,
  FileVideo,
  LayoutGrid,
  List,
  MoreVertical,
  Trash2,
  Link,
  Square,
  CheckSquare,
  X,
  Activity,
  Play,
  Scissors,
  ExternalLink,
  Edit2,
  Download,
} from "lucide-react";
import { getSourceName, getSourceIcon, getProxiedImageUrl } from "../utils.js";
import * as api from "../api/index.js";
import ProjectCard from "./ProjectCard";

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
  episode?: string | number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters, Sorting, and Selection State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null
  );

  const saveProjectName = useCallback(async (projectId: string, newName: string) => {
    if (!newName.trim()) {
      setRenamingProjectId(null);
      return;
    }

    console.log(`Renaming project ${projectId} to ${newName}`);
    setRenamingProjectId(null);
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("sonikoma_token") ||
            sessionStorage.getItem("sonikoma_token") ||
            ""
          }`,
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch projects (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch projects", err);
      setError(
        err.message || "An unexpected error occurred while loading projects."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleNewSeries = () => {
    (window as any).navigateTo?.("/workspace");
  };

  const handleOpenProject = (project: Project) => {
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/workspace/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
      );
    } else {
      (window as any).navigateTo?.(`/workspace?id=${project.project_id}`);
    }
  };

  const handleExport = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    (window as any).navigateTo?.(
      `/workspace?id=${project.project_id}&action=export`
    );
  };

  const handleRename = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setRenamingProjectId(project.project_id);
  };

  const handleOpenDetails = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/workspace/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
      );
    } else {
      (window as any).navigateTo?.(`/workspace?id=${project.project_id}`);
    }
  };

  const handleCopyLink = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const url = project.series_slug && project.chapter_slug
      ? `${window.location.origin}/workspace/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
      : `${window.location.origin}/workspace?id=${project.project_id}`;
    navigator.clipboard.writeText(url);
    (window as any).alertAsync?.(
      "Link copied to clipboard!",
      "Success",
      "emerald"
    );
    setOpenMenuId(null);
  };

  const handleDeleteSingle = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId(null);

    if (
      await (window as any).confirmAsync?.(
        "Are you sure you want to permanently delete this project? This action cannot be undone.",
        "Delete Project",
        "rose"
      )
    ) {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token") ||
              ""
            }`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setProjects(projects.filter((p) => p.project_id !== projectId));
          setSelectedProjects((prev) => {
            const next = new Set(prev);
            next.delete(projectId);
            return next;
          });
          (window as any).alertAsync?.(
            "Project deleted successfully.",
            "Deleted"
          );
        } else {
          throw new Error(data.detail || "Failed to delete");
        }
      } catch (err: any) {
        (window as any).alertAsync?.(
          err.message || "Failed to delete project.",
          "Error",
          "rose"
        );
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) return;

    if (
      await (window as any).confirmAsync?.(
        `Are you sure you want to delete ${selectedProjects.size} selected projects? This action cannot be undone.`,
        "Bulk Delete",
        "rose"
      )
    ) {
      try {
        const res = await fetch(`/api/projects/batch-delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("sonikoma_token") ||
              sessionStorage.getItem("sonikoma_token") ||
              ""
            }`,
          },
          body: JSON.stringify({ project_ids: Array.from(selectedProjects) }),
        });
        const data = await res.json();
        if (data.success) {
          setProjects(
            projects.filter((p) => !selectedProjects.has(p.project_id))
          );
          setSelectedProjects(new Set());
          (window as any).alertAsync?.(
            `Successfully deleted ${data.deleted_count} projects.`,
            "Deleted"
          );
        } else {
          throw new Error(data.detail || "Failed to batch delete");
        }
      } catch (err: any) {
        (window as any).alertAsync?.(
          err.message || "Failed to delete projects.",
          "Error",
          "rose"
        );
      }
    }
  };

  const toggleSelection = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const toggleMenu = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === projectId ? null : projectId);
  };

  // Compute Stats
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.status?.toLowerCase() === "completed"
    ).length;
    const totalPanels = projects.reduce(
      (acc, p) => acc + (p.panels_count || 0),
      0
    );
    return { totalProjects, completedProjects, totalPanels };
  }, [projects]);

  // Extract unique genres for the filter
  const uniqueGenres = useMemo(() => {
    const genres = projects.map((p) => p.genre).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(genres))];
  }, [projects]);

  // Filter and Sort logic
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.author || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter(
        (p) =>
          (p.status || "Draft").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Genre filter
    if (genreFilter !== "All") {
      result = result.filter((p) => p.genre === genreFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "Newest")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sortBy === "Oldest")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      if (sortBy === "Most Panels")
        return (b.panels_count || 0) - (a.panels_count || 0);
      if (sortBy === "A-Z") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

    return result;
  }, [projects, searchQuery, statusFilter, genreFilter, sortBy]);

  const toggleSelectAll = () => {
    if (
      selectedProjects.size === filteredProjects.length &&
      filteredProjects.length > 0
    ) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map((p) => p.project_id)));
    }
  };

  return (
    <div className="w-full min-h-full bg-[#070709] text-neutral-100 flex flex-col pt-10 px-6 sm:px-12 md:px-20 lg:px-32 animate-fade-in relative z-10 pb-32">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
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

      {/* STATS BANNER */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.totalProjects}
              </div>
              <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                Total Projects
              </div>
            </div>
          </div>
          <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.completedProjects}
              </div>
              <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                Completed
              </div>
            </div>
          </div>
          <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.totalPanels.toLocaleString()}
              </div>
              <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                Total Panels
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS TABS */}
      {!loading && projects.length > 0 && (
        <div className="flex border-b border-neutral-800 mb-6">
          {["All", "Completed", "Processing", "Draft"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
                statusFilter === tab
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-neutral-500 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
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
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none cursor-pointer w-full"
              >
                {uniqueGenres.map((g) => (
                  <option key={g} value={g}>
                    {g === "All" ? "All Genres" : g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#111115] border border-neutral-700 rounded-lg px-3 py-2">
              <span className="text-neutral-500 text-sm">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none cursor-pointer w-full"
              >
                <option value="Newest">Newest First</option>
                <option value="Oldest">Oldest First</option>
                <option value="Most Panels">Most Panels</option>
                <option value="A-Z">Title (A-Z)</option>
              </select>
            </div>

            <div className="flex items-center bg-[#111115] border border-neutral-700 rounded-lg overflow-hidden ml-auto lg:ml-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid"
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
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
        ) : error ? (
          <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 rounded-3xl bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
              <Activity className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Failed to load projects
            </h3>
            <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
              {error}
            </p>
            <button
              onClick={() => fetchProjects()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all cursor-pointer"
            >
              Retry Connection
            </button>
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
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto bg-neutral-900 rounded-full flex items-center justify-center text-neutral-600 mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              No projects found
            </h3>
            <p className="text-neutral-500">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => {
              const isSelected = selectedProjects.has(project.project_id);
              const isProcessing =
                project.status?.toLowerCase() === "processing" ||
                project.status?.toLowerCase() === "exporting";
              const SourceIcon = getSourceIcon?.(project.url) || ExternalLink;

              return (
                <ProjectCard
                  key={project.project_id}
                  project={project}
                  onOpenProject={handleOpenProject}
                  onRename={(e, projectItem) => handleRename(e, projectItem)}
                  onExport={(e, projectItem) => handleExport(e, projectItem)}
                  onOpenDetails={(e, projectItem) => handleOpenDetails(e, projectItem)}
                  onDelete={(e, projectId) => handleDeleteSingle(e, projectId)}
                  onCopyLink={(e, projectItem) => handleCopyLink(e, projectItem)}
                  isSelected={isSelected}
                  onToggleSelect={(e, projectId) => toggleSelection(e, projectId)}
                  showSelection
                  openMenuId={openMenuId}
                  onToggleMenu={(e, projectId) => toggleMenu(e, projectId)}
                  renamingProjectId={renamingProjectId}
                  onSaveRename={(projectId, newName) =>
                    saveProjectName(projectId, newName)
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto bg-[#111115] border border-neutral-800 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1c1c21] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="hover:text-white transition-colors"
                    >
                      {selectedProjects.size === filteredProjects.length &&
                      filteredProjects.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Genre</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Panels</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjects.has(project.project_id);
                  const isProcessing =
                    project.status?.toLowerCase() === "processing" ||
                    project.status?.toLowerCase() === "exporting";
                  const SourceIcon =
                    getSourceIcon?.(project.url) || ExternalLink;

                  return (
                    <tr
                      key={project.project_id}
                      onClick={() => handleOpenProject(project)}
                      className={`group cursor-pointer transition-colors relative ${
                        isSelected
                          ? "bg-purple-900/10 hover:bg-purple-900/20"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) =>
                            toggleSelection(e, project.project_id)
                          }
                          className={`transition-colors ${
                            isSelected
                              ? "text-purple-400"
                              : "text-neutral-600 hover:text-white"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-neutral-900 overflow-hidden relative border border-neutral-800">
                            {project.cover_image ? (
                              <img
                                src={getProxiedImageUrl(project.cover_image)}
                                alt={project.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FolderOpen className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-700" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                              {project.title || "Untitled Series"}
                              <SourceIcon className="h-3 w-3 text-neutral-600" />
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                              {project.episode !== undefined &&
                              project.episode !== null
                                ? `EP ${project.episode} • `
                                : ""}
                              {project.author || "Unknown"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                          <div
                            className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border self-start ${
                              project.status?.toLowerCase() === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : project.status?.toLowerCase() === "processing"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                                : "bg-neutral-800 text-neutral-400 border-neutral-700"
                            }`}
                          >
                            {project.status || "Draft"}
                          </div>
                          {isProcessing && (
                            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-purple-500 animate-shimmer"
                                style={{
                                  width: "100%",
                                  backgroundSize: "200% 100%",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-neutral-400">
                        {project.genre || "-"}
                      </td>
                      <td className="p-4 text-neutral-400 font-mono text-xs">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-bold text-white">
                          {project.panels_count || 0}
                        </div>
                      </td>
                      <td className="p-4 relative">
                        <button
                          onClick={(e) => toggleMenu(e, project.project_id)}
                          className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openMenuId === project.project_id && (
                          <div className="absolute right-8 top-10 w-40 bg-[#16161b] border border-white/10 rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in duration-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProject(project);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                            >
                              <Play className="w-3.5 h-3.5" /> Resume
                            </button>
                            <button
                              onClick={(e) => handleOpenDetails(e, project)}
                              className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                            >
                              <FolderOpen className="w-3.5 h-3.5" /> Details
                            </button>
                            <button
                              onClick={(e) => handleRename(e, project)}
                              className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                            >
                              <Edit2 className="h-3.5 h-3.5" /> Rename
                            </button>
                            <button
                              onClick={(e) => handleExport(e, project)}
                              className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                            >
                              <Download className="h-3.5 h-3.5" /> Export
                            </button>
                            <button
                              onClick={(e) => handleCopyLink(e, project)}
                              className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                            >
                              <Link className="w-3.5 h-3.5" /> Copy Link
                            </button>
                            <div className="h-px bg-white/5 my-1"></div>
                            <button
                              onClick={(e) =>
                                handleDeleteSingle(e, project.project_id)
                              }
                              className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BULK ACTION FOOTER */}
      {selectedProjects.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-900/90 to-[#0b0b0e]/95 backdrop-blur-xl border border-purple-500/50 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-purple-900/40">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                {selectedProjects.size}
              </div>
              <div className="text-white font-medium">projects selected</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedProjects(new Set())}
                className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-900/50 transition-all active:scale-95 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
