import React from "react";
import {
  Sparkles,
  Film,
  FolderSync,
  X,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  RotateCcw,
  Trash2,
  Zap,
  Save,
} from "lucide-react";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { getProxiedImageUrl } from "@/utils";

interface ActiveProjectWorkspaceBarProps {
  navigateTo?: (path: string) => void;
  fetchWithInterceptor?: any;
}

export const ActiveProjectWorkspaceBar: React.FC<
  ActiveProjectWorkspaceBarProps
> = ({ navigateTo, fetchWithInterceptor }) => {
  const {
    activeProjectId,
    activeProjectData,
    projectState,
    missingProjectInfo,
    isHydrating,
    setDrawerOpen,
    clearActiveProject,
    hydrateActiveProject,
  } = useProjectStore();

  const [isSaving, setIsSaving] = React.useState(false);

  const handleNavigate = (path: string) => {
    if (navigateTo) {
      navigateTo(path);
    } else if ((window as any).navigateTo) {
      (window as any).navigateTo(path);
    } else {
      window.location.href = path;
    }
  };

  const handleSaveProject = async () => {
    if (!activeProjectId) return;
    setIsSaving(true);
    try {
      const fetcher = fetchWithInterceptor || window.fetch;
      const res = await fetcher(
        `/api/projects/${encodeURIComponent(activeProjectId)}/promote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      if (data.success || data.already_permanent) {
        if (activeProjectData) {
          useProjectStore.getState().setActiveProject({
            ...activeProjectData,
            project: {
              ...activeProjectData.project,
              project_type: "permanent",
            },
          });
        }
      }
    } catch (err) {
      console.error("[WorkspaceBar] Failed to promote project:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── MISSING STATE ─────────────────────────────────────────────────────────
  if (projectState === "missing") {
    const missingId = missingProjectInfo?.missingId || "Unknown ID";
    const isJobId = missingProjectInfo?.isJobId ?? missingId.startsWith("job_");
    return (
      <div className="w-full bg-rose-950/30 border-b border-rose-500/25 backdrop-blur-md px-4 py-2 text-xs transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-rose-300 block">
                {isJobId ? "Job ID Expired" : "Project Not Found"}
              </span>
              <span className="text-rose-400/70 font-mono text-[10px] truncate block max-w-[260px] sm:max-w-sm">
                {isJobId
                  ? `"${missingId}" is a processing job reference, not a project ID.`
                  : `"${missingId}" could not be found or was deleted.`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() =>
                hydrateActiveProject(missingId, fetchWithInterceptor)
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border border-white/10 transition-all text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Retry</span>
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all text-xs font-medium"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Select Another</span>
            </button>
            <button
              onClick={clearActiveProject}
              className="p-1.5 rounded-lg text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Clear workspace"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  if (projectState === "loading" || isHydrating) {
    return (
      <div className="w-full bg-[#0d0d12]/90 border-b border-purple-500/20 backdrop-blur-md px-4 py-2 transition-all">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="h-3 w-32 bg-purple-900/50 rounded animate-pulse" />
            <div className="h-2 w-20 bg-neutral-800 rounded animate-pulse mt-1" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-20 bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-6 w-20 bg-neutral-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── IDLE STATE (no project) ───────────────────────────────────────────────
  if (!activeProjectId || !activeProjectData) {
    return (
      <div className="w-full bg-[#0d0d12]/90 border-b border-white/10 backdrop-blur-md px-4 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-neutral-300">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white tracking-wide">
                No Active Project Selected
              </span>
              <span className="hidden md:inline text-neutral-400 ml-2">
                — Activate a project to work seamlessly across Video Editor
                &amp; Creative Suite.
              </span>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-purple-500/20 transition-all text-xs"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Select Active Project</span>
          </button>
        </div>
      </div>
    );
  }

  // ── ACTIVE STATE ──────────────────────────────────────────────────────────
  const project = activeProjectData.project;
  const panels = activeProjectData.panels || [];
  const title = project?.title || "Untitled Project";
  const chapter = project?.chapter_slug
    ? `Chapter ${project.chapter_slug}`
    : project?.episode
    ? `Ep. ${project.episode}`
    : "";
  const coverImage =
    project?.cover_image || project?.first_panel_image || panels[0]?.image_url;
  const projectStatus = project?.status || "Ready";
  const isTemp =
    project?.project_type === "temp" || activeProjectId.startsWith("temp_");

  const totalDurationSeconds = panels.reduce(
    (acc: number, p: any) => acc + (p.duration || p.audio_duration || 3),
    0
  );
  const minutes = Math.floor(totalDurationSeconds / 60);
  const seconds = Math.round(totalDurationSeconds % 60);
  const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const renderStatusBadge = () => {
    switch (projectStatus.toLowerCase()) {
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>Draft</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Error</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active · Ready</span>
          </span>
        );
    }
  };

  const editorUrl = `/scraper/editor?project_id=${encodeURIComponent(
    activeProjectId
  )}`;
  const creativeSuiteUrl = `/creative-suite?project_id=${encodeURIComponent(
    activeProjectId
  )}`;

  return (
    <div
      className={`w-full bg-[#0b0c10]/95 border-b backdrop-blur-md px-4 py-2 text-xs transition-all shadow-lg ${
        isTemp ? "border-amber-500/30" : "border-white/10"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Project identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-neutral-900 border border-white/15 shrink-0 shadow-md">
            {coverImage ? (
              <img
                src={getProxiedImageUrl(coverImage, project?.url)}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-indigo-900/60 flex items-center justify-center text-purple-300 font-bold text-xs">
                {title.charAt(0).toUpperCase()}
              </div>
            )}
            {isHydrating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center text-purple-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-semibold text-white truncate max-w-[220px] sm:max-w-[320px] text-xs">
                {title}
              </h4>
              {chapter && (
                <span className="text-[11px] text-purple-300 font-medium shrink-0">
                  — {chapter}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
              {isTemp ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>● Unsaved Workspace</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>● Saved Project</span>
                </span>
              )}

              {renderStatusBadge()}

              <span className="hidden sm:inline-flex items-center gap-1 text-neutral-300">
                <Layers className="w-3 h-3 text-neutral-400" />
                {panels.length} {panels.length === 1 ? "Panel" : "Panels"}
              </span>

              {panels.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-neutral-300">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  {durationText}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
          <div className="flex items-center gap-2">
            {isTemp && (
              <button
                onClick={handleSaveProject}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold shadow-md shadow-amber-500/20 transition-all text-xs disabled:opacity-50 cursor-pointer"
                title="Save this workspace as a permanent project"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Project</span>
              </button>
            )}

            <button
              onClick={() => handleNavigate(editorUrl)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-white/10 transition-all text-xs font-medium"
              title="Open in Video Editor"
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Video Editor</span>
            </button>

            <button
              onClick={() => handleNavigate(creativeSuiteUrl)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all text-xs font-medium"
              title="Open Creative Suite"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Creative Suite</span>
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-sm transition-all text-xs"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>
          </div>

          <button
            onClick={clearActiveProject}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
            title="Deactivate / Unload Project"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveProjectWorkspaceBar;
