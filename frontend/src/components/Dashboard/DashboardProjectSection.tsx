import React from "react";
import { Film, Activity, ExternalLink } from "lucide-react";
import { getSourceIcon } from "@/utils";
import ProjectCard from "../Project/ProjectCard.js";
import type { Project } from "../Project/hooks/ProjectTypes";

interface DashboardProjectSectionProps {
  themeMode: string;
  loading: boolean;
  error: string | null;
  projects: Project[];
  searchQuery: string;
  filteredProjects: Project[];
  openMenuId: string | null;
  renamingProjectId: string | null;
  onRetry: () => void;
  onNewSeries: () => void;
  onOpenProject: (project: Project) => void;
  onRename: (e: React.MouseEvent, project: Project) => void;
  onExport: (e: React.MouseEvent, project: Project) => void;
  onDelete: (e: React.MouseEvent, projectId: string) => void;
  onToggleMenu: (e: React.MouseEvent, projectId: string) => void;
  onSaveRename: (projectId: string, newName: string) => void;
}

export default function DashboardProjectSection({
  themeMode,
  loading,
  error,
  projects,
  searchQuery,
  filteredProjects,
  openMenuId,
  renamingProjectId,
  onRetry,
  onNewSeries,
  onOpenProject,
  onRename,
  onExport,
  onDelete,
  onToggleMenu,
  onSaveRename,
}: DashboardProjectSectionProps) {
  const projectList = searchQuery ? filteredProjects : projects;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Film className="h-5 w-5 text-purple-400" />
          Recent Series
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-lg shadow-purple-500/20">
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
              alt="Loading..."
              className="w-full h-full rounded-[10px] object-cover p-[2px]"
              style={{
                background: themeMode === "light" ? "#ffffff" : "#000000",
              }}
            />
          </div>
        </div>
      ) : error ? (
        <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
            <Activity className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Failed to load projects
          </h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
            <Film className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No series yet</h3>
          <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
            You haven't created any storyboard series yet. Start by scraping a
            webtoon URL!
          </p>
          <button
            onClick={onNewSeries}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all cursor-pointer"
          >
            Start New Series
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projectList.slice(0, 6).map((project) => (
            <ProjectCard
              key={project.project_id}
              project={project}
              onOpenProject={onOpenProject}
              onRename={(e, projectItem) => onRename(e, projectItem)}
              onExport={(e, projectItem) => onExport(e, projectItem)}
              onDelete={(e, projectId) => onDelete(e, projectId)}
              openMenuId={openMenuId}
              onToggleMenu={(e, projectId) => onToggleMenu(e, projectId)}
              renamingProjectId={renamingProjectId}
              onSaveRename={onSaveRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
