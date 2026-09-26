import React, { useState, useEffect } from "react";
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
  Sparkles,
  Film,
  Layers,
} from "lucide-react";
import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";

type ProjectCardItem = Project;
import { getProxiedImageUrl, getSourceIcon, getSourceName } from "@/utils";
import { timeAgo } from "@/utils/dateUtils";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

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

function formatEpisodeLabel(ep?: any, slug?: string): string {
  const val =
    ep !== undefined && ep !== null && String(ep).trim() !== ""
      ? String(ep)
      : slug || "";
  if (!val) return "";
  const str = String(val).trim();
  if (!str) return "";
  const numMatch = str.match(/\d+/);
  if (numMatch) {
    return `CH ${numMatch[0]}`;
  }
  return str;
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
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(() =>
    getProxiedImageUrl(project.cover_image, project.url)
  );

  useEffect(() => {
    setImageError(false);
    setImgSrc(getProxiedImageUrl(project.cover_image, project.url));
  }, [project.cover_image, project.url]);

  const statusColor =
    project.status?.toLowerCase() === "completed"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : project.status?.toLowerCase() === "processing"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
      : "bg-black/60 text-neutral-400 border-neutral-700/60";

  return (
    <div
      onClick={() => onOpenProject(project)}
      className={`group relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#161616] hover:border-neutral-700 hover:bg-[#1a1a1a] cursor-pointer flex flex-col h-full shadow-sm ${
        isSelected ? "border-blue-500/60 bg-[#1c1c1c]" : ""
      }`}
    >
      {/* Selection checkbox */}
      {showSelection && onToggleSelect && (
        <div
          className="absolute top-3 left-3 z-10 cursor-pointer"
          onClick={(e) => onToggleSelect(e, project.project_id)}
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-[#3B82F6] drop-shadow-md" />
          ) : (
            <Square className="w-5 h-5 text-white/40 opacity-0 group-hover:opacity-100 hover:text-white drop-shadow-md" />
          )}
        </div>
      )}

      {/* ─── Thumbnail ─────────────────────────────────── */}
      <div className="relative aspect-[16/10] w-full bg-neutral-900 overflow-hidden flex-shrink-0 rounded-t-2xl">
        {imgSrc && !imageError ? (
          <>
            <img
              src={imgSrc}
              alt={project.title || "Cover"}
              className="w-full h-full object-cover object-top block"
              onError={() => {
                if (
                  imgSrc.includes("/api/v1/proxy/image") &&
                  project.cover_image
                ) {
                  setImgSrc(project.cover_image);
                } else {
                  setImageError(true);
                }
              }}
            />
            {/* Clean bottom gradient overlay for badge readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-neutral-900 p-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-[11px] text-neutral-300 font-semibold font-mono tracking-wider text-center line-clamp-1">
              {formatEpisodeLabel(project.episode, project.chapter_slug) ||
                project.title ||
                "CHAPTER PROJECT"}
            </span>
            <span className="text-[9px] text-neutral-500 font-mono">
              Ready for Creative Studio
            </span>
          </div>
        )}

        {/* Top badges row */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {/* Status badge */}
          <div
            className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border backdrop-blur-sm ${statusColor}`}
          >
            {project.status || "Draft"}
          </div>

          {/* 3-dot menu */}
          <div className="relative z-30" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleMenu?.(e, project.project_id);
              }}
              aria-label="Project actions & options"
              title="Project actions & options"
              className="w-7 h-7 rounded-lg bg-black/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom thumbnail badges */}
        <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-between pointer-events-none">
          {formatEpisodeLabel(project.episode, project.chapter_slug) ? (
            <div className="px-2 py-0.5 bg-black/80 backdrop-blur-sm border border-neutral-800 rounded-md text-[9px] font-bold text-white tracking-wider flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>
                {formatEpisodeLabel(project.episode, project.chapter_slug)}
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="px-2 py-0.5 bg-black/80 backdrop-blur-sm border border-neutral-800 rounded-md text-[9px] font-medium text-neutral-400 tracking-wider flex items-center gap-1 font-mono">
            <Clock className="w-2.5 h-2.5 text-neutral-500" />
            <span>{timeAgo(project.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {openMenuId === project.project_id && (
        <div
          className="absolute right-2 top-11 w-48 bg-[#181818] border border-neutral-700/80 rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onOpenProject(project);
              onToggleMenu?.(e, project.project_id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Play className="w-3 h-3" />
            </div>
            <span className="font-semibold">Resume</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onOpenDetails) {
                onOpenDetails(e, project);
              } else {
                onOpenProject(project);
              }
              onToggleMenu?.(e, project.project_id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderOpen className="w-3 h-3" />
            </div>
            <span className="font-semibold">Details</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onRename) {
                onRename(e, project);
              }
              onToggleMenu?.(e, project.project_id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Edit2 className="w-3 h-3" />
            </div>
            <span className="font-semibold">Rename</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onExport) {
                onExport(e, project);
              } else {
                const nav = (window as any).navigateTo;
                const target = `/scraper?id=${encodeURIComponent(
                  project.project_id
                )}&export=true`;
                if (typeof nav === "function") nav(target);
                else {
                  window.history.pushState({}, "", target);
                  window.dispatchEvent(new Event("popstate"));
                }
              }
              onToggleMenu?.(e, project.project_id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download className="w-3 h-3" />
            </div>
            <span className="font-semibold">Export</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onCopyLink) {
                onCopyLink(e, project);
              } else {
                const url = `${
                  window.location.origin
                }/scraper?id=${encodeURIComponent(project.project_id)}`;
                navigator.clipboard.writeText(url);
                if (typeof (window as any).alertAsync === "function") {
                  (window as any).alertAsync(
                    "Link copied to clipboard!",
                    "Success",
                    "emerald"
                  );
                }
              }
              onToggleMenu?.(e, project.project_id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Link className="w-3 h-3" />
            </div>
            <span className="font-semibold">Copy Link</span>
          </button>
          <div className="h-px bg-white/10 my-1" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onDelete) {
                onDelete(e, project.project_id);
              }
              onToggleMenu?.(e, project.project_id);
            }}
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-rose-400 hover:bg-rose-500/15 rounded-lg flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="w-3 h-3" />
            </div>
            <span className="font-semibold">Delete</span>
          </button>
        </div>
      )}

      {/* ─── Card Body ─────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1 gap-2 relative z-10">
        {/* Source label */}
        <div className="flex items-center gap-1.5">
          <SourceIcon className="h-3 w-3 text-neutral-500" />
          <span className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase truncate">
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
              if (e.key === "Enter")
                onSaveRename?.(project.project_id, e.currentTarget.value);
            }}
            autoFocus
            className="text-sm font-bold text-white bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 w-full"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3
            className="text-sm sm:text-base font-bold text-neutral-100 leading-snug line-clamp-1 group-hover:text-blue-400"
            title={titleText}
          >
            {titleText}
          </h3>
        )}

        {/* Genre + Author row */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {project.genre && (
            <span className="text-[10px] bg-neutral-800/90 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-md font-semibold">
              {project.genre}
            </span>
          )}
          {project.author && (
            <span className="text-[11px] text-neutral-400 font-medium truncate">
              {project.author}
            </span>
          )}
        </div>

        {/* ─── Footer ───────────────────────────────────── */}
        <div className="pt-2 mt-auto flex items-center justify-between gap-2 border-t border-neutral-800/80">
          {/* Storyboard Panels & Imported Assets Counts */}
          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Storyboard Count */}
            <div
              className="flex items-center gap-1 text-neutral-400"
              title={`${project.panels_count ?? 0} Storyboard Panels`}
            >
              <Film className="h-3.5 w-3.5 shrink-0 text-blue-400" />
              <span className="font-semibold text-neutral-200">
                {project.panels_count ?? 0}
              </span>
              <span className="text-[10px] text-neutral-500">panels</span>
            </div>

            {/* Imported Assets Count */}
            <div
              className="flex items-center gap-1 text-neutral-400"
              title={`${project.imported_assets_count ?? 0} Imported Assets`}
            >
              <Layers className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span className="font-semibold text-neutral-200">
                {project.imported_assets_count ?? 0}
              </span>
              <span className="text-[10px] text-neutral-500">assets</span>
            </div>
          </div>

          {/* Resume Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProject(project);
            }}
            className="inline-flex items-center justify-center gap-1.5 h-7 px-3 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-semibold text-white shrink-0 cursor-pointer"
          >
            <span>Resume</span>
            <ArrowRight className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      {/* Processing bar */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 z-20">
          <div className="h-full bg-blue-500" style={{ width: "100%" }} />
        </div>
      )}
    </div>
  );
}
