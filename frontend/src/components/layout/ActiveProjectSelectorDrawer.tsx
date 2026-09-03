import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  X,
  Check,
  FolderOpen,
  Layers,
  Clock,
  Loader2,
  AlertTriangle,
  Sparkles,
  Zap,
  Star,
  Film,
  PlusCircle,
  Activity,
  ExternalLink,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { useThemeMode } from "@/shared/hooks/useThemeMode";
import { SonikomaLogo } from "@/shared/ui/branding";
import { getProxiedImageUrl, getSourceIcon, getSourceName } from "@/utils";
import { timeAgo } from "@/utils/dateUtils";

interface ProjectItem {
  project_id: string;
  title: string;
  series_slug?: string;
  chapter_slug?: string;
  cover_image?: string;
  first_panel_image?: string;
  url?: string;
  status?: string;
  panels_count?: number;
  panel_count?: number;
  imported_assets_count?: number;
  panels?: any[];
  updated_at?: string;
  created_at?: string;
  episode?: any;
  genre?: string;
  author?: string;
  [key: string]: any;
}

interface ActiveProjectSelectorDrawerProps {
  fetchWithInterceptor?: any;
  navigateTo?: (path: string) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export const ActiveProjectSelectorDrawer: React.FC<
  ActiveProjectSelectorDrawerProps
> = ({ fetchWithInterceptor, navigateTo }) => {
  const { themeMode } = useThemeMode();
  const {
    activeProjectId,
    activeProjectData,
    projectState,
    missingProjectInfo,
    isDrawerOpen,
    isDirty,
    setDrawerOpen,
    setActiveProjectId,
    hydrateActiveProject,
    clearActiveProject,
  } = useProjectStore();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "recent" | "draft" | "processing" | "completed" | "favorites"
  >("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "panels" | "title"
  >("newest");

  // Favorites management via localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("sonikoma_favorite_projects");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      try {
        localStorage.setItem(
          "sonikoma_favorite_projects",
          JSON.stringify(updated)
        );
      } catch {}
      return updated;
    });
  };

  // Unsaved changes confirmation modal state
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Fetch real project list when drawer opens
  useEffect(() => {
    if (!isDrawerOpen) return;

    let isMounted = true;
    const fetchProjectList = async () => {
      setLoading(true);
      try {
        const fetcher = fetchWithInterceptor || window.fetch;
        const token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token") ||
          "";

        const res = await fetcher("/api/projects", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const json = await res.json();
          const list =
            json.data || json.projects || (Array.isArray(json) ? json : []);
          if (isMounted) {
            setProjects(list);
          }
        }
      } catch (err) {
        console.error("Failed to fetch project list for drawer:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProjectList();
    return () => {
      isMounted = false;
    };
  }, [isDrawerOpen, fetchWithInterceptor]);

  // Real Filter & Sort projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) => {
      const titleMatch = (p.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const chapterMatch = (p.chapter_slug || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSearch = titleMatch || chapterMatch;

      if (!matchesSearch) return false;

      const status = (p.status || "ready").toLowerCase();
      if (activeTab === "favorites") return favorites.includes(p.project_id);
      if (activeTab === "recent") return true;
      if (activeTab === "draft") return status === "draft";
      if (activeTab === "processing") return status === "processing";
      if (activeTab === "completed")
        return status === "completed" || status === "ready";
      return true; // "all"
    });

    return result.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.created_at || b.updated_at || 0).getTime() -
          new Date(a.created_at || a.updated_at || 0).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at || a.updated_at || 0).getTime() -
          new Date(b.created_at || b.updated_at || 0).getTime()
        );
      }
      if (sortBy === "panels") {
        const countA = a.panels_count ?? a.panel_count ?? a.panels?.length ?? 0;
        const countB = b.panels_count ?? b.panel_count ?? b.panels?.length ?? 0;
        return countB - countA;
      }
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });
  }, [projects, searchQuery, activeTab, sortBy, favorites]);

  const executeActivation = async (id: string) => {
    setActiveProjectId(id);
    await hydrateActiveProject(id, fetchWithInterceptor);

    // Update URL query param
    const url = new URL(window.location.href);
    url.searchParams.set("project_id", id);
    window.history.replaceState({}, "", url.toString());

    setDrawerOpen(false);
  };

  const handleSelectProject = (id: string) => {
    if (id === activeProjectId) {
      setDrawerOpen(false);
      return;
    }

    if (isDirty) {
      setPendingProjectId(id);
      setShowConfirmModal(true);
    } else {
      executeActivation(id);
    }
  };

  const handleConfirmSwitch = () => {
    if (pendingProjectId) {
      executeActivation(pendingProjectId);
      setPendingProjectId(null);
    }
    setShowConfirmModal(false);
  };

  // Compute real metrics from active project data
  const activePanels = activeProjectData?.panels || [];
  const activeProjectObj = activeProjectData?.project;

  // Real panel count: use DB panels_count if panels array isn't loaded yet
  const activePanelsCount: number =
    activePanels.length > 0
      ? activePanels.length
      : activeProjectObj?.panels_count ?? 0;

  const activeDurationSeconds = activePanels.reduce(
    (acc: number, p: any) => acc + (p.duration || p.audio_duration || 3),
    0
  );
  const activeSpeechCount = activePanels.filter(
    (p: any) =>
      p.speech_text || p.narration_text || (p.dialogue && p.dialogue.length > 0)
  ).length;
  const activeAudioCount = activePanels.filter(
    (p: any) =>
      p.audio_url || p.narration_url || p.audio_path || p.generated_audio
  ).length;
  const activeProgressPct =
    activePanelsCount > 0
      ? Math.min(
          100,
          Math.round(
            ((activeSpeechCount + activeAudioCount) / (activePanelsCount * 2)) *
              100
          )
        )
      : 0;

  const activeCover =
    activeProjectObj?.cover_image ||
    activeProjectObj?.first_panel_image ||
    activePanels[0]?.image_url ||
    null;
  const ActiveSourceIcon = getSourceIcon(activeProjectObj?.url || "");
  const activeSourceName = getSourceName(activeProjectObj?.url || "");

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg h-full bg-[#141414] border-l border-[#2F2F2F] text-[#E5E5E5] shadow-2xl flex flex-col z-10 animate-fade-in">
        {/* ─── Website Logo & Header ─── */}
        <div className="p-4 border-b border-[#2F2F2F] flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-3.5">
            <SonikomaLogo
              size="sm"
              iconOnly={true}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#E5E5E5] font-sans tracking-tight">
                  Select Active Project
                </h3>
              </div>
              <p className="text-[11px] text-[#9CA3AF] font-sans leading-tight">
                Global workspace active context switcher
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {navigateTo && (
              <>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    navigateTo("/projects");
                  }}
                  className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  title="View All Projects Workspace"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="hidden sm:inline">All Projects</span>
                </button>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    navigateTo("/scraper");
                  }}
                  className="btn-primary px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wider"
                  title="Scrape Webtoon / New Project"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Project</span>
                </button>
              </>
            )}
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-xl text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#262626] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Global Project Context Banner (4 States: idle, loading, missing, active) ─── */}
        {(() => {
          if (
            projectState === "missing" ||
            (activeProjectId &&
              !activeProjectData &&
              !useProjectStore.getState().isHydrating)
          ) {
            const missingId =
              missingProjectInfo?.missingId || activeProjectId || "Unknown ID";
            const isJobId =
              missingProjectInfo?.isJobId || missingId.startsWith("job_");

            return (
              <div className="p-4 border-b border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-[#0d0e19] space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />{" "}
                    Project Unavailable
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 font-mono">
                    Missing 404
                  </span>
                </div>

                <div className="bg-[#1a121d] border border-rose-500/30 rounded-2xl p-3.5 space-y-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      {isJobId
                        ? `Processing Job ID "${missingId}"`
                        : `Requested Project ID "${missingId}"`}
                    </h4>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                      {isJobId
                        ? "This identifier is a processing job ID and is no longer associated with an active project record. The project selector chooses projects, not processing jobs."
                        : "The requested project could not be found or may have been deleted from the database."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {!isJobId && (
                      <button
                        onClick={() => {
                          hydrateActiveProject(missingId, fetchWithInterceptor);
                        }}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-bold transition-all border border-neutral-700 cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-neutral-300" />
                        <span>Retry Load</span>
                      </button>
                    )}

                    <button
                      onClick={() => clearActiveProject()}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all border border-rose-500/40 cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Workspace</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (
            projectState === "loading" ||
            (activeProjectId && !activeProjectData)
          ) {
            return (
              <div className="p-4 border-b border-white/10 bg-gradient-to-b from-[#131427] to-[#0d0e19] space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#3B82F6] tracking-wider flex items-center gap-1.5 font-mono">
                    <Activity className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />{" "}
                    Active Project Context
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA] font-mono">
                    Loading...
                  </span>
                </div>
                <div className="bg-[#14201d] border border-white/10 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-800 rounded w-1/2" />
                    <div className="h-3 bg-neutral-800 rounded w-1/3" />
                  </div>
                </div>
              </div>
            );
          }

          if (!activeProjectId || !activeProjectData) {
            return (
              <div className="p-4 border-b border-[#2F2F2F] bg-[#121212] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5 font-mono">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> NO ACTIVE
                    PROJECT
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#2F2F2F] bg-[#1E1E1E] text-neutral-400 font-mono">
                    Idle
                  </span>
                </div>
                <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-xs text-white">
                      No project currently active
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Select a project below to enable your workspace tools.
                    </p>
                  </div>
                  {navigateTo && (
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        navigateTo("/scraper");
                      }}
                      className="px-3.5 py-2 bg-[#2A2A2A] hover:bg-[#3B82F6] border border-[#2F2F2F] hover:border-[#60A5FA] text-white rounded-xl text-xs font-bold transition-all shadow-sm hover: shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 group"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#3B82F6] group-hover:text-white transition-colors" />
                      <span>New Project</span>
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // Active State
          const proj = activeProjectData.project;
          const importedCount =
            proj?.imported_assets_count ??
            activeProjectData.scrapedImages?.length ??
            0;
          const hasVideo = !!proj?.video_url;
          const statusLower = (proj?.status || "pending").toLowerCase();
          const statusColor =
            statusLower === "processing"
              ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
              : statusLower === "draft"
              ? "text-neutral-400 bg-neutral-800 border-neutral-700"
              : statusLower === "completed" || statusLower === "ready"
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
              : "text-blue-400 bg-blue-500/10 border-blue-500/30";

          // Build a clean subtitle: prefer "Ep. X" or chapter slug short form
          const episodeLabel = proj?.episode
            ? `Ep. ${proj.episode}`
            : proj?.chapter_slug
            ? proj.chapter_slug.length > 24
              ? proj.chapter_slug.slice(0, 24) + "…"
              : proj.chapter_slug
            : null;

          const infoLine = [
            proj?.author ? `by ${proj.author}` : null,
            episodeLabel,
            proj?.genre,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <div className="p-4 border-b border-[#2F2F2F] bg-[#181818] space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-black text-[#3B82F6] tracking-wider flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6] " />
                  Active Project Context
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 font-mono capitalize ${statusColor}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {proj?.status || "Active"}
                </span>
              </div>

              {/* Title, Source, Cover & Actions */}
              <div className="bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md transition-all">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black border border-[#2F2F2F] shrink-0 relative shadow-md">
                    {activeCover ? (
                      <img
                        src={getProxiedImageUrl(activeCover, proj?.url)}
                        alt={proj?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#121212] flex items-center justify-center text-[#3B82F6] font-black text-lg border border-[#2F2F2F]">
                        {proj?.title?.charAt(0).toUpperCase() || "P"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ActiveSourceIcon className="w-3 h-3 text-[#9CA3AF] shrink-0" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF]">
                        {activeSourceName}
                      </span>
                      {hasVideo && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#121212] text-[#3B82F6] border border-[#3B82F6]/30 font-mono">
                          VIDEO ✓
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-sm text-[#E5E5E5] truncate font-sans leading-tight">
                      {proj?.title || "Untitled Project"}
                    </h4>
                    {infoLine && (
                      <p className="text-[11px] text-[#9CA3AF] font-mono truncate">
                        {infoLine}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {navigateTo && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setDrawerOpen(false);
                          navigateTo(
                            `/scraper/editor?project_id=${encodeURIComponent(
                              activeProjectId!
                            )}`
                          );
                        }}
                        className="btn-primary px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 justify-center"
                        title="Open Studio Editor"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Studio</span>
                      </button>

                      <button
                        onClick={() => {
                          setDrawerOpen(false);
                          navigateTo(
                            `/editor/image?project_id=${encodeURIComponent(
                              activeProjectId!
                            )}`
                          );
                        }}
                        className="btn-secondary px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 justify-center"
                        title="Open Image Cropper & Cleaner"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>Image</span>
                      </button>

                      <button
                        onClick={() => {
                          setDrawerOpen(false);
                          navigateTo(
                            `/creative-suite/ai-voice?project_id=${encodeURIComponent(
                              activeProjectId!
                            )}`
                          );
                        }}
                        className="btn-secondary px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 justify-center"
                        title="Open AI Voice Studio"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>Voice</span>
                      </button>

                      {proj?.series_slug ? (
                        <button
                          onClick={() => {
                            setDrawerOpen(false);
                            navigateTo(
                              `/projects/${encodeURIComponent(
                                proj.series_slug!
                              )}`
                            );
                          }}
                          className="btn-secondary px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 justify-center"
                          title="Open Series Details Page"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span>Series</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => clearActiveProject()}
                          className="btn-secondary px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 justify-center hover:text-[#EF4444]"
                          title="Deactivate / Clear active project"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => clearActiveProject()}
                    className="p-1 rounded-xl text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer self-end"
                    title="Deactivate / Clear active project"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Composition Progress — shown only when panels exist */}
              {activePanelsCount > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#9CA3AF]">
                      Composition Progress
                    </span>
                    <span className="text-[#3B82F6] font-bold">
                      {activeProgressPct}% · ~
                      {formatDuration(activeDurationSeconds)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#121212] overflow-hidden border border-[#2F2F2F]">
                    <div
                      className="h-full bg-gradient-to-r from-[#3B82F6] to-[#3B82F6] transition-all duration-500 rounded-full"
                      style={{ width: `${activeProgressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Real Stats Grid — 4 columns with contextual data */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/40 p-2.5 rounded-xl transition-all">
                  <span className="text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider block">
                    Panels
                  </span>
                  <span className="font-bold text-[#E5E5E5] font-mono text-sm">
                    {activePanelsCount}
                  </span>
                </div>
                <div className="bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/40 p-2.5 rounded-xl transition-all">
                  <span className="text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider block">
                    Imported
                  </span>
                  <span
                    className={`font-bold font-mono text-sm ${
                      importedCount > 0 ? "text-[#3B82F6]" : "text-[#6B7280]"
                    }`}
                  >
                    {importedCount}
                  </span>
                </div>
                <div className="bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/40 p-2.5 rounded-xl transition-all">
                  <span className="text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider block">
                    Speech
                  </span>
                  <span
                    className={`font-bold font-mono text-sm ${
                      activeSpeechCount > 0
                        ? "text-[#10B981]"
                        : "text-[#6B7280]"
                    }`}
                  >
                    {activeSpeechCount}
                  </span>
                </div>
                <div className="bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/40 p-2.5 rounded-xl transition-all">
                  <span className="text-[10px] text-[#9CA3AF] font-mono uppercase tracking-wider block">
                    Audio
                  </span>
                  <span
                    className={`font-bold font-mono text-sm ${
                      activeAudioCount > 0
                        ? "text-[#F59E0B]"
                        : "text-[#6B7280]"
                    }`}
                  >
                    {activeAudioCount}
                  </span>
                </div>
              </div>

              {/* Panel Storyboard Preview Reel Carousel */}
              {activePanels.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                      <Film className="w-3 h-3 text-[#3B82F6]" /> Storyboard Panels
                    </span>
                    <span className="text-[#3B82F6] font-bold">
                      {activePanels.length} panels
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {activePanels.slice(0, 10).map((panel: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDrawerOpen(false);
                          if (navigateTo) {
                            navigateTo(
                              `/scraper/editor?project_id=${encodeURIComponent(
                                activeProjectId!
                              )}&panel=${i}`
                            );
                          }
                        }}
                        className="w-11 h-11 rounded-lg overflow-hidden bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6] shrink-0 relative transition-all group cursor-pointer"
                        title={`Panel #${i + 1} — Click to edit`}
                      >
                        {panel.image_url ? (
                          <img
                            src={getProxiedImageUrl(panel.image_url, proj?.url)}
                            alt={`Panel ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B7280] font-mono">
                            #{i + 1}
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 rounded text-[8px] font-bold font-mono text-[#E5E5E5]">
                          #{i + 1}
                        </span>
                      </button>
                    ))}
                    {activePanels.length > 10 && (
                      <div className="w-11 h-11 rounded-lg bg-[#121212] border border-[#2F2F2F] shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-[#3B82F6] font-bold font-mono">
                          +{activePanels.length - 10}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scraped Images Preview Strip — shown when scraped images are available */}
              {(() => {
                const scraped = activeProjectData.scrapedImages || [];
                if (scraped.length === 0 || activePanels.length > 0)
                  return null;
                const preview = scraped.slice(0, 8);
                const remaining = scraped.length - preview.length;
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#9CA3AF] uppercase tracking-wider">
                        Scraped Images
                      </span>
                      <span className="text-[#3B82F6] font-bold">
                        {scraped.length} images
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {preview.map((src, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-lg overflow-hidden bg-[#121212] border border-[#2F2F2F] shrink-0"
                        >
                          <img
                            src={getProxiedImageUrl(src, proj?.url)}
                            alt={`Scraped ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                      {remaining > 0 && (
                        <div className="w-10 h-10 rounded-lg bg-[#121212] border border-[#2F2F2F] shrink-0 flex items-center justify-center">
                          <span className="text-[10px] text-[#3B82F6] font-bold font-mono">
                            +{remaining}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* ─── Search & Filter Controls ─── */}
        <div className="p-4 pb-2 border-b border-[#2F2F2F] bg-[#181818] space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#3B82F6]" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-[#9CA3AF] hover:text-[#E5E5E5]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] px-3 py-2 focus:outline-none focus:border-[#3B82F6] cursor-pointer font-mono"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="panels">Most Panels</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs">
            {[
              { id: "all", label: "All Projects" },
              { id: "favorites", label: "★ Favorites" },
              { id: "recent", label: "Recent" },
              { id: "draft", label: "Drafts" },
              { id: "processing", label: "Processing" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all text-xs font-medium whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 font-bold"
                    : "text-[#9CA3AF] bg-[#121212] border border-[#2F2F2F] hover:text-white hover:border-[#3B82F6] hover:bg-[#2A2A2A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Real Projects List ─── */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-[#141414]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF] gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#3B82F6]" />
              <span className="text-xs font-mono">
                Loading real projects...
              </span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16 px-4 text-[#9CA3AF] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-[#2F2F2F] flex items-center justify-center mx-auto text-[#6B7280]">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#E5E5E5]">
                  No projects found
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  {searchQuery
                    ? "No matches for your search term."
                    : "No projects in this category."}
                </p>
              </div>
              {navigateTo && (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    navigateTo("/scraper");
                  }}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Project</span>
                </button>
              )}
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isActive = p.project_id === activeProjectId;
              const isFav = favorites.includes(p.project_id);
              const cover =
                p.cover_image ||
                p.first_panel_image ||
                p.panels?.[0]?.image_url;
              const panelCount =
                p.panels_count ?? p.panel_count ?? p.panels?.length ?? 0;
              const importedCount = p.imported_assets_count ?? 0;
              const status = (p.status || "ready").toLowerCase();
              const ItemSourceIcon = getSourceIcon(p.url || "");
              const itemSourceName = getSourceName(p.url || "");
              const itemTimeAgo = timeAgo(p.created_at || p.updated_at);

              const statusColor =
                status === "processing"
                  ? "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30"
                  : status === "draft"
                  ? "text-[#9CA3AF] bg-[#181818] border-[#2F2F2F]"
                  : status === "completed" || status === "ready"
                  ? "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30"
                  : "text-[#9CA3AF] bg-[#181818] border-[#2F2F2F]";

              return (
                <div
                  key={p.project_id}
                  onClick={() => handleSelectProject(p.project_id)}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? "bg-[#1E1E1E] border-[#3B82F6] shadow-md ring-1 ring-[#3B82F6]/50"
                      : "bg-[#181818] hover:bg-[#262626] border-[#2F2F2F] hover:border-[#3B82F6]/60"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-[#2F2F2F] shrink-0 relative">
                      {cover ? (
                        <img
                          src={getProxiedImageUrl(cover, p.url)}
                          alt={p.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#121212] flex items-center justify-center text-[#3B82F6] font-bold text-sm border border-[#2F2F2F]">
                          {p.title?.charAt(0).toUpperCase() || "P"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex flex-col space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <ItemSourceIcon className="w-3 h-3 text-[#9CA3AF] shrink-0" />
                        <span className="text-[10px] text-[#9CA3AF] font-mono uppercase truncate">
                          {itemSourceName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border font-mono capitalize ${statusColor}`}
                        >
                          {status}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-[#E5E5E5] truncate group-hover:text-[#3B82F6] transition-colors">
                        {p.title}
                      </h4>

                      <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] flex-wrap">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Layers className="w-3 h-3 text-[#9CA3AF]" />
                          {panelCount} {panelCount === 1 ? "Panel" : "Panels"}
                        </span>
                        {importedCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[#3B82F6]">
                              {importedCount} imported
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[#9CA3AF]">
                          <Clock className="w-3 h-3 text-[#9CA3AF]" />
                          {itemTimeAgo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Favorite Star Button */}
                    <button
                      onClick={(e) => toggleFavorite(e, p.project_id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isFav
                          ? "text-[#F59E0B]"
                          : "text-[#6B7280] hover:text-[#9CA3AF]"
                      }`}
                      title={
                        isFav ? "Remove from Favorites" : "Add to Favorites"
                      }
                    >
                      <Star
                        className={`w-4 h-4 ${isFav ? "fill-[#F59E0B]" : ""}`}
                      />
                    </button>

                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProject(p.project_id);
                        }}
                        className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal for Unsaved Changes */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#11121c] border border-white/15 rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              Switch Active Project?
            </h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed font-sans">
              Your current workspace has unsaved changes. Switching active
              projects will hydrate the new project state.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Stay Here
              </button>
              <button
                onClick={handleConfirmSwitch}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Switch Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveProjectSelectorDrawer;
