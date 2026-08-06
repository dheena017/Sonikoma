import React from "react";
import ProjectsPageView from "@/features/workspace_projects/components/ProjectsPageView";
import useProjectsPage from "@/features/workspace_projects/hooks/useProjectsPage";

export default function ProjectsPageContent() {
  const page = useProjectsPage();

  return (
    <ProjectsPageView
      projectsLength={page.projects.length}
      filteredProjects={page.filteredProjects}
      loading={page.loading}
      error={page.error}
      searchQuery={page.searchQuery}
      statusFilter={page.statusFilter}
      genreFilter={page.genreFilter}
      sortBy={page.sortBy}
      viewMode={page.viewMode}
      selectedProjects={page.selectedProjects}
      openMenuId={page.openMenuId}
      renamingProjectId={page.renamingProjectId}
      stats={page.stats}
      uniqueGenres={page.uniqueGenres}
      setSearchQuery={page.setSearchQuery}
      setStatusFilter={page.setStatusFilter}
      setGenreFilter={page.setGenreFilter}
      setSortBy={page.setSortBy}
      setViewMode={page.setViewMode}
      handleNewSeries={page.handleNewSeries}
      handleOpenProject={page.handleOpenProject}
      handleExport={page.handleExport}
      handleRename={page.handleRename}
      handleOpenDetails={page.handleOpenDetails}
      handleCopyLink={page.handleCopyLink}
      handleDeleteSingle={page.handleDeleteSingle}
      handleBulkDelete={page.handleBulkDelete}
      handleOpenCreativeSuite={page.handleOpenCreativeSuite}
      toggleSelection={page.toggleSelection}
      toggleMenu={page.toggleMenu}
      toggleSelectAll={page.toggleSelectAll}
      clearSelection={page.clearSelection}
      saveProjectName={page.saveProjectName}
    />
  );
}
