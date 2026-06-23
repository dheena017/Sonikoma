import React from "react";
import {
  History,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
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
  Eye,
} from "lucide-react";
import { getSourceName } from "../../utils";

const parseEpisodeString = (epStr: string) => {
  if (!epStr) return { numberStr: "Chapter 1", titleStr: "" };
  const match = epStr.match(/^(Chapter\s+\d+)(?:\s*[-:]\s*(.*))?$/i);
  if (match) {
    return {
      numberStr: match[1],
      titleStr: match[2] ? match[2].trim() : "",
    };
  }
  return {
    numberStr: epStr,
    titleStr: "",
  };
};

interface ProfileProjectsTabProps {
  projects: any[];
  onNavigateHome: () => void;
  onBatchDelete: (ids: string[]) => void;
  onDeleteChapter: (id: string) => void;
  onDeleteSeries: (seriesId: string) => void;
  onRefreshProjects?: () => void;
}

export default function ProfileProjectsTab({
  projects,
  onNavigateHome,
  onBatchDelete,
  onDeleteChapter,
  onDeleteSeries,
  onRefreshProjects,
}: ProfileProjectsTabProps) {
  const importInputRef = React.useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "Completed" | "Processing"
  >("all");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<
    "date-desc" | "date-asc" | "title-asc" | "title-desc"
  >("date-desc");
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  const [expandedSeries, setExpandedSeries] = React.useState<
    Record<string, boolean>
  >({});

  const toggleSeries = (title: string) => {
    setExpandedSeries((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

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

  // Group the sorted and filtered projects by series title
  const groupedProjects = React.useMemo(() => {
    const groups: Record<
      string,
      { title: string; genre: string; series_id: string; chapters: any[] }
    > = {};

    sortedAndFilteredProjects.forEach((project) => {
      const seriesTitle = (project.title || "Untitled Comic").replace(
        /\s+[a-fA-F0-9]{8}$/,
        ""
      );
      if (!groups[seriesTitle]) {
        groups[seriesTitle] = {
          title: seriesTitle,
          genre: project.genre || "general",
          series_id: project.series_id,
          chapters: [],
        };
      }
      groups[seriesTitle].chapters.push(project);
    });

    return Object.values(groups);
  }, [sortedAndFilteredProjects]);

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

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmed = await confirm(
      `Are you sure you want to delete the ${selectedIds.length} selected project(s)?`
    );
    if (confirmed) {
      onBatchDelete(selectedIds);
      setSelectedIds([]);
    }
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

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result;
        if (typeof text !== "string") return;
        const parsed = JSON.parse(text);

        const token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        let imports: any[] = [];
        if (Array.isArray(parsed)) {
          imports = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (parsed.project) {
            imports = [parsed];
          } else {
            imports = [{ project: parsed, panels: [] }];
          }
        } else {
          throw new Error("Invalid backup JSON structure.");
        }

        let successCount = 0;
        for (const item of imports) {
          const proj = item.project || item;
          const panelsList = item.panels || [];

          if (!proj.project_id || !proj.url) {
            console.warn("Skipping invalid project entry:", item);
            continue;
          }

          const createBody = {
            project_id: proj.project_id,
            url: proj.url,
            title: proj.title || "Untitled Webtoon",
            genre: proj.genre || "general",
            episode: proj.episode || "",
            panels_count: panelsList.length || proj.panels_count || 0,
            video_url: proj.video_url || null,
            author: proj.author || null,
            cover_image: proj.cover_image || null,
            synopsis: proj.synopsis || null,
          };

          const createRes = await fetch("/api/projects", {
            method: "POST",
            headers,
            body: JSON.stringify(createBody),
          });

          if (!createRes.ok) {
            console.error(`Failed to create project ${proj.project_id}`);
            continue;
          }

          if (panelsList.length > 0) {
            const panelsBody = {
              panels: panelsList.map((p: any) => ({
                image_url: p.image_url || "",
                original_url: p.original_url || p.image_url || null,
                speech_text: p.speech_text || "",
                sfx: p.sfx || "",
                duration: p.duration || 0,
                motion_type: p.motion_type || "",
                visual_description: p.visual_description || null,
                brightness: p.brightness ?? null,
                contrast: p.contrast ?? null,
                saturation: p.saturation ?? null,
                grayscale: !!p.grayscale,
                filter_preset: p.filter_preset || null,
                bubble_method: p.bubble_method || null,
                bubble_sensitivity: p.bubble_sensitivity ?? null,
                bubble_dilation: p.bubble_dilation ?? null,
                inpaint_radius: p.inpaint_radius ?? null,
                detection_style: p.detection_style || null,
              })),
            };

            const panelsRes = await fetch(
              `/api/projects/${proj.project_id}/panels`,
              {
                method: "POST",
                headers,
                body: JSON.stringify(panelsBody),
              }
            );

            if (!panelsRes.ok) {
              console.error(
                `Failed to save panels for project ${proj.project_id}`
              );
            }
          }

          successCount++;
        }

        if (successCount > 0) {
          alert(`Successfully imported ${successCount} project(s)!`);
          if (onRefreshProjects) {
            onRefreshProjects();
          }
        } else {
          alert("No projects were successfully imported.");
        }
      } catch (err: any) {
        console.error("Failed to parse or import JSON:", err);
        alert(err.message || "Failed to import JSON.");
      } finally {
        if (e.target) {
          e.target.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const handleViewDetails = (project: any) => {
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/series/${project.series_slug}/chapters/${project.chapter_slug}/details`
      );
    } else if (project.chapter_slug) {
      (window as any).navigateTo?.(
        `/series/unknown/chapters/${project.chapter_slug}/details`
      );
    } else {
      (window as any).navigateTo?.(`/project-details?id=${project.project_id}`);
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
          {/* Import JSON Input */}
          <input
            type="file"
            ref={importInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-1.5 py-1.5 px-4 bg-[#0d0d12]/75 hover:bg-[#121217]/50 border border-purple-500/30 text-purple-300 hover:text-purple-200 rounded-xl text-[10px] font-extrabold transition-all duration-300 cursor-pointer shadow-md active:scale-95"
            title="Import project data from JSON file"
          >
            <Download className="w-3.5 h-3.5 text-purple-400 rotate-180" />
            <span>Import JSON</span>
          </button>

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
        <div className="space-y-4">
          {groupedProjects.map((group) => {
            const isExpanded = !!expandedSeries[group.title];
            const chapterCount = group.chapters.length;

            return (
              <div
                key={group.title}
                className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl overflow-hidden transition-all shadow-xl"
              >
                {/* Series Header Row */}
                <div
                  onClick={() => toggleSeries(group.title)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-base font-black text-white leading-tight">
                        {group.title}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mt-1">
                        {getSourceName(group.chapters[0]?.url)} • {group.genre}{" "}
                        • {chapterCount}{" "}
                        {chapterCount === 1 ? "Chapter" : "Chapters"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2.5 py-1 rounded-xl bg-neutral-900 border border-white/5 text-neutral-400 font-bold font-mono">
                      {chapterCount} {chapterCount === 1 ? "CH" : "CHS"}
                    </span>
                    {group.series_id && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirm =
                            (window as any).confirmAsync || window.confirm;
                          const confirmed = await confirm(
                            `Are you sure you want to delete the entire series "${group.title}" and all its chapters?`
                          );
                          if (confirmed) {
                            onDeleteSeries(group.series_id);
                          }
                        }}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl transition-all cursor-pointer"
                        title="Delete Series"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </div>

                {/* Chapters list under Series */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/20 p-4 space-y-2">
                    {group.chapters.map((chapter, cIdx) => {
                      const pId = chapter.project_id;
                      const isChecked = selectedIds.includes(pId);
                      const isChCompleted =
                        (chapter.status || "").toLowerCase() === "completed";
                      const { numberStr, titleStr } = parseEpisodeString(
                        chapter.episode || `Chapter #${cIdx + 1}`
                      );

                      return (
                        <div
                          key={pId}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all hover:bg-neutral-955/60 ${
                            isChecked
                              ? "bg-purple-900/10 border-purple-500/20"
                              : "bg-neutral-900/30 border-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <div
                              className="text-neutral-600 hover:text-purple-400 transition-colors shrink-0 p-1 cursor-pointer"
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

                            <div className="text-left">
                              <div className="flex flex-wrap items-baseline gap-1.5">
                                <span className="text-xs font-bold text-white leading-tight">
                                  {numberStr}
                                </span>
                                {titleStr && (
                                  <span className="text-[10px] text-neutral-400 font-semibold leading-tight">
                                    • {titleStr}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                    isChCompleted
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  }`}
                                >
                                  {chapter.status || "Pending"}
                                </span>
                                <span className="text-[9px] text-neutral-500 font-semibold font-mono">
                                  {chapter.created_at || "Just now"} • via{" "}
                                  {getSourceName(chapter.url)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-neutral-500 font-bold">
                              {chapter.panels_count || 0} panels
                            </span>
                            <button
                              onClick={async () => {
                                const confirm =
                                  (window as any).confirmAsync ||
                                  window.confirm;
                                const confirmed = await confirm(
                                  `Are you sure you want to delete ${numberStr}?`
                                );
                                if (confirmed) {
                                  onDeleteChapter(pId);
                                }
                              }}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl transition-all cursor-pointer active:scale-95"
                              title="Delete Chapter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(chapter)}
                              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-purple-400 hover:text-purple-300 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupedProjects.map((group) => {
            const isExpanded = !!expandedSeries[group.title];
            const chapterCount = group.chapters.length;

            return (
              <div
                key={group.title}
                className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl overflow-hidden transition-all shadow-xl flex flex-col justify-between"
              >
                {/* Series Content */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {group.series_id && (
                        <button
                          onClick={async () => {
                            const confirm =
                              (window as any).confirmAsync || window.confirm;
                            const confirmed = await confirm(
                              `Are you sure you want to delete the entire series "${group.title}" and all its chapters?`
                            );
                            if (confirmed) {
                              onDeleteSeries(group.series_id);
                            }
                          }}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-xl transition-all cursor-pointer"
                          title="Delete Series"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider">
                        {group.genre}
                      </span>
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <h4 className="text-base font-black text-white line-clamp-2 leading-tight">
                      {group.title}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold font-mono">
                      {getSourceName(group.chapters[0]?.url)} • {chapterCount}{" "}
                      {chapterCount === 1 ? "Chapter" : "Chapters"}
                    </p>
                  </div>
                </div>

                {/* Toggler Bar */}
                <div className="border-t border-white/5 bg-black/10">
                  <button
                    onClick={() => toggleSeries(group.title)}
                    className="w-full py-3 px-5 flex items-center justify-between text-xs font-bold text-neutral-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer select-none"
                  >
                    <span>
                      {isExpanded ? "Hide Chapters" : "Show Chapters"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Expanded chapters inside grid card */}
                  {isExpanded && (
                    <div className="p-4 bg-black/35 border-t border-white/5 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {group.chapters.map((chapter, cIdx) => {
                        const pId = chapter.project_id;
                        const isChecked = selectedIds.includes(pId);
                        const { numberStr, titleStr } = parseEpisodeString(
                          chapter.episode || `Chapter #${cIdx + 1}`
                        );

                        return (
                          <div
                            key={pId}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                              isChecked
                                ? "bg-purple-900/10 border-purple-500/20"
                                : "bg-neutral-900/30 border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {/* Checkbox */}
                              <div
                                className="text-neutral-600 hover:text-purple-400 transition-colors shrink-0 p-0.5 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(pId);
                                }}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-neutral-700" />
                                )}
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-white leading-tight">
                                  {numberStr}
                                </p>
                                {titleStr && (
                                  <p
                                    className="text-[9.5px] text-neutral-400 font-medium truncate max-w-[125px] mt-0.5"
                                    title={titleStr}
                                  >
                                    {titleStr}
                                  </p>
                                )}
                                <span className="text-[8px] text-neutral-500 font-semibold font-mono mt-0.5 block">
                                  {chapter.created_at || "Just now"} • via{" "}
                                  {getSourceName(chapter.url)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={async () => {
                                  const confirm =
                                    (window as any).confirmAsync ||
                                    window.confirm;
                                  const confirmed = await confirm(
                                    `Are you sure you want to delete ${numberStr}?`
                                  );
                                  if (confirmed) {
                                    onDeleteChapter(pId);
                                  }
                                }}
                                className="p-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 rounded-lg transition-all cursor-pointer"
                                title="Delete chapter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleViewDetails(chapter)}
                                className="p-1 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-lg text-purple-400 hover:text-purple-300 transition-all cursor-pointer"
                                title="View details"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
