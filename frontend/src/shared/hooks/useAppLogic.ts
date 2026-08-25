import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useAppState } from "@/shared/hooks/useAppState";
import * as api from "@/api/index";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { usePlaybackEngine } from "./usePlaybackEngine";
import { usePipelineActions } from "./usePipelineActions";

/** Helper to format chapter title display (e.g. "Chapter 15 - The Awakening") */
export function formatEpisodeString(chapterNumber = "", chapterTitle = ""): string {
  const num = (chapterNumber || "").trim();
  const name = (chapterTitle || "").trim();
  if (num && name) return `Chapter ${num} - ${name}`;
  if (num) return `Chapter ${num}`;
  if (name) return name;
  return "";
}

/** Helper to normalize and proxy raw image URLs */
export function normalizeScrapedImageUrls(images: any[]): string[] {
  if (!Array.isArray(images)) return [];
  const rawUrls = images.map((img) => (typeof img === "string" ? img : img?.url || ""));
  return rawUrls
    .filter(Boolean)
    .map((img) => (img.startsWith("http") && !api.isApiUrl(img) ? api.getProxyImageUrl(img) : img));
}

export function useAppLogic() {
  const state = useAppState();
  const { targetUrl, selectedSource, selectedModel } = state;

  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const lastScrapedUrlRef = useRef<string>("");
  const isGeneratingRef = useRef(false);

  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState<boolean>(false);

  // ── 1. AI Storyboard Generation ───────────────────────────────────────────
  const handleGenerateStoryboardAI = useCallback(
    async (overrides?: {
      title?: string;
      episode?: string;
      genre?: string;
      author?: string;
      cover_image?: string;
      synopsis?: string;
    }) => {
      if (isGeneratingStoryboard || isGeneratingRef.current) return;
      isGeneratingRef.current = true;

      const activeUrl = targetUrl;
      const projId = state.projectId;
      if (!activeUrl || !activeUrl.trim() || !projId) {
        state.addNotification("Please ensure target URL is pasted and project is created.", "error");
        isGeneratingRef.current = false;
        return;
      }

      setIsGeneratingStoryboard(true);
      state.addNotification("Starting timeline generation...", "info");
      state.setConsoleLogs((prev) => [
        `[Smart Timeline] Triggering timeline generation for project: ${projId}...`,
        ...prev,
      ]);

      try {
        const formattedEpisode = overrides?.episode || formatEpisodeString(state.chapterNumber, state.chapterTitle);

        const data = await api.generateStoryboard(state.fetchWithInterceptor, {
          url: activeUrl.trim(),
          project_id: projId,
          model: selectedModel,
          narrationStyle: state.narrationStyle,
          title: overrides?.title?.trim() || state.seriesTitle?.trim() || undefined,
          episode: formattedEpisode || undefined,
          genre: overrides?.genre?.trim() || state.scrapedGenre?.trim() || undefined,
          author: overrides?.author?.trim() || state.seriesAuthor?.trim() || undefined,
          cover_image: overrides?.cover_image?.trim() || state.seriesCoverImage?.trim() || undefined,
          synopsis: overrides?.synopsis?.trim() || state.seriesSynopsis?.trim() || undefined,
        });

        if (data.success && data.panels) {
          const mappedPanels = data.panels.map((p: any, idx: number) => ({
            ...p,
            id: p.id || idx + 1,
            grayscale: p.grayscale === 1 || p.grayscale === true,
          }));
          state.setPanels(mappedPanels);
          state.setConsoleLogs((prev) => [
            `[Smart Timeline] [SUCCESS] Timeline generated with ${mappedPanels.length} panels!`,
            ...prev,
          ]);
          state.addNotification(`Timeline generated successfully with ${mappedPanels.length} panels!`, "success");
        } else {
          throw new Error(data.message || "Invalid response from AI Model Analysis");
        }
      } catch (err: any) {
        console.error("[Smart Timeline] Generation failed:", err);
        state.setConsoleLogs((prev) => [
          `[Smart Timeline] [ERROR] Generation failed: ${err.message || String(err)}`,
          ...prev,
        ]);
        state.addNotification(`Timeline generation failed: ${err.message || String(err)}`, "error");
      } finally {
        setIsGeneratingStoryboard(false);
        isGeneratingRef.current = false;
      }
    },
    [
      isGeneratingStoryboard,
      targetUrl,
      state.projectId,
      selectedModel,
      state.narrationStyle,
      state.seriesTitle,
      state.chapterNumber,
      state.chapterTitle,
      state.scrapedGenre,
      state.seriesAuthor,
      state.seriesCoverImage,
      state.seriesSynopsis,
      state.fetchWithInterceptor,
      state.setPanels,
      state.setConsoleLogs,
      state.addNotification,
    ]
  );

  // ── 2. Playback Engine ────────────────────────────────────────────────────
  const {
    currentPanelIndex,
    setCurrentPanelIndex,
    playbackTime,
    setPlaybackTime,
    storyboardPlaying,
    setStoryboardPlaying,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
    playStoryboardAudio,
  } = usePlaybackEngine({
    panels: state.panels,
    volume: state.volume,
    isMuted: state.isMuted,
    musicTheme: state.musicTheme,
    voiceActor: state.voiceActor,
    autoPlayAudio: state.autoPlayAudio,
    sfxEnabled: state.sfxEnabled,
    sfxVolume: state.sfxVolume,
    bgmVolume: state.bgmVolume,
    audioDucking: state.audioDucking,
    activePreviewTab: state.activePreviewTab,
    videoPlayerRef,
  });

  // ── 3. Pipeline Actions ───────────────────────────────────────────────────
  const {
    isProcessing,
    progressStatus,
    isScraping,
    mergingIndices,
    reprocessingPanelId,
    isSavingEdit,
    handleGenerateVideo,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    handleStitchWithNext,
    handleTriggerReprocess,
    isRendering,
    renderProgress,
    renderEtaSeconds,
    handleRenderFinalVideo,
    addPanelsToStoryboard,
    handleCleanBubblesSelected,
    handleAutoCropSelected,
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,
    isBatchCropping,
    batchProgress,
    croppingImgUrl,
    handleCancelBatch,
  } = usePipelineActions({
    state,
    setCurrentPanelIndex,
    setPlaybackTime,
    setStoryboardPlaying,
    playStoryboardAudio,
  });

  // ── 4. Scrape Single Chapter URL ──────────────────────────────────────────
  const scrapeImages = useCallback(
    async (overrideUrl?: string, overrideProjectId?: string) => {
      const activeUrl = (overrideUrl || targetUrl || "").trim();
      if (!activeUrl) {
        state.addNotification("Please enter a valid comic URL to import.", "warning");
        return false;
      }

      state.setIsScraping(true);
      state.setConsoleLogs((prev) => [
        `[Scraper] Starting import from: ${activeUrl}`,
        ...prev,
      ]);

      try {
        const targetProjectId = overrideProjectId || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const data = await api.scrapeChapter(state.fetchWithInterceptor, {
          url: activeUrl,
          project_id: targetProjectId,
          bypass_cache: false,
          proxy_images: true,
          filter_banners: true,
        });

        if (data.success && data.images && data.images.length > 0) {
          const finalImages = normalizeScrapedImageUrls(data.images);
          state.setScrapedImages(finalImages);
          state.setSelectedScraped([]);

          const title = data.series?.title || state.seriesTitle || "Untitled Comic";
          const author = data.series?.author || state.seriesAuthor || "";
          const cover = data.series?.cover_image || state.seriesCoverImage || finalImages[0] || "";
          const synopsis = data.series?.description || state.seriesSynopsis || "";
          const genre = data.series?.genres?.join(", ") || state.scrapedGenre || "";

          state.setProjectId(targetProjectId);

          useProjectStore.getState().setActiveProject({
            project: {
              project_id: targetProjectId,
              title,
              url: activeUrl,
              author,
              cover_image: cover,
              synopsis,
              genre,
            },
            panels: [],
            scrapedImages: finalImages,
          });

          state.setIsScraping(false);
          state.addNotification(`Successfully imported ${finalImages.length} images!`, "success");
          return true;
        } else {
          throw new Error(data.message || "No images found at this URL.");
        }
      } catch (err: any) {
        console.error("[Scraper] Import error:", err);
        state.setIsScraping(false);
        state.addNotification(`Import failed: ${err.message || String(err)}`, "error");
        return false;
      }
    },
    [targetUrl, state]
  );

  // ── 5. Scrape Batch Episodes ──────────────────────────────────────────────
  const scrapeBatchEpisodes = useCallback(
    async (episodesList: Array<{ url: string; number?: string; title?: string }>, overrideProjectId?: string) => {
      if (!episodesList || episodesList.length === 0) return;

      state.setIsScraping(true);
      const allImages: string[] = [];

      state.setConsoleLogs((prev) => [
        `[Batch Import] Starting batch import for ${episodesList.length} chapters...`,
        ...prev,
      ]);

      for (let i = 0; i < episodesList.length; i++) {
        const ep = episodesList[i];
        if (!ep.url) continue;

        try {
          const data = await api.scrapeChapter(state.fetchWithInterceptor, {
            url: ep.url.trim(),
            project_id: overrideProjectId,
            bypass_cache: false,
            proxy_images: true,
            filter_banners: true,
          });

          if (data.success && data.images) {
            allImages.push(...normalizeScrapedImageUrls(data.images));
          }
        } catch (err) {
          console.error(`[Batch Import] Failed chapter ${ep.number || i + 1}:`, err);
        }
      }

      state.setScrapedImages(allImages);
      state.setIsScraping(false);
      state.addNotification(`Batch import finished! ${allImages.length} total images loaded.`, "success");
    },
    [state]
  );

  const totalCalculatedDuration = useMemo(
    () => state.panels.reduce((sum, p) => sum + (p.duration || 3.0), 0),
    [state.panels]
  );

  return useMemo(
    () => ({
      ...state,
      videoPlayerRef,
      currentPanelIndex,
      setCurrentPanelIndex,
      playbackTime,
      setPlaybackTime,
      storyboardPlaying,
      setStoryboardPlaying,
      toggleStoryboardPlayback,
      resetStoryboardPlayback,
      playStoryboardAudio,
      isProcessing,
      progressStatus,
      isScraping,
      mergingIndices,
      reprocessingPanelId,
      isSavingEdit,
      handleGenerateVideo,
      handleSaveEditedImage,
      handleSaveMultipleCuts,
      handleStitchWithNext,
      handleTriggerReprocess,
      isRendering,
      renderProgress,
      renderEtaSeconds,
      handleRenderFinalVideo,
      addPanelsToStoryboard,
      handleCleanBubblesSelected,
      handleAutoCropSelected,
      totalCalculatedDuration,
      isCleaningBubbles,
      cleanProgress,
      bubbleCroppingImgUrl,
      isBatchCropping,
      batchProgress,
      croppingImgUrl,
      handleCancelBatch,
      scrapeImages,
      scrapeBatchEpisodes,
      isGeneratingStoryboard,
      handleGenerateStoryboardAI,
    }),
    [
      state,
      currentPanelIndex,
      playbackTime,
      storyboardPlaying,
      toggleStoryboardPlayback,
      resetStoryboardPlayback,
      playStoryboardAudio,
      isProcessing,
      progressStatus,
      isScraping,
      mergingIndices,
      reprocessingPanelId,
      isSavingEdit,
      handleGenerateVideo,
      handleSaveEditedImage,
      handleSaveMultipleCuts,
      handleStitchWithNext,
      handleTriggerReprocess,
      isRendering,
      renderProgress,
      renderEtaSeconds,
      handleRenderFinalVideo,
      addPanelsToStoryboard,
      handleCleanBubblesSelected,
      handleAutoCropSelected,
      totalCalculatedDuration,
      isCleaningBubbles,
      cleanProgress,
      bubbleCroppingImgUrl,
      isBatchCropping,
      batchProgress,
      croppingImgUrl,
      handleCancelBatch,
      scrapeImages,
      scrapeBatchEpisodes,
      isGeneratingStoryboard,
      handleGenerateStoryboardAI,
    ]
  );
}
