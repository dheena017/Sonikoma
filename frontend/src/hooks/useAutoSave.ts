import { useEffect, useRef, useState } from "react";
import { GeneratedPanel } from "../types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveState {
  projectId: string | null;
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
}

export function useAutoSave(state: AutoSaveState) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSavedStateRef = useRef<string>("");

  // Helper to serialize all editable aspects of the project
  const getSerializedState = () => {
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
  };

  // Compute dirty state on every render based on serializations
  const isDirty = state.projectId
    ? getSerializedState() !== lastSavedStateRef.current
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
  const saveProject = async (customPanels?: GeneratedPanel[]) => {
    if (!state.projectId) return false;

    setSaveStatus("saving");
    try {
      console.log(
        `[Save Hook] Saving modifications for project: ${state.projectId}...`
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
        localStorage.getItem("anivox_token") ||
        sessionStorage.getItem("anivox_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/projects/${state.projectId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
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
        const detailMsg = [
          `Project ID: ${state.projectId}`,
          `Series Title: ${state.seriesTitle || "Untitled"}`,
          `Chapter: ${
            state.chapterNumber ? `Chapter ${state.chapterNumber}` : "N/A"
          }${state.chapterTitle ? ` - ${state.chapterTitle}` : ""}`,
          `Storyboard Panels: ${state.panels.length} panels`,
          `Scraped Source Images: ${state.scrapedImages.length} images`,
        ].join("\n");
        state.addNotification?.(
          "Project changes saved successfully!",
          "success",
          {
            details: detailMsg,
          }
        );
        return true;
      } else {
        throw new Error(data.message || "Failed to save project.");
      }
    } catch (err: any) {
      console.error("[Save Hook] Error during save:", err);
      setSaveStatus("error");
      state.addNotification?.(
        err.message || "Failed to save project changes.",
        "error",
        {
          details: err.stack || String(err),
        }
      );
      return false;
    }
  };

  return { saveStatus, saveProject, isDirty };
}
