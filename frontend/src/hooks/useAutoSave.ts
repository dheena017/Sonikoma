import { useEffect, useRef, useState, useMemo } from "react";
import { GeneratedPanel } from "../types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveState {
  projectId: string | null;
  setProjectId?: (id: string | null) => void;
  seriesTitle: string;
  chapterNumber: string;
  chapterTitle: string;
  scrapedGenre: string;
  seriesAuthor: string;
  seriesCoverImage: string;
  seriesSynopsis: string;
  panels: GeneratedPanel[];
  scrapedImages: string[];
  targetUrl: string;
  fetchWithInterceptor: typeof fetch;
  addNotification?: (
    message: string,
    type: any,
    options?: {
      errorCode?: number;
      retryDelay?: number;
      onRetry?: () => void;
      details?: string;
      link?: string;
    }
  ) => void;
  accumulatedTokens?: number;
  setAccumulatedTokens?: (val: React.SetStateAction<number>) => void;
}

export function useAutoSave(state: AutoSaveState) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSavedStateRef = useRef<string>("");

  // Memoize the serialized representation of the editable workspace to prevent heavy JSON.stringify on every single render.
  const serializedState = useMemo(() => {
    return JSON.stringify({
      title: state.seriesTitle.trim(),
      genre: state.scrapedGenre.trim(),
      chapterNumber: state.chapterNumber.trim(),
      chapterTitle: state.chapterTitle.trim(),
      author: state.seriesAuthor.trim(),
      cover_image: state.seriesCoverImage.trim(),
      synopsis: state.seriesSynopsis.trim(),
      scraped_images: state.scrapedImages,
      panels: state.panels.map((p) => ({
        image_url: p.image_url,
        original_url: p.original_url || null,
        speech_text: p.speech_text || "",
        sfx: p.sfx || "",
        duration: p.duration || 4.5,
        motion_type: p.motion_type || "zoom_in",
        visual_description: p.visual_description || null,
        brightness: p.brightness ?? null,
        contrast: p.contrast ?? null,
        saturation: p.saturation ?? null,
        grayscale: p.grayscale ? 1 : 0,
        filter_preset: p.filter_preset || null,
        bubble_method: p.bubble_method || null,
        bubble_sensitivity: p.bubble_sensitivity ?? null,
        bubble_dilation: p.bubble_dilation ?? null,
        inpaint_radius: p.inpaint_radius ?? null,
        detection_style: p.detection_style || null,
      })),
    });
  }, [
    state.seriesTitle,
    state.scrapedGenre,
    state.chapterNumber,
    state.chapterTitle,
    state.seriesAuthor,
    state.seriesCoverImage,
    state.seriesSynopsis,
    state.scrapedImages,
    state.panels,
  ]);

  // Helper to serialize all editable aspects of the project
  const getSerializedState = () => serializedState;

  // Compute dirty state on every render based on serializations
  const isDirty =
    state.projectId && !state.projectId.startsWith("temp_")
      ? serializedState !== lastSavedStateRef.current
      : false;

  const prevProjectIdRef = useRef<string | null>(null);
  const wasScrapedImagesLoadedRef = useRef<boolean>(false);

  // Reset or initialize state ref when switching projects
  useEffect(() => {
    if (state.projectId) {
      console.log(
        `[Save Hook] Switched project to ${state.projectId}. Initializing state ref.`
      );
      prevProjectIdRef.current = state.projectId;
      wasScrapedImagesLoadedRef.current = false;
      lastSavedStateRef.current = getSerializedState();
      setSaveStatus("idle");
    } else {
      prevProjectIdRef.current = null;
      wasScrapedImagesLoadedRef.current = false;
      lastSavedStateRef.current = "";
      setSaveStatus("idle");
    }
  }, [state.projectId]);

  // Sync state when scrapedImages first loads asynchronously
  useEffect(() => {
    if (
      state.projectId &&
      state.scrapedImages &&
      state.scrapedImages.length > 0 &&
      !wasScrapedImagesLoadedRef.current
    ) {
      console.log(
        "[Save Hook] Scraped images initially populated. Syncing initial state ref."
      );
      wasScrapedImagesLoadedRef.current = true;
      lastSavedStateRef.current = getSerializedState();
    }
  }, [state.scrapedImages, state.projectId]);

  // Manual save trigger function
  const saveProject = async (
    customPanels?: GeneratedPanel[],
    options?: {
      savingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      hideNotifications?: boolean;
    }
  ) => {
    if (!state.projectId) return false;

    let targetProjectId = state.projectId;
    let isConvertingTemp = false;
    if (state.projectId.startsWith("temp_")) {
      targetProjectId =
        "proj_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 10);
      isConvertingTemp = true;
    }

    setSaveStatus("saving");
    if (!options?.hideNotifications) {
      state.addNotification?.(
        options?.savingMessage || "Saving project changes...",
        "info"
      );
    }
    try {
      console.log(
        `[Save Hook] Saving modifications for project: ${targetProjectId}...`
      );
      const targetPanels = customPanels || state.panels;

      const serializePanels = (panelsList: GeneratedPanel[]) => {
        return panelsList.map((p) => ({
          image_url: p.image_url,
          original_url: p.original_url || null,
          speech_text: p.speech_text || "",
          sfx: p.sfx || "",
          duration: p.duration || 4.5,
          motion_type: p.motion_type || "zoom_in",
          visual_description: p.visual_description || null,
          brightness: p.brightness ?? null,
          contrast: p.contrast ?? null,
          saturation: p.saturation ?? null,
          grayscale: p.grayscale ? 1 : 0,
          filter_preset: p.filter_preset || null,
          bubble_method: p.bubble_method || null,
          bubble_sensitivity: p.bubble_sensitivity ?? null,
          bubble_dilation: p.bubble_dilation ?? null,
          inpaint_radius: p.inpaint_radius ?? null,
          detection_style: p.detection_style || null,
        }));
      };

      const currentStateStr = JSON.stringify({
        title: state.seriesTitle.trim(),
        genre: state.scrapedGenre.trim(),
        chapterNumber: state.chapterNumber.trim(),
        chapterTitle: state.chapterTitle.trim(),
        author: state.seriesAuthor.trim(),
        cover_image: state.seriesCoverImage.trim(),
        synopsis: state.seriesSynopsis.trim(),
        scraped_images: state.scrapedImages,
        panels: serializePanels(targetPanels),
      });

      const formattedEpisode = (() => {
        const num = state.chapterNumber.trim();
        const name = state.chapterTitle.trim();
        if (num && name) return `Chapter ${num} - ${name}`;
        if (num) return `Chapter ${num}`;
        if (name) return name;
        return "";
      })();

      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/projects/${targetProjectId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          url: state.targetUrl || "",
          title: state.seriesTitle.trim() || "Untitled Project",
          genre: state.scrapedGenre.trim() || "general",
          episode: formattedEpisode || "Chapter 1",
          author: state.seriesAuthor.trim() || "Unknown Author",
          cover_image: state.seriesCoverImage.trim() || null,
          synopsis: state.seriesSynopsis.trim() || null,
          panels: targetPanels.map((p) => ({
            image_url: p.image_url,
            original_url: p.original_url || null,
            speech_text: p.speech_text || "",
            sfx: p.sfx || "",
            duration: p.duration || 4.5,
            motion_type: p.motion_type || "zoom_in",
            visual_description: p.visual_description || null,
            brightness: p.brightness ?? null,
            contrast: p.contrast ?? null,
            saturation: p.saturation ?? null,
            grayscale: p.grayscale || false,
            filter_preset: p.filter_preset || null,
            bubble_method: p.bubble_method || null,
            bubble_sensitivity: p.bubble_sensitivity ?? null,
            bubble_dilation: p.bubble_dilation ?? null,
            inpaint_radius: p.inpaint_radius ?? null,
            detection_style: p.detection_style || null,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        if (isConvertingTemp || data.series_slug) {
          state.setProjectId?.(targetProjectId);
          if (data.series_slug && data.chapter_slug) {
            const newPath = `/series/${data.series_slug}/chapters/${data.chapter_slug}`;
            const isEditor =
              window.location.pathname.startsWith("/editor") ||
              window.location.pathname === "/project-editor";
            if (window.location.pathname !== newPath && !isEditor) {
              window.history.pushState(null, "", newPath);
            }
          } else {
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete("project_id");
            urlParams.delete("url");
            urlParams.set("id", targetProjectId);
            window.history.pushState(
              null,
              "",
              window.location.pathname + "?" + urlParams.toString()
            );
          }
        }

        // Save raw scraped images cache list in database
        if (state.targetUrl) {
          try {
            console.log(
              `[Save Hook] Saving raw scraped images cache list to backend for URL: ${state.targetUrl}`
            );
            const scrapeRes = await fetch("/api/save-scraped-images", {
              method: "PUT",
              headers,
              body: JSON.stringify({
                url: state.targetUrl,
                images: state.scrapedImages,
              }),
            });
            if (!scrapeRes.ok) {
              console.warn(
                "[Save Hook] Failed to save updated scraped images cache."
              );
            }
          } catch (scrapeErr) {
            console.error(
              "[Save Hook] Error saving raw scraped images cache list:",
              scrapeErr
            );
          }
        }

        console.log("[Save Hook] Project saved successfully.");
        lastSavedStateRef.current = currentStateStr;
        setSaveStatus("saved");

        // Sync accumulated tokens if any exist
        if (state.accumulatedTokens && state.accumulatedTokens > 0) {
          try {
            await state.fetchWithInterceptor(
              `/api/projects/${data.project_id || targetProjectId}/tokens`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tokens: state.accumulatedTokens }),
              }
            );
            state.setAccumulatedTokens?.(0);
            console.log(
              `[Save Hook] Synced ${state.accumulatedTokens} tokens to project.`
            );
          } catch (tokenErr) {
            console.error(
              "[Save Hook] Failed to sync accumulated tokens:",
              tokenErr
            );
          }
        }
        const detailMsg = [
          `Project ID: ${targetProjectId}`,
          `Series Title: ${state.seriesTitle || "Untitled"}`,
          `Chapter: ${
            state.chapterNumber ? `Chapter ${state.chapterNumber}` : "N/A"
          }${state.chapterTitle ? ` - ${state.chapterTitle}` : ""}`,
          `Timeline Panels: ${state.panels.length} panels`,
          `Imported Source Images: ${state.scrapedImages.length} images`,
        ].join("\n");
        if (!options?.hideNotifications) {
          state.addNotification?.(
            options?.successMessage || "Project changes saved successfully!",
            "success",
            {
              details: detailMsg,
            }
          );
        }
        return true;
      } else {
        throw new Error(data.message || "Failed to save project.");
      }
    } catch (err: any) {
      console.error("[Save Hook] Error during save:", err);
      setSaveStatus("error");
      if (!options?.hideNotifications) {
        state.addNotification?.(
          options?.errorMessage ||
            err.message ||
            "Failed to save project changes.",
          "error",
          {
            details: err.stack || String(err),
          }
        );
      }
      return false;
    }
  };

  return { saveStatus, saveProject, isDirty };
}
