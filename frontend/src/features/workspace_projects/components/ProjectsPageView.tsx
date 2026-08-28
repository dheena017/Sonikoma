import React from "react";
import { FolderOpen, Layers, Zap, Clock, ArrowRight } from "lucide-react";
import ProjectsPageHeader from "@/features/workspace_projects/components/ProjectsPageHeader";
import ProjectsFilters from "@/features/workspace_projects/components/ProjectsFilters";
import ProjectsStats from "@/features/workspace_projects/components/ProjectsStats";
import ProjectsPageResultView from "@/features/workspace_projects/components/ProjectsPageResultView";
import type {
  Project,
  ViewMode,
} from "@/features/workspace_projects/hooks/ProjectTypes";
import type { Series } from "@/features/workspace_projects/utils/seriesGrouping";

export interface ProjectsPageViewProps {
  projectsLength: number;
  filteredProjects: Project[];
  filteredSeries: Series[];
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
  handleOpenSeries: (series: Series) => void;
  handleOpenCreativeSuite: (e: React.MouseEvent, project: Project) => void;
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
  filteredSeries,
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
  handleOpenSeries,
  handleOpenCreativeSuite,
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
    <div className="w-full flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-7 relative overflow-hidden text-left">
        <ProjectsPageHeader onNewSeries={handleNewSeries} stats={stats} />

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
            filteredSeries={filteredSeries}
            loading={loading}
            error={error}
            viewMode={viewMode}
            selectedProjects={selectedProjects}
            openMenuId={openMenuId}
            onToggleMenu={toggleMenu}
            toggleSelection={toggleSelection}
            toggleSelectAll={toggleSelectAll}
            onOpenSeries={handleOpenSeries}
            onOpenCreativeSuite={handleOpenCreativeSuite}
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
    </div>
  );
}
