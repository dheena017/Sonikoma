import React from "react";
import ProjectsPageHeader from "./ProjectsPageHeader.js";
import ProjectsFilters from "./ProjectsFilters.js";
import ProjectsStats from "./ProjectsStats.js";
import ProjectsPageResultView from "./ProjectsPageResultView.js";
import type { Project, ViewMode } from "./hooks/ProjectTypes.js";

export interface ProjectsPageViewProps {
  projectsLength: number;
  filteredProjects: Project[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: string;
  genreFilter: string;
  sortBy: string;
  viewMode: ViewMode;
  selectedProjects: Set<string>;
  openMenuId: string | null;
  renamingProjectId: string | null;
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
  uniqueGenres: string[];
  setSearchQuery: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setGenreFilter: (value: string) => void;
  setSortBy: (value: string) => void;
  setViewMode: (value: ViewMode) => void;
  handleNewSeries: () => void;
  handleOpenProject: (project: Project) => void;
  handleExport: (e: React.MouseEvent, project: Project) => void;
  handleRename: (e: React.MouseEvent, project: Project) => void;
  handleOpenDetails: (e: React.MouseEvent, project: Project) => void;
  handleCopyLink: (e: React.MouseEvent, project: Project) => void;
  handleDeleteSingle: (e: React.MouseEvent, projectId: string) => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  toggleSelection: (e: React.MouseEvent, projectId: string) => void;
  toggleMenu: (e: React.MouseEvent, projectId: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  saveProjectName: (projectId: string, newName: string) => Promise<void>;
}

export default function ProjectsPageView({
  projectsLength,
  filteredProjects,
  loading,
  error,
  searchQuery,
  statusFilter,
  genreFilter,
  sortBy,
  viewMode,
  selectedProjects,
  openMenuId,
  renamingProjectId,
  stats,
  uniqueGenres,
  setSearchQuery,
  setStatusFilter,
  setGenreFilter,
  setSortBy,
  setViewMode,
  handleNewSeries,
  handleOpenProject,
  handleExport,
  handleRename,
  handleOpenDetails,
  handleCopyLink,
  handleDeleteSingle,
  handleBulkDelete,
  toggleSelection,
  toggleMenu,
  toggleSelectAll,
  clearSelection,
  saveProjectName,
}: ProjectsPageViewProps) {
  return (
    <div className="w-full min-h-full bg-[#070709] text-neutral-100 flex flex-col pt-6 px-6 sm:px-12 md:px-20 lg:px-32 animate-fade-in relative z-10 pb-32">
      <ProjectsPageHeader onNewSeries={handleNewSeries} />

      {!loading && projectsLength > 0 && (
        <ProjectsStats
          stats={stats}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          showTabs={true}
        />
      )}

      {!loading && projectsLength > 0 && (
        <ProjectsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          genreFilter={genreFilter}
          onGenreChange={setGenreFilter}
          genres={uniqueGenres}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      <div>
        <ProjectsPageResultView
          projectsLength={projectsLength}
          filteredProjects={filteredProjects}
          loading={loading}
          error={error}
          viewMode={viewMode}
          selectedProjects={selectedProjects}
          openMenuId={openMenuId}
          onToggleMenu={toggleMenu}
          toggleSelection={toggleSelection}
          toggleSelectAll={toggleSelectAll}
          onOpenProject={handleOpenProject}
          onOpenDetails={handleOpenDetails}
          onRename={handleRename}
          onExport={handleExport}
          onCopyLink={handleCopyLink}
          onDelete={handleDeleteSingle}
          renamingProjectId={renamingProjectId}
          onSaveRename={saveProjectName}
          clearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
        />
      </div>
    </div>
  );
}
