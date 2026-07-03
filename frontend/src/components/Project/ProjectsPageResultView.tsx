import React from "react";
import { FolderOpen, Loader2, Search, Activity } from "lucide-react";
import type { Project } from "./hooks/ProjectTypes.js";
import ProjectCard from "./ProjectCard.js";
import ProjectsTable from "./hooks/ProjectsTable.js";
import BulkActionFooter from "./BulkActionFooter.js";

interface ProjectsPageResultViewProps {
  projectsLength: number;
  filteredProjects: Project[];
  loading: boolean;
  error: string | null;
  viewMode: "grid" | "list";
  selectedProjects: Set<string>;
  openMenuId: string | null;
  onToggleMenu: (e: React.MouseEvent, projectId: string) => void;
  toggleSelection: (e: React.MouseEvent, projectId: string) => void;
  toggleSelectAll: () => void;
  onOpenProject: (project: Project) => void;
  onOpenDetails: (e: React.MouseEvent, project: Project) => void;
  onRename: (e: React.MouseEvent, project: Project) => void;
  onExport: (e: React.MouseEvent, project: Project) => void;
  onCopyLink: (e: React.MouseEvent, project: Project) => void;
  onDelete: (e: React.MouseEvent, projectId: string) => void;
  renamingProjectId: string | null;
  onSaveRename: (projectId: string, newName: string) => Promise<void>;
  clearSelection: () => void;
  onBulkDelete: () => Promise<void>;
}

export default function ProjectsPageResultView({
  projectsLength,
  filteredProjects,
  loading,
  error,
  viewMode,
  selectedProjects,
  openMenuId,
  onToggleMenu,
  toggleSelection,
  toggleSelectAll,
  onOpenProject,
  onOpenDetails,
  onRename,
  onExport,
  onCopyLink,
  onDelete,
  renamingProjectId,
  onSaveRename,
  clearSelection,
  onBulkDelete,
}: ProjectsPageResultViewProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-neutral-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto mt-10">
        <div className="w-16 h-16 rounded-3xl bg-red-900/20 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
          <Activity className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Failed to load projects</h3>
        <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (projectsLength === 0) {
    return (
      <div className="border border-white/5 bg-[#0b0b0e]/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto mt-10">
        <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mb-4">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No projects yet</h3>
        <p className="text-sm text-neutral-400 max-w-sm mb-6 font-mono">
          You haven't created any storyboard series yet. Start by scraping a webtoon URL!
        </p>
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto bg-neutral-900 rounded-full flex items-center justify-center text-neutral-600 mb-4">
          <Search className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
        <p className="text-neutral-500">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => {
            const isSelected = selectedProjects.has(project.project_id);
            return (
              <ProjectCard
                key={project.project_id}
                project={project}
                onOpenProject={onOpenProject}
                onRename={(e, projectItem) => onRename(e, projectItem)}
                onExport={(e, projectItem) => onExport(e, projectItem)}
                onOpenDetails={(e, projectItem) => onOpenDetails(e, projectItem)}
                onDelete={(e, projectId) => onDelete(e, projectId)}
                onCopyLink={(e, projectItem) => onCopyLink(e, projectItem)}
                isSelected={isSelected}
                onToggleSelect={(e, projectId) => toggleSelection(e, projectId)}
                showSelection
                openMenuId={openMenuId}
                onToggleMenu={(e, projectId) => onToggleMenu(e, projectId)}
                renamingProjectId={renamingProjectId}
                onSaveRename={(projectId, newName) => onSaveRename(projectId, newName)}
              />
            );
          })}
        </div>
      ) : (
        <ProjectsTable
          projects={filteredProjects}
          selectedProjects={selectedProjects}
          openMenuId={openMenuId}
          onToggleMenu={onToggleMenu}
          toggleSelectAll={toggleSelectAll}
          toggleSelection={toggleSelection}
          onOpenProject={onOpenProject}
          onOpenDetails={onOpenDetails}
          onRename={onRename}
          onExport={onExport}
          onCopyLink={onCopyLink}
          onDelete={onDelete}
        />
      )}

      {selectedProjects.size > 0 && (
        <BulkActionFooter
          selectedCount={selectedProjects.size}
          clearSelection={clearSelection}
          onBulkDelete={onBulkDelete}
        />
      )}
    </>
  );
}
