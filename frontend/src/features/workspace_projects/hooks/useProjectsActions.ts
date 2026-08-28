import { useCallback } from "react";
import type { MouseEvent } from "react";
import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";
import { useProjectStore } from "@/shared/hooks/useProjectStore";

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

function navigate(url: string) {
  const nav = (window as any).navigateTo;
  if (typeof nav === "function") {
    nav(url);
  } else {
    window.history.pushState({}, "", url);
    window.dispatchEvent(new Event("popstate"));
  }
}

function showNotification(
  message: string,
  title = "Notice",
  variant: "emerald" | "rose" | "blue" = "emerald"
) {
  if (typeof (window as any).alertAsync === "function") {
    (window as any).alertAsync(message, title, variant);
  } else if (typeof (window as any).addNotification === "function") {
    (window as any).addNotification(
      message,
      variant === "rose" ? "error" : "success"
    );
  } else {
    console.log(`[${title}] ${message}`);
  }
}

export function useProjectsActions(): UseProjectsActionsHandlers {
  const handleNewSeries = useCallback(() => {
    useProjectStore.getState().clearActiveProject();
    localStorage.removeItem("active_project_id");
    localStorage.removeItem("active_job_id");
    localStorage.removeItem("active_series_slug");
    localStorage.removeItem("active_chapter_slug");
    localStorage.removeItem("auto_import_url");
    localStorage.removeItem("auto_import_batch");

    navigate("/scraper");
  }, []);

  const handleOpenProject = useCallback((project: Project) => {
    const jobId = project.job_id;
    useProjectStore.getState().setActiveProjectId(project.project_id);
    useProjectStore.getState().hydrateActiveProject(project.project_id);

    if (project.series_slug && project.chapter_slug) {
      navigate(
        `/scraper/editor/series/${project.series_slug}/chapters/${
          project.chapter_slug
        }?project_id=${encodeURIComponent(project.project_id)}${
          jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""
        }`
      );
    } else if (jobId) {
      navigate(
        `/scraper/editor?project_id=${encodeURIComponent(
          project.project_id
        )}&job_id=${encodeURIComponent(jobId)}`
      );
    } else {
      navigate(
        `/scraper/editor?project_id=${encodeURIComponent(project.project_id)}`
      );
    }
  }, []);

  const handleOpenCreativeSuite = useCallback(
    async (e: MouseEvent, project: Project) => {
      e.stopPropagation();
      useProjectStore.getState().setActiveProjectId(project.project_id);
      await useProjectStore.getState().hydrateActiveProject(project.project_id);

      navigate(
        `/creative-suite?project_id=${encodeURIComponent(project.project_id)}`
      );
    },
    []
  );

  const handleExport = useCallback((e: MouseEvent, project: Project) => {
    e.stopPropagation();
    navigate(
      `/scraper?id=${encodeURIComponent(project.project_id)}&export=true`
    );
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
    if (project.series_slug) {
      navigate(`/projects/${encodeURIComponent(project.series_slug)}`);
    } else {
      navigate(`/scraper?id=${encodeURIComponent(project.project_id)}`);
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
        : `${window.location.origin}/scraper?id=${encodeURIComponent(
            project.project_id
          )}${jobId ? `&job_id=${encodeURIComponent(jobId)}` : ""}`;
    navigator.clipboard.writeText(url);
    showNotification("Project link copied to clipboard!", "Success", "emerald");
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

      let confirmed = false;
      if (typeof (window as any).confirmAsync === "function") {
        confirmed = await (window as any).confirmAsync(
          "Are you sure you want to permanently delete this project? This action cannot be undone.",
          "Delete Project",
          "rose"
        );
      } else {
        confirmed = window.confirm(
          "Are you sure you want to permanently delete this project? This action cannot be undone."
        );
      }

      if (confirmed) {
        try {
          const token =
            localStorage.getItem("sonikoma_token") ||
            sessionStorage.getItem("sonikoma_token");
          const res = await fetch(`/api/projects/${projectId}`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await res.json();
          if (data.success || res.ok) {
            onDeleteSuccess(projectId);
            showNotification("Project deleted successfully.", "Deleted", "emerald");
          } else {
            throw new Error(data.detail || "Failed to delete");
          }
        } catch (err: any) {
          showNotification(
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

      let confirmed = false;
      if (typeof (window as any).confirmAsync === "function") {
        confirmed = await (window as any).confirmAsync(
          `Are you sure you want to delete ${selectedIds.length} selected projects? This action cannot be undone.`,
          "Bulk Delete",
          "rose"
        );
      } else {
        confirmed = window.confirm(
          `Are you sure you want to delete ${selectedIds.length} selected projects? This action cannot be undone.`
        );
      }

      if (confirmed) {
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
          if (data.success || res.ok) {
            onDeleteSuccess(selectedIds);
            showNotification(
              `Successfully deleted ${data.deleted_count || selectedIds.length} projects.`,
              "Deleted",
              "emerald"
            );
          } else {
            throw new Error(data.detail || "Failed to batch delete");
          }
        } catch (err: any) {
          showNotification(
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
