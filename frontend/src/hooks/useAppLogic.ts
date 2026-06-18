import { useRef, useEffect, useCallback } from "react";
import { useAppState } from "./useAppState.js";
import { usePlaybackEngine } from "./usePlaybackEngine.js";
import { usePipelineActions } from "./usePipelineActions.js";
import { parseWebtoonUrl } from "../utils.js";
import { extractWebtoonUrl } from "../utils/url.js";

export function useAppLogic() {
  const state = useAppState();
  const { targetUrl, selectedSource, selectedModel } = state;
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const sourceMismatchNotified = useRef(false);
  const lastScrapedUrlRef = useRef<string>("");

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
    addPanelsToStoryboard,
    handleCleanBubblesSelected,
    handleAutoCropSelected,
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,
    isBatchCropping,
    batchProgress,
    croppingImgUrl,
  } = usePipelineActions({
    state,
    setCurrentPanelIndex,
    setPlaybackTime,
    setStoryboardPlaying,
    playStoryboardAudio,
  });

  // --- System Logs Engine ---
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;
    let isPolling = false;
    const lastLogIdRef = { current: 0 };

    const startPolling = () => {
      if (isPolling) return;
      isPolling = true;

      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/system-logs?since=${lastLogIdRef.current}`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.logs)) {
            const newLogs = data.logs.filter(
              (log: any) => log.id > lastLogIdRef.current
            );
            if (newLogs.length > 0) {
              newLogs.forEach((log: any) => {
                if (log.id > lastLogIdRef.current) {
                  lastLogIdRef.current = log.id;
                }
              });
              state.setConsoleLogs((prev) => [
                ...prev,
                ...newLogs.map((log: any) => log.message),
              ]);
            }
          }
        } catch (err) {
          // Silent catch
        }
      }, 1500);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      isPolling = false;
    };

    const connectSSE = () => {
      try {
        eventSource = new EventSource("/api/system-logs/stream");

        eventSource.onmessage = (event) => {
          try {
            const entry = JSON.parse(event.data);
            if (entry && entry.id > lastLogIdRef.current) {
              lastLogIdRef.current = entry.id;
              state.setConsoleLogs((prev) => [...prev, entry.message]);
            }
          } catch (e) {
            // silent catch
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isCurrent) {
            startPolling();
          }
        };
      } catch (err) {
        startPolling();
      }
    };

    let isCurrent = true;
    connectSSE();

    return () => {
      isCurrent = false;
      if (eventSource) {
        eventSource.close();
      }
      stopPolling();
    };
  }, [state.setConsoleLogs]);

  const SOURCE_DOMAINS: Record<string, string[]> = {
    webtoons: ["webtoons.com", "webtoon.com"],
    webcomicsapp: ["webcomicsapp.com"],
    mangadex: ["mangadex.org", "mangadex.com"],
    toomics: ["toomics.com"],
    linewebtoon: ["webtoon.com"],
    asurascans: ["asurascans.com"],
    custom: [],
  };

  // --- System Logs Engine ---
  const scrapeImages = useCallback(
    async (customUrl?: any) => {
      const activeUrl = typeof customUrl === "string" ? customUrl : targetUrl;
      if (!activeUrl || !activeUrl.trim()) return;

      const normalizedTargetUrl = extractWebtoonUrl(activeUrl);
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

      const isSourceMismatch = Boolean(
        normalizedTargetUrl &&
          !isDirectImage &&
          selectedSource !== "custom" &&
          currentHost &&
          !allowedHosts.some(
            (allowedHost) =>
              currentHost === allowedHost ||
              currentHost.endsWith(`.${allowedHost}`)
          )
      );

      if (isSourceMismatch) {
        if (!sourceMismatchNotified.current) {
          state.addNotification(
            `Selected source ${selectedSource} does not match the current URL host (${currentHost}). Please choose the correct website or paste a matching URL.`,
            "error"
          );
          sourceMismatchNotified.current = true;
        }
        state.setPanels([]);
        state.setScrapedImages([]);
        state.setSelectedScraped([]);
        setCurrentPanelIndex(0);
        setPlaybackTime(0);
        setStoryboardPlaying(false);
        state.setIsScraping(false);
        state.setConsoleLogs((prev) => [
          `[Scraper] Aborting automatic scrape because selected source ${selectedSource} does not match the URL host ${currentHost}.`,
          ...prev,
        ]);
        return;
      }

      sourceMismatchNotified.current = false;
      state.setIsScraping(true);

      const { genre, title, episode } = parseWebtoonUrl(normalizedTargetUrl);

      // Save parsed details in global state for AI Suite tools to consume dynamically
      if (title) {
        state.setScrapedTitle(
          title
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        );
      }
      if (genre) {
        state.setScrapedGenre(
          genre
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        );
      }

      state.setPanels([]);
      state.setScrapedImages([]);
      state.setSelectedScraped([]);
      setCurrentPanelIndex(0);
      setPlaybackTime(0);
      setStoryboardPlaying(false);

      state.setConsoleLogs((prev) => {
        const baseLogs = prev.filter(
          (log) =>
            !log.startsWith("[Preloader]") && !log.startsWith("[Scraper]")
        );
        return [
          `[Scraper] Spawned live scraping task to separate strip images from: ${normalizedTargetUrl}`,
          `[Model] Using AI engine: ${selectedModel} for panel analysis`,
          `[Scraper] Selected source website: ${selectedSource}`,
          `[Scraper] Parsed URL → Genre: ${genre} | Title: ${title} | Episode: ${episode}`,
          ...baseLogs,
        ];
      });

      try {
        const res = await state.fetchWithInterceptor("/api/scrape-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: normalizedTargetUrl,
            model: selectedModel,
            source: selectedSource,
            bypass_cache: false,
          }),
        });
        const data = await res.json();

        if (data.success && data.images && data.images.length > 0) {
          // Ensure all images are proxied if they aren't already internal API paths
          const finalImages = data.images.map((img: string) =>
            img.startsWith("http") && !img.includes("/api/")
              ? `/api/proxy-image?url=${encodeURIComponent(img)}`
              : img
          );

          state.setScrapedImages(finalImages);
          state.setPanels([]);
          setCurrentPanelIndex(0);
          setPlaybackTime(0);
          setStoryboardPlaying(false);

          if (data.debug?.original_count && data.debug.original_count > 1) {
            state.addNotification(
              `Successfully extracted and consolidated ${data.debug.original_count} panels into one image!`,
              "success"
            );
          } else {
            state.addNotification(
              `Successfully extracted ${data.total_images} panel frame from the Webtoon page!`,
              "success"
            );
          }

          state.setConsoleLogs((prev) => {
            const filtered = prev.filter(
              (log) => !log.startsWith("[Scraper] Spawned live scraping task")
            );
            return [
              `[Scraper] Extraction completed. Total assets returned: ${data.total_images}`,
              `[API] Scrape response received — Model: ${selectedModel} | Assets: ${data.total_images}`,
              ...filtered,
            ];
          });
          state.setIsScraping(false);
          console.log(
            `[Scraper] Loaded ${data.total_images} images from ${activeUrl}`
          );
        } else {
          state.setIsScraping(false);
          const errMsg =
            data.message ||
            "Connected but no native comic elements identified on page.";
          state.setScrapedImages([]);
          state.setPanels([]);
          state.addNotification(
            `Failed to find comic panels: ${errMsg} Please check the URL and try again.`,
            "error"
          );
          state.setConsoleLogs((prev) => [
            `[Scraper] [WARNING] No comic panels detected on page. Server message: ${errMsg}`,
            ...prev,
          ]);
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
            "error"
          );
        }
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

    // [Auto-Scrape Disabled]
    // We now rely on the user clicking the "Scrape Assets" button in the UrlInputPanel.
    /*
    if (targetUrl && targetUrl.includes("http") && !isProcessing) {
      if (targetUrl !== lastScrapedUrlRef.current) {
        lastScrapedUrlRef.current = targetUrl;
        console.log("[Auto-Scrape] Target URL changed, initiating scrape for:", targetUrl);
        scrapeImages(); 
      }
    }
    */
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

  return {
    ...state,
    videoPlayerRef,
    currentPanelIndex,
    setCurrentPanelIndex,
    playbackTime,
    setPlaybackTime,
    storyboardPlaying,
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
    scrapeImages,
    clearAllNotifications: state.clearAllNotifications,
    markAllNotificationsAsRead: state.markAllNotificationsAsRead,
    markNotificationAsRead: state.markNotificationAsRead,
    deleteNotification: state.deleteNotification,
    scrapedTitle: state.scrapedTitle,
    scrapedGenre: state.scrapedGenre,
  };
}
