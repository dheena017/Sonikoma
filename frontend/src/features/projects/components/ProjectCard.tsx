import React from "react";
import {
  ArrowRight,
  CheckSquare,
  Download,
  Edit2,
  ExternalLink,
  FolderOpen,
  Link,
  MoreVertical,
  Play,
  Scissors,
  Square,
  Trash2,
  Clock,
} from "lucide-react";
import type { Project } from "@/features/projects/hooks/ProjectTypes";

type ProjectCardItem = Project;
import {
  getProxiedImageUrl,
  getSourceIcon,
  getSourceName,
} from "@/utils";

interface ProjectCardProps {
  project: Project;
  onOpenProject: (project: ProjectCardItem) => void;
  onRename?: (e: React.MouseEvent, project: ProjectCardItem) => void;
  onExport?: (e: React.MouseEvent, project: ProjectCardItem) => void;
  onOpenDetails?: (e: React.MouseEvent, project: ProjectCardItem) => void;
  onDelete?: (e: React.MouseEvent, projectId: string) => void;
  onCopyLink?: (e: React.MouseEvent, project: ProjectCardItem) => void;
  onOpenCreativeSuite?: (e: React.MouseEvent, project: ProjectCardItem) => void;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent, projectId: string) => void;
  showSelection?: boolean;
  openMenuId?: string | null;
  onToggleMenu?: (e: React.MouseEvent, projectId: string) => void;
  renamingProjectId?: string | null;
  onSaveRename?: (projectId: string, newName: string) => void;
}

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "Recently";
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 0) return "Recently";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProjectCard({
  project,
  onOpenProject,
  onRename,
  onExport,
  onOpenDetails,
  onDelete,
  onCopyLink,
  onOpenCreativeSuite,
  isSelected = false,
  onToggleSelect,
  showSelection = false,
  openMenuId,
  onToggleMenu,
  renamingProjectId,
  onSaveRename,
}: ProjectCardProps) {
  const isProcessing =
    project.status?.toLowerCase() === "processing" ||
    project.status?.toLowerCase() === "exporting";
  const SourceIcon = getSourceIcon?.(project.url) || ExternalLink;
  const isRenaming = renamingProjectId === project.project_id;
  const titleText = project.title || "Untitled Series";
  const statusColor =
    project.status?.toLowerCase() === "completed"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : project.status?.toLowerCase() === "processing"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
      : "bg-neutral-800/80 text-neutral-400 border-neutral-700/50";

  return (
    <div
      onClick={() => onOpenProject(project)}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0c12] via-[#10101a] to-[#12121f] shadow-xl shadow-purple-950/10 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/40 flex flex-col h-full ${
        isSelected
          ? "border-purple-500/50 shadow-purple-900/30 ring-1 ring-purple-500/50"
          : "hover:border-purple-500/40"
      }`}
    >
      {/* Selection checkbox */}
      {showSelection && onToggleSelect && (
        <div
          className="absolute top-3 left-3 z-10 cursor-pointer"
          onClick={(e) => onToggleSelect(e, project.project_id)}
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-purple-400 drop-shadow-md" />
          ) : (
            <Square className="w-5 h-5 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white drop-shadow-md" />
          )}
        </div>
      )}

      {/* ─── Thumbnail ─────────────────────────────────── */}
      <div className="relative aspect-[16/9] w-full bg-neutral-900 overflow-hidden flex-shrink-0 rounded-t-3xl border-b border-white/10">
        {project.cover_image ? (
          <>
            <img
              src={getProxiedImageUrl(project.cover_image, project.url)}
              alt={project.title}
              className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                isSelected ? "scale-105 opacity-80" : "group-hover:scale-105"
              }`}
            />
            {/* Bottom fade into card */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
            {/* Subtle side vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/25" />
            {/* Soft glow overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.12),_transparent_40%)]" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-900 to-neutral-950">
            <FolderOpen className="w-12 h-12 text-neutral-600" />
            <span className="text-[11px] text-neutral-500 font-semibold uppercase tracking-[0.2em]">No Cover</span>
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/10 backdrop-blur-[1px] z-10">
          <div className="h-11 w-11 rounded-full bg-purple-600/90 flex items-center justify-center shadow-xl shadow-purple-900/60 scale-75 group-hover:scale-100 transition-transform duration-300 border border-purple-400/30">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Top badges row */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {/* Status badge */}
          <div className={`px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] rounded-full border backdrop-blur-md ${statusColor}`}>
            {project.status || "Draft"}
          </div>

          {/* 3-dot menu */}
          <button
            onClick={(e) => onToggleMenu?.(e, project.project_id)}
            className="w-8 h-8 rounded-full bg-black/45 hover:bg-black/65 text-neutral-300 hover:text-white border border-white/10 transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-lg shadow-black/20"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Episode badge */}
        {project.episode !== undefined && project.episode !== null && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <div className="px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-md text-[9px] font-bold text-white tracking-wider">
              EP {project.episode}
            </div>
          </div>
        )}

      </div>

      {/* Dropdown menu — at card level so thumbnail overflow-hidden doesn't clip it */}
      {openMenuId === project.project_id && (
        <div
          className="absolute right-2.5 top-10 w-44 bg-[#16161b] border border-white/10 rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { onOpenProject(project); onToggleMenu?.(e, project.project_id); }}
            className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Resume
          </button>
          {onOpenDetails && (
            <button onClick={(e) => onOpenDetails(e, project)} className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
              <FolderOpen className="w-3.5 h-3.5" /> Details
            </button>
          )}
          {onRename && (
            <button onClick={(e) => onRename(e, project)} className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Rename
            </button>
          )}
          {onExport && (
            <button onClick={(e) => onExport(e, project)} className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
          {onCopyLink && (
            <button onClick={(e) => onCopyLink(e, project)} className="w-full text-left px-3.5 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
              <Link className="w-3.5 h-3.5" /> Copy Link
            </button>
          )}
          {onDelete && (
            <>
              <div className="h-px bg-white/5 my-1" />
              <button onClick={(e) => onDelete(e, project.project_id)} className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* ─── Card Body ─────────────────────────────────── */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-2 relative z-10">
        {/* Source label */}
        <div className="flex items-center gap-1.5">
          <SourceIcon className="h-3 w-3 text-neutral-600" />
          <span className="text-[10px] text-neutral-600 font-mono tracking-wider uppercase truncate">
            {getSourceName(project.url)}
          </span>
        </div>

        {/* Title */}
        {isRenaming ? (
          <input
            type="text"
            defaultValue={titleText}
            onBlur={(e) => onSaveRename?.(project.project_id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveRename?.(project.project_id, e.currentTarget.value);
            }}
            autoFocus
            className="text-sm font-bold text-white bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 w-full"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-purple-300 transition-colors duration-200">
            {titleText}
          </h3>
        )}

        {/* Genre + Author row */}
        <div className="flex items-center gap-2 flex-wrap">
          {project.genre && (
            <span className="text-[10px] bg-purple-500/15 text-purple-300/80 border border-purple-500/20 px-2 py-0.5 rounded-full font-medium">
              {project.genre}
            </span>
          )}
          {project.author && (
            <span className="text-[10px] text-neutral-500 truncate">
              {project.author}
            </span>
          )}
        </div>

        {/* Synopsis (optional) */}
        {project.synopsis && (
          <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed flex-1">
            {project.synopsis}
          </p>
        )}

        {/* ─── Footer ───────────────────────────────────── */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-neutral-800/50">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3 text-[10px] text-neutral-400">
              {/* Panels count */}
              {(() => {
                const timelineCount = project.panels_count ?? 0;
                const importedCount = project.imported_assets_count ?? 0;
                const displayCount = timelineCount || importedCount || 0;
                const hasDiff = timelineCount > 0 && importedCount > 0 && timelineCount !== importedCount;

                return (
                  <div
                    className="flex items-center gap-1 text-[10px] text-neutral-500"
                    title={
                      hasDiff
                        ? `Storyboard Timeline: ${timelineCount} panels | Imported Assets: ${importedCount} assets`
                        : `${displayCount} panels`
                    }
                  >
                    <Scissors className="h-3 w-3 text-purple-400/80" />
                    <span className="font-semibold text-neutral-300">{displayCount}</span>
                    <span>
                      {hasDiff
                        ? `panels (${importedCount} imported)`
                        : importedCount > 0 && timelineCount === 0
                        ? "imported panels"
                        : "panels"}
                    </span>
                  </div>
                );
              })()}
              {/* Time ago */}
              <div className="flex items-center gap-1 text-[10px] text-neutral-600">
                <Clock className="h-3 w-3" />
                <span>{timeAgo(project.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenCreativeSuite && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCreativeSuite(e, project);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-200 hover:bg-purple-500/20 active:scale-95 transition-all opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 shadow-sm shadow-purple-500/10"
                >
                  Creative
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProject(project);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-200 hover:bg-purple-500/20 active:scale-95 transition-all opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 shadow-sm shadow-purple-500/10"
              >
                Resume
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Processing shimmer bar */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 z-20">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-amber-500 animate-shimmer"
            style={{ width: "100%", backgroundSize: "200% 100%" }}
          />
        </div>
      )}
    </div>
  );
}
