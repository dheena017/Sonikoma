import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useAppState } from "@/shared/hooks/useAppState";
import * as api from "@/api/index";
import { useProjectStore } from "@/store/useProjectStore";
import { usePlaybackEngine } from "./usePlaybackEngine";
import { usePipelineActions } from "./usePipelineActions";

export function useAppLogic() {
  const state = useAppState();
  const { targetUrl, selectedSource, selectedModel } = state;

  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const sourceMismatchNotified = useRef(false);
  const lastScrapedUrlRef = useRef<string>("");
  const saveProjectRef = useRef<any>(null);
  const isGeneratingRef = useRef(false);

  const [isGeneratingStoryboard, setIsGeneratingStoryboard] =
    useState<boolean>(false);

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
        state.addNotification(
          "Please ensure target URL is pasted and project is created.",
          "error"
        );
        isGeneratingRef.current = false;
        return;
      }

      setIsGeneratingStoryboard(true);
      state.addNotification("Starting timeline generation...", "info");
      state.setConsoleLogs((prev) => [
        `[Smart Timeline] Triggering timeline generation for project: ${projId}...`,
        `[Smart Timeline] Running OCR Transcription & Panel Slicing...`,
        ...prev,
      ]);

      try {
        const formattedEpisode = overrides?.episode
          ? overrides.episode
          : (() => {
              const num = state.chapterNumber.trim();
              const name = state.chapterTitle.trim();
              if (num && name) return `Chapter ${num} - ${name}`;
              if (num) return `Chapter ${num}`;
              if (name) return name;
              return "";
            })();

        const data = await api.generateStoryboard(state.fetchWithInterceptor, {
          url: activeUrl.trim(),
          project_id: projId,
          model: selectedModel,
          narrationStyle: state.narrationStyle,
          title:
            overrides?.title?.trim() ||
            (state.seriesTitle ? state.seriesTitle.trim() : undefined),
          episode: formattedEpisode || undefined,
          genre:
            overrides?.genre?.trim() ||
            (state.scrapedGenre ? state.scrapedGenre.trim() : undefined),
          author:
            overrides?.author?.trim() ||
            (state.seriesAuthor ? state.seriesAuthor.trim() : undefined),
          cover_image:
            overrides?.cover_image?.trim() ||
            (state.seriesCoverImage
              ? state.seriesCoverImage.trim()
              : undefined),
          synopsis:
            overrides?.synopsis?.trim() ||
            (state.seriesSynopsis ? state.seriesSynopsis.trim() : undefined),
        });

        if (data.success && data.panels) {
          const mappedPanels = data.panels.map((p: any, idx: number) => ({
            ...p,
            id: p.id || idx + 1,
            grayscale: p.grayscale === 1 || p.grayscale === true,
          }));
          state.setPanels(mappedPanels);

          state.setConsoleLogs((prev) => [
            `[Smart Timeline] [SUCCESS] Timeline generated successfully with ${mappedPanels.length} panels!`,
            ...prev,
          ]);

          state.addNotification(
            `Timeline generated successfully with ${mappedPanels.length} panels!`,
            "success"
          );
        } else {
          throw new Error(
            data.message || "Invalid response from System Model Analysis"
          );
        }
      } catch (err: any) {
        console.error("[Smart Timeline] Generation failed:", err);
        state.setConsoleLogs((prev) => [
          `[Smart Timeline] [ERROR] Generation failed: ${
            err.message || String(err)
          }`,
          ...prev,
        ]);
        state.addNotification(
          `Timeline generation failed: ${err.message || String(err)}`,
          "error"
        );
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
    saveProject: (...args: any[]) => saveProjectRef.current?.(...args),
  });

  // --- System Logs Engine ---
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollTimeout: any = null;
    let isPolling = false;
    let isCurrent = true;
    let pollIntervalMs = 5000;

    const lastLogIdRef = { current: 0 };
    const logBuffer: any[] = [];
    const flushInterval = 1000;

    const flushLogs = () => {
      if (logBuffer.length > 0) {
        const newEntries = [...logBuffer];
        logBuffer.length = 0;
        state.setConsoleLogs((prev) => {
          let updated = [...prev];
          for (const item of newEntries) {
            const itemMsg = typeof item === "string" ? item : item.message;
            const last = updated[updated.length - 1];
            const lastMsg = typeof last === "string" ? last : last?.message;
            if (lastMsg && itemMsg && lastMsg === itemMsg) {
              continue; // Drop duplicate repeated log
            }
            updated.push(item);
          }
          return updated.slice(-500);
        });
      }
    };

    const flushTimer = setInterval(flushLogs, flushInterval);

    const doPoll = async () => {
      if (!isCurrent || !isPolling) return;

      try {
        const data = await api.getSystemLogs(String(lastLogIdRef.current));
        pollIntervalMs = 5000;

        if (data.success && Array.isArray(data.logs)) {
          const newLogs = data.logs.filter(
            (log: any) => log.id > lastLogIdRef.current
          );

          if (newLogs.length > 0) {
            newLogs.forEach((log: any) => {
              if (log.id > lastLogIdRef.current) {
                lastLogIdRef.current = log.id;
              }
              logBuffer.push(log);
            });
          }
        }
      } catch {
        // Silent catch
      } finally {
        if (isCurrent && isPolling) {
          pollTimeout = setTimeout(doPoll, pollIntervalMs);
        }
      }
    };

    const startPolling = () => {
      if (isPolling) return;
      isPolling = true;
      pollTimeout = setTimeout(doPoll, pollIntervalMs);
    };

    const stopPolling = () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
        pollTimeout = null;
      }
      isPolling = false;
    };

    const connectSSE = () => {
      try {
        const token =
          localStorage.getItem("sonikoma_token") ||
          sessionStorage.getItem("sonikoma_token");

        const url = token
          ? `/api/system-logs/stream?token=${encodeURIComponent(token)}`
          : "/api/system-logs/stream";

        eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
          try {
            const entry = JSON.parse(event.data);
            if (entry && entry.id > lastLogIdRef.current) {
              lastLogIdRef.current = entry.id;
              logBuffer.push(entry);
            }
          } catch {
            // silent catch
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isCurrent) startPolling();
        };
      } catch {
        startPolling();
      }
    };

    connectSSE();

    return () => {
      isCurrent = false;
      if (eventSource) eventSource.close();
      stopPolling();
      clearInterval(flushTimer);
    };
  }, [state.setConsoleLogs]);

  const SOURCE_DOMAINS: Record<string, string[]> = {
    webtoons: ["webtoons.com", "webtoon.com"],
    webcomicsapp: ["webcomicsapp.com"],
    mangadex: ["mangadex.org", "mangadex.com"],
    toomics: ["toomics.com"],
    linewebtoon: ["webtoon.com", "webtoons.com"],
    asurascans: ["asuracomic.net", "asurascans.com", "asura.gg", "asuratoon.com"],
    manhuato: ["manhuato.com"],
    reaperscans: ["reaperscans.com"],
    flamecomics: ["flamecomics.xyz", "flamecomics.com", "flamecomics.me", "flamescans.org"],
    voidscans: ["voidscans.com", "void-scans.com"],
    luminousscans: ["luminousscans.com"],
    tapas: ["tapas.io"],
    tappytoon: ["tappytoon.com"],
    copincomics: ["copincomics.com"],
    pocketcomics: ["pocketcomics.com"],
    lezhin: ["lezhin.com", "lezhinus.com"],
    bilibilicomics: ["bilibilicomics.com"],
    mangatoon: ["mangatoon.mobi"],
    webnovel: ["webnovel.com"],
    manhuaplus: ["manhuaplus.com", "manhuaplus.org"],
    manhwaclan: ["manhwaclan.com"],
    "1stkissmanga": ["1stkissmanga.io", "1stkissmanga.com", "1stkissmanga.me"],
    mangakakalot: ["mangakakalot.com", "mangakakalot.tv", "readmangakakalot.com"],
    batoto: ["bato.to", "mangatoto.com", "battwo.com", "batocomic.com", "readtoto.com"],
    custom: [],
  };

  // --- Scraping ---
  const scrapeImages = useCallback(
    async (customUrl?: any, overrideProjectId?: string) => {
      const activeUrl = typeof customUrl === "string" ? customUrl : targetUrl;
      if (!activeUrl || !activeUrl.trim()) return false;

      const normalizedTargetUrl = activeUrl.trim();

      const currentHost = (() => {
        try {
          const urlWithScheme = normalizedTargetUrl.startsWith("http")
            ? normalizedTargetUrl
            : `https://${normalizedTargetUrl}`;
          return new URL(urlWithScheme).hostname.toLowerCase();
        } catch {
          return "";
        }
      })();

      const allowedHosts = SOURCE_DOMAINS[selectedSource] || [];

      const isDirectImage = Boolean(
        normalizedTargetUrl &&
          (normalizedTargetUrl
            .toLowerCase()
            .match(/\.(png|jpg|jpeg|webp|gif|svg|bmp|tiff)(\?|$)/) ||
            normalizedTargetUrl.startsWith("data:image/"))
      );

      // Auto-resolve source mismatch if host doesn't match selected source
      if (
        normalizedTargetUrl &&
        !isDirectImage &&
        selectedSource !== "custom" &&
        currentHost &&
        !allowedHosts.some(
          (allowedHost) =>
            currentHost === allowedHost ||
            currentHost.endsWith(`.${allowedHost}`)
        )
      ) {
        const matchedEntry = Object.entries(SOURCE_DOMAINS).find(
          ([key, hosts]) =>
            hosts.some(
              (h) => currentHost === h || currentHost.endsWith(`.${h}`)
            )
        );
        if (matchedEntry) {
          state.setSelectedSource(matchedEntry[0]);
        } else {
          state.setSelectedSource("custom");
        }
      }

      sourceMismatchNotified.current = false;
      state.setIsScraping(true);

      // Semantic URL separation check via Backend API
      try {
        const sep = await api.separateComicUrl(state.fetchWithInterceptor, normalizedTargetUrl);
        if (sep && sep.success) {
          if (sep.platform && sep.platform !== "unknown") {
            state.setSelectedSource(sep.platform);
          }
          if (sep.title_slug && !state.seriesTitle) {
            const formatted = sep.title_slug
              .replace(/[-_]+/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            state.setScrapedTitle(formatted);
          }
          if (sep.chapter_number && !state.chapterNumber) {
            state.setChapterNumber(sep.chapter_number);
          }
        }
      } catch (err) {
        console.debug("[useAppLogic] URL separation background check:", err);
      }

      state.setPanels([]);
      state.setScrapedImages([]);
      state.setSelectedScraped([]);
      setCurrentPanelIndex(0);
      setPlaybackTime(0);
      setStoryboardPlaying(false);

      state.setConsoleLogs((prev) => {
        const baseLogs = prev.filter((log) => {
          const msg = typeof log === "string" ? log : log.message || "";
          return !msg.startsWith("[Preloader]") && !msg.startsWith("[Scraper]");
        });

        return [
          `[Import] Spawned live import task to separate strip images from: ${normalizedTargetUrl}`,
          `[Model] Using System engine: ${selectedModel} for panel analysis`,
          `[Import] Selected source website: ${selectedSource}`,
          ...baseLogs,
        ];
      });

      try {
        const formattedEpisode = (() => {
          const num = state.chapterNumber.trim();
          const name = state.chapterTitle.trim();
          if (num && name) return `Chapter ${num} - ${name}`;
          if (num) return `Chapter ${num}`;
          if (name) return name;
          return "";
        })();

        const targetProjectId =
          overrideProjectId ||
          `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const data = await api.scrapeChapter(state.fetchWithInterceptor, {
          url: normalizedTargetUrl,
          project_id: targetProjectId,
          bypass_cache: false,
          proxy_images: true,
          filter_banners: true,
        });

        if (data.success && data.images && data.images.length > 0) {
          const rawImageUrls = data.images.map((img: any) =>
            typeof img === "string" ? img : img.url
          );
          const finalImages = rawImageUrls.map((img: string) =>
            img.startsWith("http") && !api.isApiUrl(img)
              ? api.getProxyImageUrl(img)
              : img
          );

          const origins: Record<string, string> = {};
          data.images.forEach((img: any) => {
            if (typeof img === "object" && img.url && img.origin) {
              origins[img.url] = img.origin;
            }
          });
          (window as any).__scrapeImageOrigins = origins;
          // Clear any stale batch episode groups so single-episode view renders cleanly
          (window as any).__scrapeEpisodeGroups = [];

          state.setScrapedImages(finalImages);
          state.setSelectedScraped([]);

          // Update series & chapter state if returned by scraper
          const returnedTitle =
            data.series?.title ||
            (state.seriesTitle ? state.seriesTitle.trim() : "");
          const returnedAuthor =
            data.series?.author ||
            (state.seriesAuthor ? state.seriesAuthor.trim() : "");
          const returnedCover =
            data.series?.cover_image ||
            (state.seriesCoverImage ? state.seriesCoverImage.trim() : "") ||
            (finalImages.length > 0 ? finalImages[0] : "");
          const returnedSynopsis =
            data.series?.description ||
            (state.seriesSynopsis ? state.seriesSynopsis.trim() : "");
          const returnedGenre =
            data.series?.genres && data.series.genres.length > 0
              ? data.series.genres.join(", ")
              : state.scrapedGenre
              ? state.scrapedGenre.trim()
              : "";
          const returnedChapterNum =
            data.chapter?.number != null
              ? String(data.chapter.number)
              : state.chapterNumber.trim();
          const returnedChapterTitle =
            data.chapter?.title || state.chapterTitle.trim();

          if (returnedTitle && !state.seriesTitle)
            state.setSeriesTitle(returnedTitle);
          if (returnedAuthor && !state.seriesAuthor)
            state.setSeriesAuthor(returnedAuthor);
          if (returnedCover && !state.seriesCoverImage)
            state.setSeriesCoverImage(returnedCover);
          if (returnedSynopsis && !state.seriesSynopsis)
            state.setSeriesSynopsis(returnedSynopsis);
          if (returnedGenre && !state.scrapedGenre)
            state.setScrapedGenre(returnedGenre);
          if (returnedChapterNum && !state.chapterNumber)
            state.setChapterNumber(returnedChapterNum);
          if (returnedChapterTitle && !state.chapterTitle)
            state.setChapterTitle(returnedChapterTitle);

          state.setProjectId(targetProjectId);

          useProjectStore.getState().setActiveProject({
            project: {
              project_id: targetProjectId,
              job_id: null,
              title: returnedTitle,
              url: normalizedTargetUrl,
              series_slug: null,
              chapter_slug: null,
              author: returnedAuthor,
              cover_image: returnedCover,
              synopsis: returnedSynopsis,
              genre: returnedGenre,
              chapterNumber: returnedChapterNum,
              chapterTitle: returnedChapterTitle,
            },
            panels: [],
            scrapedImages: finalImages,
          });

          setCurrentPanelIndex(0);
          setPlaybackTime(0);
          setStoryboardPlaying(false);

          const totalCount = data.scrape?.image_count ?? finalImages.length;
          state.setConsoleLogs((prev) => {
            const filtered = prev.filter((log) => {
              const msg = typeof log === "string" ? log : log.message || "";
              return !msg.startsWith("[Scraper] Spawned live scraping task");
            });
            return [
              `[Scraper] Extraction completed. Total assets returned: ${totalCount}`,
              `[API] Adaptive chapter scrape response received — Assets: ${totalCount} | Completeness: ${
                data.scrape?.completeness || "COMPLETE"
              }`,
              ...filtered,
            ];
          });

          state.setIsScraping(false);
          return true;
        } else {
          state.setIsScraping(false);
          state.setScrapedImages([]);
          state.setPanels([]);

          const errMsg =
            data.error?.message ||
            data.message ||
            "Unable to find comic panels on this page. Please check the URL and try again.";
          state.addNotification(errMsg, "error");
          return false;
        }
      } catch (err: any) {
        state.setIsScraping(false);
        state.setScrapedImages([]);
        state.setPanels([]);
        state.setConsoleLogs((prev) => [
          `[Scraper] [ERROR] Scrape failed: ${err.message || "Unknown error"}`,
          ...prev,
        ]);

        if (!err.intercepted) {
          const errMsg =
            err.message ||
            "Failed to retrieve comic panels from the specified URL.";
          state.addNotification(
            `Service unable to access target site. Check the URL or refresh the page. (${errMsg})`,
            "error",
            {
              details: `Error Details: ${
                err.message || String(err)
              }\nStack Trace: ${
                err.stack || "N/A"
              }\nTarget URL: ${normalizedTargetUrl}\nSelected Source Portal: ${selectedSource}`,
            }
          );
        }
        return false;
      }
    },
    [
      targetUrl,
      selectedModel,
      selectedSource,
      state.fetchWithInterceptor,
      state.addNotification,
      state.setPanels,
      state.setScrapedImages,
      state.setSelectedScraped,
      state.setConsoleLogs,
      setCurrentPanelIndex,
      setPlaybackTime,
      setStoryboardPlaying,
      state.setIsScraping,
      state.smartSlice,
      state.seriesTitle,
      state.chapterNumber,
      state.chapterTitle,
      state.scrapedGenre,
      state.seriesAuthor,
      state.seriesCoverImage,
      state.seriesSynopsis,
    ]
  );

  const scrapeBatchEpisodes = useCallback(
    async (
      episodesList: Array<{ url: string; number?: string; title?: string }>,
      overrideProjectId?: string
    ) => {
      if (!episodesList || episodesList.length === 0) return;

      state.setIsScraping(true);
      state.setPanels([]);
      state.setScrapedImages([]);
      state.setSelectedScraped([]);
      setCurrentPanelIndex(0);
      setPlaybackTime(0);
      setStoryboardPlaying(false);

      const allImages: string[] = [];
      const origins: Record<string, string> = {};
      const episodeGroups: Array<{
        episodeLabel: string;
        startIndex: number;
        count: number;
      }> = [];

      state.setConsoleLogs((prev) => [
        `[Batch Import] Starting batch import for ${episodesList.length} episodes...`,
        ...prev,
      ]);

      for (let i = 0; i < episodesList.length; i++) {
        const ep = episodesList[i];
        const target = (ep.url || "").trim();
        const numStr = (ep.number || "").trim();
        const titleStr = (ep.title || "").trim();
        let epLabel = numStr || titleStr || target;
        if (
          numStr &&
          titleStr &&
          numStr.toLowerCase() !== titleStr.toLowerCase()
        ) {
          const cleanTitle = titleStr.replace(/^[-:\s]+/, "").trim();
          if (
            cleanTitle &&
            cleanTitle.toLowerCase() !== numStr.toLowerCase() &&
            !numStr.toLowerCase().includes(cleanTitle.toLowerCase())
          ) {
            epLabel = `${numStr} - ${cleanTitle}`;
          }
        }
        const startIndex = allImages.length;

        state.setConsoleLogs((prev) => [
          `[Batch Import] (${i + 1}/${
            episodesList.length
          }) Scraping ${epLabel}...`,
          ...prev,
        ]);

        try {
          const data = await api.scrapeChapter(state.fetchWithInterceptor, {
            url: target,
            project_id: overrideProjectId || undefined,
            bypass_cache: false,
            proxy_images: true,
            filter_banners: true,
          });

          if (data.success && data.images && data.images.length > 0) {
            const rawUrls = data.images.map((img: any) =>
              typeof img === "string" ? img : img.url
            );
            const finalImages = rawUrls.map((img: string) =>
              img.startsWith("http") && !api.isApiUrl(img)
                ? api.getProxyImageUrl(img)
                : img
            );
            allImages.push(...finalImages);
            episodeGroups.push({
              episodeLabel: epLabel,
              startIndex,
              count: finalImages.length,
            });
            data.images.forEach((img: any) => {
              if (typeof img === "object" && img.url && img.origin) {
                origins[img.url] = img.origin;
              }
            });
          }
        } catch (err) {
          console.error(`[Batch Import] Failed to scrape ${epLabel}:`, err);
        }
      }

      (window as any).__scrapeImageOrigins = origins;
      (window as any).__scrapeEpisodeGroups = episodeGroups;
      state.setScrapedImages(allImages);
      state.setIsScraping(false);

      state.addNotification(
        `Batch import completed! Imported ${episodesList.length} episodes with ${allImages.length} images.`,
        "success"
      );
    },
    [
      state,
      selectedModel,
      selectedSource,
      setCurrentPanelIndex,
      setPlaybackTime,
      setStoryboardPlaying,
    ]
  );

  useEffect(() => {
    if (!targetUrl.trim()) {
      lastScrapedUrlRef.current = "";
      state.setScrapedImages([]);
      state.setSelectedScraped([]);
      state.setPanels([]);
      state.setIsScraping(false);
      return;
    }

    // Auto-scrape is intentionally disabled.
  }, [
    targetUrl,
    isProcessing,
    scrapeImages,
    state.setScrapedImages,
    state.setSelectedScraped,
    state.setPanels,
    state.setIsScraping,
  ]);

  const totalCalculatedDuration = state.panels.reduce(
    (sum, p) => sum + (p.duration || 0),
    0
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
      videoUrl: state.videoUrl,
      setVideoUrl: state.setVideoUrl,
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
      clearAllNotifications: state.clearAllNotifications,
      markAllNotificationsAsRead: state.markAllNotificationsAsRead,
      markNotificationAsRead: state.markNotificationAsRead,
      deleteNotification: state.deleteNotification,
      scrapedTitle: state.scrapedTitle,
      scrapedGenre: state.scrapedGenre,
      resetWorkspace: state.resetWorkspace,
      setSaveProject: (fn: any) => {
        saveProjectRef.current = fn;
      },
    }),
    [
      state,
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
      isGeneratingStoryboard,
      handleGenerateStoryboardAI,
    ]
  );
}
