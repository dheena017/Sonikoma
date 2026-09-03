import React from "react";
import {
  CheckSquare,
  Download,
  Edit2,
  ExternalLink,
  Film,
  FolderOpen,
  Link,
  MoreVertical,
  Play,
  Scissors,
  Square,
  Trash2,
} from "lucide-react";
import { getProxiedImageUrl, getSourceIcon, getSourceName } from "@/utils";
import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";

interface ProjectsTableProps {
  projects: Project[];
  selectedProjects: Set<string>;
  openMenuId: string | null;
  onToggleMenu: (e: React.MouseEvent, projectId: string) => void;
  toggleSelectAll: () => void;
  toggleSelection: (e: React.MouseEvent, projectId: string) => void;
  onOpenProject: (project: Project) => void;
  onOpenDetails: (e: React.MouseEvent, project: Project) => void;
  onRename: (e: React.MouseEvent, project: Project) => void;
  onExport: (e: React.MouseEvent, project: Project) => void;
  onCopyLink: (e: React.MouseEvent, project: Project) => void;
  onDelete: (e: React.MouseEvent, projectId: string) => void;
}

export default function ProjectsTable({
  projects,
  selectedProjects,
  openMenuId,
  onToggleMenu,
  toggleSelectAll,
  toggleSelection,
  onOpenProject,
  onOpenDetails,
  onRename,
  onExport,
  onCopyLink,
  onDelete,
}: ProjectsTableProps) {
  const allSelected =
    projects.length > 0 && selectedProjects.size === projects.length;

  return (
    <div className="overflow-x-auto bg-[#0c0d12]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl min-h-[340px] pb-12">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-[#12131e]/90 border-b border-white/10 text-neutral-400 uppercase tracking-wider font-semibold text-[10px] font-mono">
          <tr>
            <th className="p-4 w-12 text-center">
              <button
                onClick={toggleSelectAll}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5 text-[#3B82F6]" />
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
        <tbody className="divide-y divide-white/5">
          {projects.map((project, idx) => {
            const isSelected = selectedProjects.has(project.project_id);
            const isProcessing =
              project.status?.toLowerCase() === "processing" ||
              project.status?.toLowerCase() === "exporting";
            const SourceIcon = getSourceIcon?.(project.url) || ExternalLink;
            const openUpward = idx >= projects.length - 2 && projects.length > 2;

            return (
              <tr
                key={project.project_id}
                onClick={() => onOpenProject(project)}
                className={`group cursor-pointer transition-colors relative ${
                  isSelected
                    ? "bg-purple-900/10 hover:bg-neutral-900/40"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <td className="p-4 text-center">
                  <button
                    onClick={(e) => toggleSelection(e, project.project_id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "text-[#3B82F6]"
                        : "text-neutral-600 hover:text-white"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#3B82F6]" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 rounded-xl bg-neutral-900 border border-white/10 overflow-hidden flex-shrink-0 relative shadow-md">
                      {project.cover_image ? (
                        <img
                          src={
                            project.cover_image.startsWith("http")
                              ? `/api/proxy-image?url=${encodeURIComponent(
                                  project.cover_image
                                )}`
                              : project.cover_image
                          }
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-[#93C5FD] transition-colors flex items-center gap-2">
                        {project.title}
                        {project.episode !== undefined &&
                          project.episode !== null && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA]">
                              EP {project.episode}
                            </span>
                          )}
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <SourceIcon className="w-3 h-3 text-[#3B82F6]" />
                        <span>{project.author || "Webtoon Project"}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        project.status === "ready"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : project.status === "failed"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20"
                      }`}
                    >
                      {project.status || "draft"}
                    </span>
                    {isProcessing && (
                      <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-blue-500 animate-shimmer"
                          style={{ width: "100%", backgroundSize: "200% 100%" }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4 text-neutral-400">{project.genre || "-"}</td>
                <td className="p-4 text-neutral-400 font-mono text-xs">
                  {new Date(project.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <div className="font-bold text-white font-mono">
                    {project.panels_count || project.imported_assets_count || 0}
                  </div>
                  {project.imported_assets_count &&
                  project.panels_count &&
                  project.panels_count !== project.imported_assets_count ? (
                    <div className="text-[10px] text-neutral-500 font-normal font-mono">
                      {project.imported_assets_count} imported
                    </div>
                  ) : null}
                </td>
                <td className="p-4 relative">
                  <button
                    onClick={(e) => onToggleMenu(e, project.project_id)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === project.project_id && (
                    <div
                      className={`absolute right-4 w-52 bg-[#0c0d16]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5 ${
                        openUpward ? "bottom-12" : "top-12"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onOpenProject(project);
                          onToggleMenu(e, project.project_id);
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
                          onOpenDetails(e, project);
                          onToggleMenu(e, project.project_id);
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
                          onRename(e, project);
                          onToggleMenu(e, project.project_id);
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
                          onExport(e, project);
                          onToggleMenu(e, project.project_id);
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
                          onCopyLink(e, project);
                          onToggleMenu(e, project.project_id);
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
                          onDelete(e, project.project_id);
                          onToggleMenu(e, project.project_id);
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
