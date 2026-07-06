import { useCallback } from "react";
import type { MouseEvent } from "react";
import type { Project } from "./ProjectTypes.js";

export interface UseProjectsActionsHandlers {
  handleNewSeries: () => void;
  handleOpenProject: (project: Project) => void;
  handleExport: (e: MouseEvent, project: Project) => void;
  handleRename: (
    e: MouseEvent,
    project: Project,
    onRename: (id: string) => void
  ) => void;
  handleOpenDetails: (e: MouseEvent, project: Project) => void;
  handleCopyLink: (e: MouseEvent, project: Project) => void;
  handleDeleteSingle: (
    e: MouseEvent,
    projectId: string,
    onDeleteSuccess: (id: string) => void,
    onMenuClose: () => void
  ) => Promise<void>;
  handleBulkDelete: (
    selectedIds: string[],
    onDeleteSuccess: (ids: string[]) => void
  ) => Promise<void>;
}

export function useProjectsActions(): UseProjectsActionsHandlers {
  const handleNewSeries = useCallback(() => {
    (window as any).navigateTo?.("/workspace");
  }, []);

  const handleOpenProject = useCallback((project: Project) => {
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/workspace/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
      );
    } else {
      (window as any).navigateTo?.(`/workspace/editor?id=${project.project_id}`);
    }
  }, []);

  const handleExport = useCallback((e: MouseEvent, project: Project) => {
    e.stopPropagation();
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/workspace/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
      );
    } else {
      (window as any).navigateTo?.(
        `/workspace/editor?id=${project.project_id}`
      );
    }
  }, []);

  const handleRename = useCallback(
    (e: MouseEvent, project: Project, onRename: (id: string) => void) => {
      e.stopPropagation();
      onRename(project.project_id);
    },
    []
  );

  const handleOpenDetails = useCallback((e: MouseEvent, project: Project) => {
    e.stopPropagation();
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/workspace/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
      );
    } else {
      (window as any).navigateTo?.(`/workspace/editor?id=${project.project_id}`);
    }
  }, []);

  const handleCopyLink = useCallback((e: MouseEvent, project: Project) => {
    e.stopPropagation();
    const url =
      project.series_slug && project.chapter_slug
        ? `${window.location.origin}/workspace/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
        : `${window.location.origin}/workspace?id=${project.project_id}`;
    navigator.clipboard.writeText(url);
    (window as any).alertAsync?.(
      "Link copied to clipboard!",
      "Success",
      "emerald"
    );
  }, []);

  const handleDeleteSingle = useCallback(
    async (
      e: MouseEvent,
      projectId: string,
      onDeleteSuccess: (id: string) => void,
      onMenuClose: () => void
    ) => {
      e.stopPropagation();
      onMenuClose();

      if (
        await (window as any).confirmAsync?.(
          "Are you sure you want to permanently delete this project? This action cannot be undone.",
          "Delete Project",
          "rose"
        )
      ) {
        try {
          const res = await fetch(`/api/projects/${projectId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("sonikoma_token") ||
                sessionStorage.getItem("sonikoma_token") ||
                ""
              }`,
            },
          });
          const data = await res.json();
          if (data.success) {
            onDeleteSuccess(projectId);
            (window as any).alertAsync?.(
              "Project deleted successfully.",
              "Deleted"
            );
          } else {
            throw new Error(data.detail || "Failed to delete");
          }
        } catch (err: any) {
          (window as any).alertAsync?.(
            err.message || "Failed to delete project.",
            "Error",
            "rose"
          );
        }
      }
    },
    []
  );

  const handleBulkDelete = useCallback(
    async (selectedIds: string[], onDeleteSuccess: (ids: string[]) => void) => {
      if (selectedIds.length === 0) return;

      if (
        await (window as any).confirmAsync?.(
          `Are you sure you want to delete ${selectedIds.length} selected projects? This action cannot be undone.`,
          "Bulk Delete",
          "rose"
        )
      ) {
        try {
          const res = await fetch(`/api/projects/batch-delete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${
                localStorage.getItem("sonikoma_token") ||
                sessionStorage.getItem("sonikoma_token") ||
                ""
              }`,
            },
            body: JSON.stringify({ project_ids: selectedIds }),
          });
          const data = await res.json();
          if (data.success) {
            onDeleteSuccess(selectedIds);
            (window as any).alertAsync?.(
              `Successfully deleted ${data.deleted_count} projects.`,
              "Deleted"
            );
          } else {
            throw new Error(data.detail || "Failed to batch delete");
          }
        } catch (err: any) {
          (window as any).alertAsync?.(
            err.message || "Failed to delete projects.",
            "Error",
            "rose"
          );
        }
      }
    },
    []
  );

  return {
    handleNewSeries,
    handleOpenProject,
    handleExport,
    handleRename,
    handleOpenDetails,
    handleCopyLink,
    handleDeleteSingle,
    handleBulkDelete,
  };
}
