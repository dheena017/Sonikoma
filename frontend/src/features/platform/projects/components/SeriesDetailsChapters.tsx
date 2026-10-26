import React from "react";
import { FolderOpen, Plus } from "lucide-react";
import type { Project, ViewMode } from "@/features/platform/projects/types";
import ProjectCard from "./ProjectCard";
import type { useProjectsActions } from "../hooks/useProjectsActions";

interface SeriesDetailsChaptersProps {
  chapters: Project[];
  viewMode: ViewMode;
  isBatchMode: boolean;
  selectedProjectIds: string[];
  openMenuId: string | null;
  renamingProjectId: string | null;
  actions: ReturnType<typeof useProjectsActions>;
  onToggleSelectChapter: (projectId: string) => void;
  onToggleMenu: (e: React.MouseEvent, projectId: string) => void;
  onSaveRename: (projectId: string, newName: string) => Promise<void>;
  onSetRenamingProjectId: (projectId: string | null) => void;
  onChapterDeleted: (projectId: string) => void;
  onNewChapter: () => void;
}

export default function SeriesDetailsChapters({
  chapters,
  viewMode,
  isBatchMode,
  selectedProjectIds,
  openMenuId,
  renamingProjectId,
  actions,
  onToggleSelectChapter,
  onToggleMenu,
  onSaveRename,
  onSetRenamingProjectId,
  onChapterDeleted,
  onNewChapter,
}: SeriesDetailsChaptersProps) {
  if (chapters.length === 0) {
    return (
      <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-4">
        <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          No chapters match criteria
        </h3>
        <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
          Try adjusting your search query or status filter.
        </p>
        <button
          onClick={onNewChapter}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">New Chapter</span>
        </button>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
        {chapters.map((chapter) => (
          <div key={chapter.project_id} className="relative group">
            {isBatchMode && (
              <div className="absolute top-3 left-3 z-30">
                <input
                  type="checkbox"
                  checked={selectedProjectIds.includes(chapter.project_id)}
                  onChange={() => onToggleSelectChapter(chapter.project_id)}
                  className="w-5 h-5 rounded border-neutral-700 text-[#3B82F6] focus:ring-neutral-700 bg-neutral-955 cursor-pointer"
                />
              </div>
            )}
            <ProjectCard
              project={chapter}
              openMenuId={openMenuId}
              onToggleMenu={onToggleMenu}
              renamingProjectId={renamingProjectId}
              onSaveRename={onSaveRename}
              onOpenProject={(p) => actions.handleOpenProject(p)}
              onRename={(e, p) => onSetRenamingProjectId(p.project_id)}
              onExport={(e, p) => actions.handleExport(e, p)}
              onOpenDetails={(e, p) => actions.handleOpenDetails(e, p)}
              onDelete={(e, pid) =>
                actions.handleDeleteSingle(
                  e,
                  pid,
                  () => onChapterDeleted(pid),
                  () => onToggleMenu(e, "")
                )
              }
              onCopyLink={(e, p) => actions.handleCopyLink(e, p)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chapters.map((chapter) => (
        <div
          key={chapter.project_id}
          onClick={() => actions.handleOpenProject(chapter)}
          className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between gap-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4 min-w-0">
            {isBatchMode && (
              <input
                type="checkbox"
                checked={selectedProjectIds.includes(chapter.project_id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelectChapter(chapter.project_id);
                }}
                className="w-5 h-5 rounded border-neutral-700 text-[#3B82F6] focus:ring-neutral-700 bg-neutral-955 cursor-pointer shrink-0"
              />
            )}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-955 border border-neutral-800 shrink-0">
              {chapter.cover_image ? (
                <img
                  src={chapter.cover_image}
                  alt={chapter.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono text-[10px]">
                  N/A
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate group-hover:text-[#93C5FD] transition-colors">
                {chapter.title}
              </h4>
              <p className="text-xs text-neutral-400 font-mono">
                {chapter.panels_count || 0} Panels · Created{" "}
                {new Date(chapter.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase font-mono border ${
                chapter.status && chapter.status.toLowerCase() !== "draft"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-neutral-800 border-neutral-800 text-neutral-400"
              }`}
            >
              {chapter.status || "Draft"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                actions.handleOpenProject(chapter);
              }}
              className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] border border-blue-400/40 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Open Studio
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
