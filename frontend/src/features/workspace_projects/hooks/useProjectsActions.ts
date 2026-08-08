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
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/scraper/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
      );
    } else {
      (window as any).navigateTo?.(`/scraper/editor?id=${project.project_id}`);
    }
  }, []);

  const handleOpenCreativeSuite = useCallback(
    async (e: MouseEvent, project: Project) => {
      e.stopPropagation();
      try {
        const token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token") ||
          "";
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/projects/${project.project_id}`, {
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          const loadedSettings = data.project?.audio_settings || {};
          const savedScrapedImages =
            Array.isArray(data.scraped_images) && data.scraped_images.length > 0
              ? data.scraped_images
              : loadedSettings.scraped_images;
          const scrapedImages =
            Array.isArray(savedScrapedImages) && savedScrapedImages.length > 0
              ? savedScrapedImages
              : (data.panels || []).map((p: any) => p.image_url).filter(Boolean);

          useProjectStore.getState().setActiveProject({
            project: data.project,
            panels: data.panels || [],
            scrapedImages,
          });
        }
      } catch (err) {
        console.error("Failed to load project for Creative Suite", err);
      }

      const nav = (window as any).navigateTo;
      if (typeof nav === "function") {
        nav("/creative-suite");
      } else {
        window.history.pushState({}, "", "/creative-suite");
        window.dispatchEvent(new Event("popstate"));
      }
    },
    []
  );

  const handleExport = useCallback((e: MouseEvent, project: Project) => {
    e.stopPropagation();
    if (project.series_slug && project.chapter_slug) {
      (window as any).navigateTo?.(
        `/scraper/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
      );
    } else {
      (window as any).navigateTo?.(
        `/scraper/editor?id=${project.project_id}`
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
        `/scraper/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
      );
    } else {
      (window as any).navigateTo?.(`/scraper/editor?id=${project.project_id}`);
    }
  }, []);

  const handleCopyLink = useCallback((e: MouseEvent, project: Project) => {
    e.stopPropagation();
    const url =
      project.series_slug && project.chapter_slug
        ? `${window.location.origin}/scraper/editor/series/${project.series_slug}/chapters/${project.chapter_slug}`
        : `${window.location.origin}/scraper?id=${project.project_id}`;
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
