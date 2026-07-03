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
} from "lucide-react";
import type { Project } from "./hooks/ProjectTypes.js";

type ProjectCardItem = Project;
import { getProxiedImageUrl, getSourceIcon, getSourceName } from "../../utils.js";

interface ProjectCardProps {
  project: Project;
  onOpenProject: (project: ProjectCardItem) => void;
  onRename?: (e: React.MouseEvent, project: ProjectCardItem) => void;
  onExport?: (e: React.MouseEvent, project: ProjectCardItem) => void;
  onOpenDetails?: (e: React.MouseEvent, project: ProjectCardItem) => void;
  onDelete?: (e: React.MouseEvent, projectId: string) => void;
  onCopyLink?: (e: React.MouseEvent, project: ProjectCardItem) => void;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent, projectId: string) => void;
  showSelection?: boolean;
  openMenuId?: string | null;
  onToggleMenu?: (e: React.MouseEvent, projectId: string) => void;
  renamingProjectId?: string | null;
  onSaveRename?: (projectId: string, newName: string) => void;
}

export default function ProjectCard({
  project,
  onOpenProject,
  onRename,
  onExport,
  onOpenDetails,
  onDelete,
  onCopyLink,
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

  return (
    <div
      onClick={() => onOpenProject(project)}
      className={`bg-[#111115] border rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group flex flex-col h-full relative ${
        isSelected
          ? "border-purple-500 shadow-lg shadow-purple-900/20 ring-1 ring-purple-500"
          : "border-neutral-800 hover:border-purple-500/50"
      }`}
    >
      {showSelection && onToggleSelect && (
        <div
          className="absolute top-4 left-4 z-20 cursor-pointer"
          onClick={(e) => onToggleSelect(e, project.project_id)}
        >
          {isSelected ? (
            <CheckSquare className="w-6 h-6 text-purple-400 bg-black/50 rounded drop-shadow-md" />
          ) : (
            <Square className="w-6 h-6 text-white/50 opacity-0 group-hover:opacity-100 bg-black/20 rounded transition-opacity drop-shadow-md hover:text-white" />
          )}
        </div>
      )}

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={(e) => onToggleMenu?.(e, project.project_id)}
          className="p-1.5 rounded-lg bg-black/40 text-neutral-400 hover:text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {openMenuId === project.project_id && (
          <div className="absolute right-0 top-10 w-40 bg-[#16161b] border border-white/10 rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in duration-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenProject(project);
                onToggleMenu?.(e, project.project_id);
              }}
              className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" /> Resume
            </button>
            {onOpenDetails && (
              <button
                onClick={(e) => onOpenDetails(e, project)}
                className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5" /> Details
              </button>
            )}
            {onRename && (
              <button
                onClick={(e) => onRename(e, project)}
                className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
              >
                <Edit2 className="h-3.5 h-3.5" /> Rename
              </button>
            )}
            {onExport && (
              <button
                onClick={(e) => onExport(e, project)}
                className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
              >
                <Download className="h-3.5 h-3.5" /> Export
              </button>
            )}
            {onCopyLink && (
              <button
                onClick={(e) => onCopyLink(e, project)}
                className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
              >
                <Link className="w-3.5 h-3.5" /> Copy Link
              </button>
            )}
            {onDelete && (
              <>
                <div className="h-px bg-white/5 my-1"></div>
                <button
                  onClick={(e) => onDelete(e, project.project_id)}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="relative h-48 w-full bg-neutral-900 overflow-hidden">
        {project.cover_image ? (
          <>
            <img
              src={getProxiedImageUrl(project.cover_image)}
              alt={project.title}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isSelected
                  ? "scale-105 opacity-80"
                  : "group-hover:scale-105"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111115] via-[#111115]/50 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 bg-neutral-900/50">
            <FolderOpen className="w-12 h-12 mb-2 opacity-50" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px] z-10">
          <div className="h-14 w-14 rounded-full bg-purple-600 flex items-center justify-center shadow-xl shadow-purple-900/40 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="h-7 w-7 text-white fill-white ml-1" />
          </div>
        </div>

        <div className="absolute top-4 right-12 pr-2 z-20">
          <div
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border backdrop-blur-md ${
              project.status?.toLowerCase() === "completed"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                : project.status?.toLowerCase() === "processing"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse"
                : "bg-black/40 text-neutral-300 border-white/20"
            }`}
          >
            {project.status || "Draft"}
          </div>
        </div>

        {project.episode !== undefined && project.episode !== null && (
          <div className="absolute bottom-4 left-4">
            <div className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-bold text-white tracking-wider">
              EP {project.episode}
            </div>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 relative z-10 -mt-2">
        <div className="flex items-center gap-2 mb-1.5">
          <SourceIcon className="h-3 w-3 text-neutral-500" />
          <span className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase">
            {getSourceName(project.url)}
          </span>
        </div>

        {isRenaming ? (
          <input
            type="text"
            defaultValue={titleText}
            onBlur={(e) => onSaveRename?.(project.project_id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSaveRename?.(project.project_id, e.currentTarget.value);
              }
            }}
            autoFocus
            className="text-lg font-bold text-white mb-1 line-clamp-1 bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1"
          />
        ) : (
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors drop-shadow-md">
            {titleText}
          </h3>
        )}

        <div className="flex items-center gap-2 mb-3">
          {project.genre && (
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">
              {project.genre}
            </span>
          )}
          <span className="text-xs text-neutral-400 line-clamp-1">
            {project.author || "Unknown Author"}
          </span>
        </div>

        {project.synopsis && (
          <p className="text-xs text-neutral-500 line-clamp-2 mb-4 flex-1">
            {project.synopsis}
          </p>
        )}

        <div className="mt-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] text-neutral-500">
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5">
              {project.panels_count || 0} panels
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5">
              {new Date(project.created_at).toLocaleDateString()}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5">
              {getSourceName(project.url)}
            </span>
          </div>
          <p className="text-[10px] text-neutral-600 font-mono mb-3">
            Updated {new Date(project.created_at).toLocaleDateString()} • {getSourceName(project.url)}
          </p>
          <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
            <div className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
              <Scissors className="h-4 w-4 text-neutral-500" />
              <span className="text-white font-bold">{project.panels_count || 0}</span>{" "}
              panels
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800 z-20">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-purple-500 animate-shimmer"
            style={{ width: "100%", backgroundSize: "200% 100%" }}
          />
        </div>
      )}
    </div>
  );
}
