import React from "react";
import {
  History,
  LayoutGrid,
  ChevronRight,
  Search,
  Trash2,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Download,
  List,
  X,
  Loader2,
  Play,
  Video,
  ExternalLink,
  Calendar,
} from "lucide-react";

interface ProfileProjectsTabProps {
  projects: any[];
  onNavigateHome: () => void;
  onBatchDelete: (ids: string[]) => void;
}

export default function ProfileProjectsTab({
  projects,
  onNavigateHome,
  onBatchDelete,
}: ProfileProjectsTabProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "Completed" | "Processing"
  >("all");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<
    "date-desc" | "date-asc" | "title-asc" | "title-desc"
  >("date-desc");
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  const [selectedProjectDetail, setSelectedProjectDetail] = React.useState<
    any | null
  >(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [drawerError, setDrawerError] = React.useState<string | null>(null);

  // Sort and Filter project entries
  const sortedAndFilteredProjects = React.useMemo(() => {
    const filtered = projects.filter((project) => {
      const matchesSearch = (project.title || "Untitled Project")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (project.status || "Completed").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "date-desc") {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      }
      if (sortBy === "date-asc") {
        return (
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
        );
      }
      if (sortBy === "title-asc") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "title-desc") {
        return (b.title || "").localeCompare(a.title || "");
      }
      return 0;
    });
  }, [projects, searchQuery, statusFilter, sortBy]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedAndFilteredProjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        sortedAndFilteredProjects.map(
          (p, idx) => p.project_id || idx.toString()
        )
      );
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    onBatchDelete(selectedIds);
    setSelectedIds([]);
  };

  const handleExportJSON = () => {
    const dataToExport = projects
      .map((p, idx) => ({
        ...p,
        export_id: p.project_id || idx.toString(),
      }))
      .filter(
        (p) => selectedIds.length === 0 || selectedIds.includes(p.export_id)
      );

    if (dataToExport.length === 0) {
      alert("No project data available to export.");
      return;
    }

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `storyboard_projects_export_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleViewDetails = async (projectId: string) => {
    setIsLoadingDetail(true);
    setDrawerError(null);
    setIsDrawerOpen(true);
    try {
      const token = localStorage.getItem("anivox_token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/projects/${projectId}`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to fetch project details (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setSelectedProjectDetail(data);
      } else {
        throw new Error(data.message || "Failed to load project details");
      }
    } catch (err: any) {
      setDrawerError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(
      (p) => (p.status || "").toLowerCase() === "completed"
    ).length;
    const processing = projects.filter((p) =>
      ["processing", "pending"].includes((p.status || "").toLowerCase())
    ).length;
    const totalPanels = projects.reduce(
      (sum, p) => sum + (p.panels_count || 0),
      0
    );
    return { total, completed, processing, totalPanels };
  }, [projects]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-purple-400" />
          Storyboard Projects History
        </h2>

        {/* Search input widget */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all placeholder:text-neutral-700"
          />
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0c0c0e]/40 border border-white/5 hover:border-purple-500/20 backdrop-blur-md rounded-2xl p-4 transition-all duration-300 text-left shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Total Projects
            </span>
            <History className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">
            {stats.total}
          </div>
          <div className="text-[9px] text-neutral-600 font-semibold mt-1">
            Strips cataloged
          </div>
        </div>

        <div className="bg-[#0c0c0e]/40 border border-white/5 hover:border-emerald-500/20 backdrop-blur-md rounded-2xl p-4 transition-all duration-300 text-left shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Completed
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">
            {stats.completed}
          </div>
          <div className="text-[9px] text-emerald-400 font-semibold mt-1">
            Ready to download
          </div>
        </div>

        <div className="bg-[#0c0c0e]/40 border border-white/5 hover:border-amber-500/20 backdrop-blur-md rounded-2xl p-4 transition-all duration-300 text-left shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Processing
            </span>
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">
            {stats.processing}
          </div>
          <div className="text-[9px] text-amber-500/80 font-semibold mt-1">
            Active AI jobs
          </div>
        </div>

        <div className="bg-[#0c0c0e]/40 border border-white/5 hover:border-indigo-500/20 backdrop-blur-md rounded-2xl p-4 transition-all duration-300 text-left shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Total Panels
            </span>
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">
            {stats.totalPanels}
          </div>
          <div className="text-[9px] text-indigo-400/80 font-semibold mt-1">
            Segmented frames
          </div>
        </div>
      </div>

      {/* Filter and control options toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0d0d12]/75 backdrop-blur-md p-3 border border-white/10 rounded-2xl shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter("all")}
            className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95 border ${
              statusFilter === "all"
                ? "bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/10"
                : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setStatusFilter("Completed")}
            className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95 border ${
              statusFilter === "Completed"
                ? "bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/10"
                : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter("Processing")}
            className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95 border ${
              statusFilter === "Processing"
                ? "bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/10"
                : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
            }`}
          >
            Processing
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sorting Dropdown Wrapper */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl px-2.5 py-1.5 transition-all">
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 select-none">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-0 text-[10px] font-extrabold text-neutral-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-black/40 border border-white/5 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                  : "text-neutral-500 hover:text-neutral-300 border border-transparent"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                  : "text-neutral-500 hover:text-neutral-300 border border-transparent"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export to JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 py-1.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-500/30 hover:border-purple-400/50 rounded-xl text-[10px] font-extrabold transition-all duration-300 cursor-pointer shadow-md shadow-purple-950/20 active:scale-95"
            title="Export project data as JSON file"
          >
            <Download className="w-3.5 h-3.5 text-purple-200" />
            <span>Export JSON</span>
          </button>

          {sortedAndFilteredProjects.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="py-1.5 px-3 bg-neutral-900/40 hover:bg-neutral-800/60 border border-white/5 hover:border-white/10 text-neutral-400 hover:text-neutral-200 text-[10px] font-bold rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              {selectedIds.length === sortedAndFilteredProjects.length
                ? "Deselect All"
                : "Select All"}
            </button>
          )}
        </div>
      </div>

      {/* Batch action sticky bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs text-rose-400 animate-in slide-in-from-top-2 duration-300">
          <div className="font-bold flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span>
              Selected {selectedIds.length} projects for bulk operations
            </span>
          </div>
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white py-1 px-3.5 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Bulk Delete
          </button>
        </div>
      )}

      {/* Projects List/Grid view */}
      {sortedAndFilteredProjects.length === 0 ? (
        <div className="py-12 bg-neutral-900/10 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-neutral-400 text-sm font-bold">
              No matching projects found
            </p>
            <p className="text-neutral-500 text-xs max-w-xs font-semibold">
              Try refining your status filter or search queries above.
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="text-purple-400 font-bold text-xs hover:underline bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl cursor-pointer"
          >
            Scrape New Strip
          </button>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {sortedAndFilteredProjects.map((project, idx) => {
            const pId = project.project_id || idx.toString();
            const isChecked = selectedIds.includes(pId);

            return (
              <div
                key={pId}
                className={`group border p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                  isChecked
                    ? "bg-purple-900/10 border-purple-500/30"
                    : "bg-neutral-900/40 hover:bg-neutral-800/60 border-white/5"
                }`}
                onClick={() => handleViewDetails(pId)}
              >
                <div className="flex items-center gap-4">
                  {/* Select Checkbox indicator */}
                  <div
                    className="text-neutral-600 hover:text-purple-400 transition-colors shrink-0 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(pId);
                    }}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-700" />
                    )}
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-6 h-6 text-purple-400" />
                  </div>

                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                      {project.title || "Untitled Project"}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mt-0.5">
                      {project.status || "Completed"} •{" "}
                      {project.created_at || "2 hours ago"}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedAndFilteredProjects.map((project, idx) => {
            const pId = project.project_id || idx.toString();
            const isChecked = selectedIds.includes(pId);
            const isCompleted =
              (project.status || "").toLowerCase() === "completed";

            return (
              <div
                key={pId}
                className={`group border p-4 rounded-2xl flex flex-col justify-between transition-all cursor-pointer relative ${
                  isChecked
                    ? "bg-purple-900/10 border-purple-500/30"
                    : "bg-neutral-900/40 hover:bg-neutral-800/60 border-white/5"
                }`}
                onClick={() => handleViewDetails(pId)}
              >
                {/* Checkbox placement at top-right of grid card */}
                <div
                  className="absolute top-3 right-3 text-neutral-600 hover:text-purple-400 transition-colors p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(pId);
                  }}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-700" />
                  )}
                </div>

                <div className="space-y-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    {isCompleted ? (
                      <Video className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2 pr-4">
                      {project.title || "Untitled Project"}
                    </h4>
                    <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest mt-1">
                      {project.created_at || "Just now"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span
                    className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {project.status || "Pending"}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-bold">
                    {project.panels_count || 0} panels
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Side Drawer Panel */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden text-left">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#0d0d12]/95 border-l border-white/10 shadow-2xl relative flex flex-col transition-all duration-300">
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest">
                    Project Details
                  </h3>
                  <h2 className="text-base font-extrabold text-white line-clamp-1">
                    {selectedProjectDetail?.project?.title || "Loading..."}
                  </h2>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white hover:border-white/10 transition-all cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    <p className="text-xs text-neutral-500 font-semibold">
                      Retrieving storyboard components...
                    </p>
                  </div>
                ) : drawerError ? (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-2">
                    <p className="text-xs text-rose-400 font-bold">
                      Failed to load details
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {drawerError}
                    </p>
                  </div>
                ) : selectedProjectDetail ? (
                  <>
                    {/* Metadata Card */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                        <span className="text-neutral-500 font-bold">
                          Status:
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            (
                              selectedProjectDetail.project?.status || ""
                            ).toLowerCase() === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {selectedProjectDetail.project?.status || "Completed"}
                        </span>
                      </div>

                      {selectedProjectDetail.project?.genre && (
                        <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                          <span className="text-neutral-500 font-bold">
                            Genre:
                          </span>
                          <span className="text-neutral-300 font-semibold">
                            {selectedProjectDetail.project.genre}
                          </span>
                        </div>
                      )}

                      {selectedProjectDetail.project?.episode && (
                        <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                          <span className="text-neutral-500 font-bold">
                            Episode:
                          </span>
                          <span className="text-neutral-300 font-mono font-semibold">
                            {selectedProjectDetail.project.episode}
                          </span>
                        </div>
                      )}

                      {selectedProjectDetail.project?.created_at && (
                        <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                          <span className="text-neutral-500 font-bold">
                            Created At:
                          </span>
                          <span className="text-neutral-300 font-semibold">
                            {selectedProjectDetail.project.created_at}
                          </span>
                        </div>
                      )}

                      {selectedProjectDetail.project?.url && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 font-bold">
                            Source URL:
                          </span>
                          <a
                            href={selectedProjectDetail.project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:underline flex items-center gap-1 font-semibold truncate max-w-[200px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Source
                          </a>
                        </div>
                      )}
                    </div>

                    {/* HTML5 Video Preview */}
                    {selectedProjectDetail.project?.video_url && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 text-purple-400" />
                          Video Preview
                        </h4>
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black group">
                          <video
                            src={selectedProjectDetail.project.video_url}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Segmented Panels */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center justify-between">
                        <span>
                          Storyboard Frames (
                          {selectedProjectDetail.panels?.length || 0})
                        </span>
                      </h4>

                      {!selectedProjectDetail.panels ||
                      selectedProjectDetail.panels.length === 0 ? (
                        <p className="text-xs text-neutral-600 font-semibold italic text-center py-4 bg-black/10 border border-dashed border-white/5 rounded-xl">
                          No panels segmented for this project yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1 select-none">
                          {selectedProjectDetail.panels.map(
                            (panel: any, pIdx: number) => (
                              <div
                                key={pIdx}
                                className="bg-black/30 border border-white/5 hover:border-purple-500/20 rounded-xl p-2.5 transition-all space-y-2"
                              >
                                <div className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-black/60">
                                  <img
                                    src={panel.image_url}
                                    alt={`Panel ${pIdx + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[8px] font-black uppercase text-neutral-500 font-mono">
                                    Frame {pIdx + 1}
                                  </div>
                                  {panel.speech_text ? (
                                    <p className="text-[10px] text-neutral-300 font-medium line-clamp-3 italic leading-relaxed">
                                      "{panel.speech_text}"
                                    </p>
                                  ) : (
                                    <p className="text-[9px] text-neutral-600 font-medium italic">
                                      (No dialog detected)
                                    </p>
                                  )}
                                  {panel.sfx && (
                                    <div className="text-[8px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded w-max mt-1">
                                      SFX: {panel.sfx}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-neutral-500 text-xs font-semibold">
                    Select a project to inspect panels.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
