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

function formatEpisodeLabel(ep: any): string {
  if (ep === undefined || ep === null) return "";
  const str = String(ep).trim();
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
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/20"
      : project.status?.toLowerCase() === "processing"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
      : "bg-neutral-800/80 text-neutral-400 border-neutral-700/50";

  return (
    <div
      onClick={() => onOpenProject(project)}
      className={`group relative overflow-hidden rounded-3xl border border-[#2F2F2F] bg-[#1E1E1E] hover:bg-[#252525] shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-[#3B82F6]/60 hover:shadow-xl flex flex-col h-full ${
        isSelected
          ? "border-[#3B82F6] ring-1 ring-[#3B82F6]"
          : ""
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
            <Square className="w-5 h-5 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white drop-shadow-md" />
          )}
        </div>
      )}

      {/* ─── Thumbnail ─────────────────────────────────── */}
      <div className="relative aspect-[16/10] w-full bg-neutral-950 overflow-hidden flex-shrink-0 rounded-t-3xl">
        {imgSrc && !imageError ? (
          <>
            {/* Ambient blurred background filler */}
            <img
              src={imgSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-125 pointer-events-none"
            />
            {/* Crisp full image without cropping */}
            <img
              src={imgSrc}
              alt={project.title}
              className={`relative z-[1] w-full h-full object-contain transition-transform duration-700 ease-out block ${
                isSelected ? "scale-105 opacity-90" : "group-hover:scale-105"
              }`}
              onError={() => {
                if (imgSrc.includes("/api/proxy-image") && project.cover_image) {
                  setImgSrc(project.cover_image);
                } else {
                  setImageError(true);
                }
              }}
            />
            {/* Seamless gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none z-[2]" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-[#121212] p-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] flex items-center justify-center shadow-md transition-transform group-hover:scale-110 duration-300">
              <Sparkles className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <span className="text-[11px] text-[#E5E5E5] font-bold font-mono tracking-wider text-center line-clamp-1">
              {formatEpisodeLabel(project.episode) || project.title || "CHAPTER PROJECT"}
            </span>
            <span className="text-[9px] text-[#9CA3AF] font-mono">
              Ready for Creative Studio
            </span>
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/40 backdrop-blur-[2px] z-10">
          <div className="h-11 w-11 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] flex items-center justify-center shadow-xl scale-75 group-hover:scale-100 transition-transform duration-200 border border-[#60A5FA]/40">
            <Play className="h-4 w-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Top badges row */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {/* Status badge */}
          <div
            className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded-full border backdrop-blur-md shadow-md ${statusColor}`}
          >
            {project.status || "Draft"}
          </div>

          {/* 3-dot menu */}
          <div
            className="relative z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleMenu?.(e, project.project_id);
              }}
              aria-label="Project actions & options"
              title="Project actions & options"
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-[#3B82F6] text-neutral-300 hover:text-white border border-white/20 hover:border-[#60A5FA] transition-all flex items-center justify-center cursor-pointer active:scale-90 shadow-lg backdrop-blur-md"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom thumbnail badges */}
        <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-between pointer-events-none">
          {project.episode !== undefined && project.episode !== null ? (
            <div className="px-2 py-0.5 bg-black/80 backdrop-blur-md border border-[#2F2F2F] rounded-lg text-[9px] font-extrabold text-white tracking-wider shadow-md flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
              <span>{formatEpisodeLabel(project.episode)}</span>
            </div>
          ) : (
            <div />
          )}

          <div className="px-2 py-0.5 bg-black/80 backdrop-blur-md border border-[#2F2F2F] rounded-lg text-[9px] font-bold text-[#9CA3AF] tracking-wider shadow-md flex items-center gap-1 font-mono">
            <Clock className="w-2.5 h-2.5 text-[#6B7280]" />
            <span>{timeAgo(project.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Dropdown menu — at card level so thumbnail overflow-hidden doesn't clip it */}
      {openMenuId === project.project_id && (
        <div
          className="absolute right-2 top-11 w-52 bg-[#0c0d16]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
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
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] group-hover/item:bg-[#3B82F6]/20 group-hover/item:text-[#60A5FA] transition-colors">
              <Play className="w-3.5 h-3.5 fill-purple-400/20" />
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
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover/item:bg-blue-500/20 group-hover/item:text-blue-300 transition-colors">
              <FolderOpen className="w-3.5 h-3.5" />
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
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover/item:bg-blue-500/20 group-hover/item:text-blue-300 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
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
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover/item:bg-emerald-500/20 group-hover/item:text-emerald-300 transition-colors">
              <Download className="w-3.5 h-3.5" />
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
                const url = `${window.location.origin}/scraper?id=${encodeURIComponent(
                  project.project_id
                )}`;
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
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:bg-white/[0.08] hover:text-white rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover/item:bg-amber-500/20 group-hover/item:text-amber-300 transition-colors">
              <Link className="w-3.5 h-3.5" />
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
            className="group/item w-full text-left px-2.5 py-1.5 text-xs font-mono font-medium text-rose-400 hover:bg-rose-500/15 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover/item:bg-rose-500/20 group-hover/item:text-rose-300 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">Delete</span>
          </button>
        </div>
      )}

      {/* ─── Card Body ─────────────────────────────────── */}
      <div className="p-4 sm:p-4.5 flex flex-col flex-1 gap-2.5 relative z-10">
        {/* Source label */}
        <div className="flex items-center gap-1.5">
          <SourceIcon className="h-3 w-3 text-neutral-500" />
          <span className="text-[10.5px] text-neutral-500 font-mono tracking-wider uppercase truncate">
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
            className="text-sm sm:text-base font-extrabold text-[#E5E5E5] leading-snug line-clamp-1 group-hover:text-[#3B82F6] transition-colors duration-200"
            title={titleText}
          >
            {titleText}
          </h3>
        )}

        {/* Genre + Author row */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {project.genre && (
            <span className="text-[10px] bg-[#121212] text-[#3B82F6] border border-[#3B82F6]/30 px-2 py-0.5 rounded-md font-bold font-mono">
              {project.genre}
            </span>
          )}
          {project.author && (
            <span className="text-[11px] text-[#9CA3AF] font-medium truncate">
              {project.author}
            </span>
          )}
        </div>

        {/* ─── Footer ───────────────────────────────────── */}
        <div className="pt-1.5 mt-auto flex items-center justify-between gap-2">
          {/* Storyboard Panels & Imported Assets Counts */}
          <div className="flex items-center gap-2.5 text-xs font-mono truncate">
            {/* Storyboard Count */}
            <div
              className="flex items-center gap-1 text-[#3B82F6]"
              title={`${project.panels_count ?? 0} Storyboard Panels`}
            >
              <Film className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
              <span className="font-bold text-neutral-200">
                {project.panels_count ?? 0}
              </span>
              <span className="text-[10px] text-neutral-400">panels</span>
            </div>

            {/* Imported Assets Count */}
            <div
              className="flex items-center gap-1 text-blue-400"
              title={`${project.imported_assets_count ?? 0} Imported Assets`}
            >
              <Layers className="h-3.5 w-3.5 shrink-0 text-blue-400" />
              <span className="font-bold text-neutral-200">
                {project.imported_assets_count ?? 0}
              </span>
              <span className="text-[10px] text-neutral-400">assets</span>
            </div>
          </div>

          {/* Compact Resume Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProject(project);
            }}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-xl border border-[#60A5FA]/40 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-black/50 active:scale-95 shrink-0"
          >
            <span>Resume</span>
            <ArrowRight className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      {/* Processing shimmer bar */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800 z-20">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-amber-500 animate-shimmer"
            style={{ width: "100%", backgroundSize: "200% 100%" }}
          />
        </div>
      )}
    </div>
  );
}
