import React from "react";
import {
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
import { getProxiedImageUrl, getSourceIcon, getSourceName } from "../../../utils.js";
import type { Project } from "./ProjectTypes.js";

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
  const allSelected = projects.length > 0 && selectedProjects.size === projects.length;

  return (
    <div className="overflow-x-auto bg-[#111115] border border-neutral-800 rounded-xl">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-[#1c1c21] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold text-[10px]">
          <tr>
            <th className="p-4 w-12 text-center">
              <button
                onClick={toggleSelectAll}
                className="hover:text-white transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5 text-purple-400" />
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
        <tbody className="divide-y divide-neutral-800/50">
          {projects.map((project) => {
            const isSelected = selectedProjects.has(project.project_id);
            const isProcessing =
              project.status?.toLowerCase() === "processing" ||
              project.status?.toLowerCase() === "exporting";
            const SourceIcon = getSourceIcon?.(project.url) || ExternalLink;

            return (
              <tr
                key={project.project_id}
                onClick={() => onOpenProject(project)}
                className={`group cursor-pointer transition-colors relative ${
                  isSelected
                    ? "bg-purple-900/10 hover:bg-purple-900/20"
                    : "hover:bg-white/5"
                }`}
              >
                <td className="p-4 text-center">
                  <button
                    onClick={(e) => toggleSelection(e, project.project_id)}
                    className={`transition-colors ${
                      isSelected
                        ? "text-purple-400"
                        : "text-neutral-600 hover:text-white"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-neutral-900 overflow-hidden relative border border-neutral-800">
                      {project.cover_image ? (
                        <img
                          src={getProxiedImageUrl(project.cover_image)}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FolderOpen className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-700" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                        {project.title || "Untitled Series"}
                        <SourceIcon className="h-3 w-3 text-neutral-600" />
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {project.episode !== undefined && project.episode !== null ? `EP ${project.episode} • ` : ""}
                        {project.author || "Unknown"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1.5 min-w-[100px]">
                    <div
                      className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border self-start ${
                        project.status?.toLowerCase() === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : project.status?.toLowerCase() === "processing"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                          : "bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}
                    >
                      {project.status || "Draft"}
                    </div>
                    {isProcessing && (
                      <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-purple-500 animate-shimmer"
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
                  <div className="font-bold text-white">{project.panels_count || 0}</div>
                </td>
                <td className="p-4 relative">
                  <button
                    onClick={(e) => onToggleMenu(e, project.project_id)}
                    className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === project.project_id && (
                    <div className="absolute right-8 top-10 w-40 bg-[#16161b] border border-white/10 rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in duration-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProject(project);
                          onToggleMenu(e, project.project_id);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume
                      </button>
                      <button
                        onClick={(e) => onOpenDetails(e, project)}
                        className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Details
                      </button>
                      <button
                        onClick={(e) => onRename(e, project)}
                        className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Edit2 className="h-3.5 h-3.5" /> Rename
                      </button>
                      <button
                        onClick={(e) => onExport(e, project)}
                        className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Download className="h-3.5 h-3.5" /> Export
                      </button>
                      <button
                        onClick={(e) => onCopyLink(e, project)}
                        className="w-full text-left px-4 py-2 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                      >
                        <Link className="w-3.5 h-3.5" /> Copy Link
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      <button
                        onClick={(e) => onDelete(e, project.project_id)}
                        className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
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
