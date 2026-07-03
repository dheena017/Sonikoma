import { useCallback } from "react";
import type { MouseEvent } from "react";
import type { Project } from "./ProjectTypes.js";
import {
  useProjectsData,
  useProjectsFilters,
  useProjectsSelection,
  useProjectsMenu,
  useProjectsActions,
  useProjectsComputed,
} from "./index.js";

export interface ProjectsPageState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: string;
  genreFilter: string;
  sortBy: string;
  viewMode: "grid" | "list";
  selectedProjects: Set<string>;
  openMenuId: string | null;
  renamingProjectId: string | null;
  saveProjectName: (projectId: string, newName: string) => Promise<void>;
  setSearchQuery: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setGenreFilter: (value: string) => void;
  setSortBy: (value: string) => void;
  setViewMode: (value: "grid" | "list") => void;
  toggleSelection: (e: MouseEvent, projectId: string) => void;
  toggleMenu: (e: MouseEvent, projectId: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  handleNewSeries: () => void;
  handleOpenProject: (project: Project) => void;
  handleExport: (e: MouseEvent, project: Project) => void;
  handleRename: (e: MouseEvent, project: Project) => void;
  handleOpenDetails: (e: MouseEvent, project: Project) => void;
  handleCopyLink: (e: MouseEvent, project: Project) => void;
  handleDeleteSingle: (e: MouseEvent, projectId: string) => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
  uniqueGenres: string[];
  filteredProjects: Project[];
}

export default function useProjectsPage(): ProjectsPageState {
  const dataState = useProjectsData();
  const filtersState = useProjectsFilters();
  const selectionState = useProjectsSelection();
  const menuState = useProjectsMenu();
  const actionsState = useProjectsActions();
  const computedState = useProjectsComputed(
    dataState.projects,
    filtersState.searchQuery,
    filtersState.statusFilter,
    filtersState.genreFilter,
    filtersState.sortBy
  );

  // Wrapped action handlers that integrate with other hooks
  const handleExport = useCallback(
    (e: MouseEvent, project: Project) => {
      actionsState.handleExport(e, project);
      menuState.closeMenu();
    },
    [actionsState, menuState]
  );

  const handleRename = useCallback(
    (e: MouseEvent, project: Project) => {
      actionsState.handleRename(e, project, menuState.setRenamingProjectId);
      menuState.closeMenu();
    },
    [actionsState, menuState]
  );

  const handleOpenDetails = useCallback(
    (e: MouseEvent, project: Project) => {
      actionsState.handleOpenDetails(e, project);
      menuState.closeMenu();
    },
    [actionsState, menuState]
  );

  const handleCopyLink = useCallback(
    (e: MouseEvent, project: Project) => {
      actionsState.handleCopyLink(e, project);
      menuState.closeMenu();
    },
    [actionsState, menuState]
  );

  const handleDeleteSingle = useCallback(
    async (e: MouseEvent, projectId: string) => {
      await actionsState.handleDeleteSingle(
        e,
        projectId,
        (id: string) => {
          dataState.setProjects(
            dataState.projects.filter((p) => p.project_id !== id)
          );
          selectionState.setSelectedProjects(
            new Set(
              Array.from(selectionState.selectedProjects).filter(
                (pid) => pid !== id
              )
            )
          );
        },
        menuState.closeMenu
      );
    },
    [actionsState, dataState, selectionState, menuState]
  );

  const handleBulkDelete = useCallback(async () => {
    const selectedIds = Array.from(selectionState.selectedProjects);
    await actionsState.handleBulkDelete(selectedIds, (ids: string[]) => {
      dataState.setProjects(
        dataState.projects.filter((p) => !ids.includes(p.project_id))
      );
      selectionState.setSelectedProjects(new Set());
    });
  }, [actionsState, dataState, selectionState]);

  const handleToggleSelectAll = useCallback(() => {
    selectionState.toggleSelectAll(computedState.filteredProjects);
  }, [selectionState, computedState.filteredProjects]);

  return {
    projects: dataState.projects,
    loading: dataState.loading,
    error: dataState.error,
    searchQuery: filtersState.searchQuery,
    statusFilter: filtersState.statusFilter,
    genreFilter: filtersState.genreFilter,
    sortBy: filtersState.sortBy,
    viewMode: filtersState.viewMode,
    selectedProjects: selectionState.selectedProjects,
    openMenuId: menuState.openMenuId,
    renamingProjectId: menuState.renamingProjectId,
    saveProjectName: menuState.saveProjectName,
    setSearchQuery: filtersState.setSearchQuery,
    setStatusFilter: filtersState.setStatusFilter,
    setGenreFilter: filtersState.setGenreFilter,
    setSortBy: filtersState.setSortBy,
    setViewMode: filtersState.setViewMode,
    toggleSelection: selectionState.toggleSelection,
    toggleMenu: menuState.toggleMenu,
    toggleSelectAll: handleToggleSelectAll,
      clearSelection: selectionState.clearSelection,
    handleNewSeries: actionsState.handleNewSeries,
    handleOpenProject: actionsState.handleOpenProject,
    handleExport,
    handleRename,
    handleOpenDetails,
    handleCopyLink,
    handleDeleteSingle,
    handleBulkDelete,
    stats: computedState.stats,
    uniqueGenres: computedState.uniqueGenres,
    filteredProjects: computedState.filteredProjects,
  };
}
