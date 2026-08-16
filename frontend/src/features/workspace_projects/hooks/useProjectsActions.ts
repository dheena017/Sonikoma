import { useCallback } from "react";
import type { MouseEvent } from "react";
import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";
import { useProjectStore } from "@/store/useProjectStore";

export interface UseProjectsActionsHandlers {
  handleNewSeries: () => void;
  handleOpenProject: (project: Project) => void;
  handleOpenCreativeSuite: (e: MouseEvent, project: Project) => Promise<void>;
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
    (window as any).navigateTo?.("/scraper");
  }, []);

  const handleOpenProject = useCallback((project: Project) => {
    const jobId = project.job_id;
    useProjectStore.getState().setActiveProjectId(project.project_id);
    useProjectStore.getState().hydrateActiveProject(project.project_id);

    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/scraper/editor/series/${project.series_slug}/chapters/${
          project.chapter_slug
        }?project_id=${encodeURIComponent(project.project_id)}${
          jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""
        }`
      );
    } else if (jobId) {
      (window as any).navigateTo?.(
        `/scraper/editor?project_id=${encodeURIComponent(
          project.project_id
        )}&job_id=${encodeURIComponent(jobId)}`
      );
    } else {
      (window as any).navigateTo?.(
        `/scraper/editor?project_id=${encodeURIComponent(project.project_id)}`
      );
    }
  }, []);

  const handleOpenCreativeSuite = useCallback(
    async (e: MouseEvent, project: Project) => {
      e.stopPropagation();
      useProjectStore.getState().setActiveProjectId(project.project_id);
      await useProjectStore.getState().hydrateActiveProject(project.project_id);

      const nav = (window as any).navigateTo;
      const targetUrl = `/creative-suite?project_id=${encodeURIComponent(
        project.project_id
      )}`;
      if (typeof nav === "function") {
        nav(targetUrl);
      } else {
        window.history.pushState({}, "", targetUrl);
        window.dispatchEvent(new Event("popstate"));
      }
    },
    []
  );

  const handleExport = useCallback((e: MouseEvent, project: Project) => {
    e.stopPropagation();
    const jobId = project.job_id;
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/scraper/editor/series/${project.series_slug}/chapters/${
          project.chapter_slug
        }${jobId ? `?job_id=${encodeURIComponent(jobId)}` : ""}`
      );
    } else {
      (window as any).navigateTo?.(
        `/scraper/editor?project_id=${project.project_id}${
          jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""
        }`
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
    const jobId = project.job_id;
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/scraper/editor/series/${project.series_slug}/chapters/${
          project.chapter_slug
        }${jobId ? `?job_id=${encodeURIComponent(jobId)}` : ""}`
      );
    } else {
      (window as any).navigateTo?.(
        `/scraper/editor?project_id=${project.project_id}${
          jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""
        }`
      );
    }
  }, []);

  const handleCopyLink = useCallback((e: MouseEvent, project: Project) => {
    e.stopPropagation();
    const jobId = project.job_id;
    const url =
      project.series_slug && project.chapter_slug
        ? `${window.location.origin}/scraper/editor/series/${
            project.series_slug
          }/chapters/${project.chapter_slug}${
            jobId ? `?job_id=${encodeURIComponent(jobId)}` : ""
          }`
        : `${window.location.origin}/scraper?project_id=${project.project_id}${
            jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""
          }`;
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
          const token =
            localStorage.getItem("sonikoma_token") ||
            sessionStorage.getItem("sonikoma_token");
          const res = await fetch(`/api/projects/${projectId}`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
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
          const token =
            localStorage.getItem("sonikoma_token") ||
            sessionStorage.getItem("sonikoma_token");
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
          const res = await fetch(`/api/projects/batch-delete`, {
            method: "POST",
            headers,
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
    handleOpenCreativeSuite,
    handleExport,
    handleRename,
    handleOpenDetails,
    handleCopyLink,
    handleDeleteSingle,
    handleBulkDelete,
  };
}
