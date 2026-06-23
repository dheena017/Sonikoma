import { useRef, useEffect, useCallback, useState } from "react";
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

  const [isGeneratingStoryboard, setIsGeneratingStoryboard] =
    useState<boolean>(false);

  const handleGenerateStoryboardAI = useCallback(async () => {
    const activeUrl = targetUrl;
    const projId = state.projectId;
    if (!activeUrl || !activeUrl.trim() || !projId) {
      state.addNotification(
        "Please ensure target URL is pasted and project is created.",
        "error"
      );
      return;
    }
    setIsGeneratingStoryboard(true);
    state.addNotification("Starting storyboard AI generation...", "info");
    state.setConsoleLogs((prev) => [
      `[AI Storyboard] Triggering AI generation for project: ${projId}...`,
      `[AI Storyboard] Running OCR Transcription & Panel Slicing...`,
      ...prev,
    ]);
    try {
      const formattedEpisode = (() => {
        const num = state.chapterNumber.trim();
        const name = state.chapterTitle.trim();
        if (num && name) return `Chapter ${num} - ${name}`;
        if (num) return `Chapter ${num}`;
        if (name) return name;
        return "";
      })();

      const res = await state.fetchWithInterceptor("/api/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: extractWebtoonUrl(activeUrl),
          project_id: projId,
          model: selectedModel,
          narrationStyle: state.narrationStyle,
          title: state.seriesTitle ? state.seriesTitle.trim() : undefined,
          episode: formattedEpisode || undefined,
          genre: state.scrapedGenre ? state.scrapedGenre.trim() : undefined,
          author: state.seriesAuthor ? state.seriesAuthor.trim() : undefined,
          cover_image: state.seriesCoverImage
            ? state.seriesCoverImage.trim()
            : undefined,
          synopsis: state.seriesSynopsis
            ? state.seriesSynopsis.trim()
            : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate storyboard (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.success && data.panels) {
        const mappedPanels = data.panels.map((p: any, idx: number) => ({
          ...p,
          id: p.id || idx + 1,
          grayscale: p.grayscale === 1 || p.grayscale === true,
        }));
        state.setPanels(mappedPanels);
        state.setConsoleLogs((prev) => [
          `[AI Storyboard] [SUCCESS] Storyboard generated successfully with ${mappedPanels.length} panels!`,
          ...prev,
        ]);
        state.addNotification(
          `Storyboard generated successfully with ${mappedPanels.length} panels!`,
          "success"
        );
      } else {
        throw new Error(
          data.message || "Invalid response from AI Model Analysis"
        );
      }
    } catch (err: any) {
      console.error("[AI Storyboard] Generation failed:", err);
      state.setConsoleLogs((prev) => [
        `[AI Storyboard] [ERROR] Generation failed: ${
          err.message || String(err)
        }`,
        ...prev,
      ]);
      state.addNotification(
        `Storyboard generation failed: ${err.message || String(err)}`,
        "error"
      );
    } finally {
      setIsGeneratingStoryboard(false);
    }
  }, [
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
  ]);

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
    let pollTimeout: any = null;
    let isPolling = false;
    let isCurrent = true;
    let pollIntervalMs = 5000; // Start with 5s
    const lastLogIdRef = { current: 0 };

    const doPoll = async () => {
      if (!isCurrent) return;
      try {
        const res = await fetch(
          `/api/system-logs?since=${lastLogIdRef.current}`
        );
        if (!res.ok) {
          if (res.status === 429) {
            pollIntervalMs = Math.min(pollIntervalMs * 2, 60000); // Exponential backoff up to 60s
          }
          throw new Error(`HTTP ${res.status}`);
        }
        pollIntervalMs = 5000; // Reset on success
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
      } finally {
        if (isCurrent) {
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
    manhuato: ["manhuato.com"],
    reaperscans: ["reaperscans.com"],
    flamecomics: ["flamecomics.com", "flamescans.org"],
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
    manhuaplus: ["manhuaplus.com"],
    manhwaclan: ["manhwaclan.com"],
    "1stkissmanga": ["1stkissmanga.io", "1stkissmanga.com"],
    manganato: ["manganato.com", "readmanganato.com"],
    mangakakalot: ["mangakakalot.com"],
    batoto: ["bato.to"],
    custom: [],
  };

  // --- System Logs Engine ---
  const scrapeImages = useCallback(
    async (customUrl?: any, overrideProjectId?: string) => {
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
        const formattedEpisode = (() => {
          const num = state.chapterNumber.trim();
          const name = state.chapterTitle.trim();
          if (num && name) return `Chapter ${num} - ${name}`;
          if (num) return `Chapter ${num}`;
          if (name) return name;
          return "";
        })();

        const res = await state.fetchWithInterceptor("/api/scrape-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: normalizedTargetUrl,
            model: selectedModel,
            source: selectedSource,
            bypass_cache: false,
            smart_slice: state.smartSlice,
            title: state.seriesTitle ? state.seriesTitle.trim() : undefined,
            episode: formattedEpisode || undefined,
            genre: state.scrapedGenre ? state.scrapedGenre.trim() : undefined,
            author: state.seriesAuthor ? state.seriesAuthor.trim() : undefined,
            cover_image: state.seriesCoverImage
              ? state.seriesCoverImage.trim()
              : undefined,
            synopsis: state.seriesSynopsis
              ? state.seriesSynopsis.trim()
              : undefined,
            project_id: overrideProjectId || undefined,
            scrape_only: state.smartSlice, // true = fast separate images; false = trigger stitch pipeline
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

          // Store image_origins so panels created from these images get original_url saved
          // in the DB, enabling cache-miss recovery after server restarts
          const origins: Record<string, string> = data.image_origins || {};
          (window as any).__scrapeImageOrigins = origins;

          state.setScrapedImages(finalImages);
          if (data.project_id) {
            state.setProjectId(data.project_id);
            if (data.series_slug && data.chapter_slug) {
              const newPath = `/series/${data.series_slug}/chapters/${data.chapter_slug}`;
              if (window.location.pathname !== newPath) {
                window.history.pushState(null, "", newPath);
              }
            } else if (!data.project_id.startsWith("temp_")) {
              const urlParams = new URLSearchParams(window.location.search);
              urlParams.delete("project_id");
              urlParams.delete("url"); // Delete the raw pasted manhwa URL parameter!
              urlParams.set("id", data.project_id);
              const newSearch = urlParams.toString();
              window.history.pushState(
                null,
                "",
                window.location.pathname + (newSearch ? "?" + newSearch : "")
              );
            }
          }
          if (data.panels && data.panels.length > 0) {
            const mappedPanels = data.panels.map((p: any) => ({
              ...p,
              grayscale: p.grayscale === 1 || p.grayscale === true,
            }));
            state.setPanels(mappedPanels);
          } else {
            state.setPanels([]);
          }

          // Populate the scraped metadata in the input boxes
          if (data.cover_image) {
            state.setSeriesCoverImage(data.cover_image);
          }
          if (data.title) {
            state.setSeriesTitle(data.title);
            state.setScrapedTitle(data.title);
          }
          if (data.author) {
            state.setSeriesAuthor(data.author);
          }
          if (data.synopsis) {
            state.setSeriesSynopsis(data.synopsis);
          }
          if (data.genre) {
            state.setScrapedGenre(data.genre);
          }
          // Parse "Chapter 9 - Archmage Uihyeok Jeong" → chapterNumber + chapterTitle
          if (data.episode) {
            const epMatch = data.episode.match(
              /^Chapter\s+(\d+)(?:\s+-\s+(.+))?$/i
            );
            if (epMatch) {
              state.setChapterNumber(epMatch[1]);
              state.setChapterTitle(epMatch[2] || "");
            }
          }

          setCurrentPanelIndex(0);
          setPlaybackTime(0);
          setStoryboardPlaying(false);

          if (data.debug?.original_count && data.debug.original_count > 1) {
            const detailMsg = [
              `Original Panel Count: ${data.debug.original_count}`,
              `Consolidated Image URL: ${data.images?.[0] || "N/A"}`,
              `Source URL: ${normalizedTargetUrl}`,
              `Smart Slice Mode: Enabled`,
              `Scraped Genre: ${state.scrapedGenre || "General"}`,
            ].join("\n");
            state.addNotification(
              `Successfully extracted and consolidated ${data.debug.original_count} panels into one image!`,
              "success",
              {
                details: detailMsg,
              }
            );
          } else {
            const detailMsg = [
              `Total Frames Extracted: ${data.total_images}`,
              `Source URL: ${normalizedTargetUrl}`,
              `AI Vision Model: ${selectedModel}`,
              `Target Domain: ${currentHost}`,
              `Smart Slice Mode: Disabled`,
            ].join("\n");
            state.addNotification(
              `Successfully extracted ${data.total_images} panel frame from the Webtoon page!`,
              "success",
              {
                details: detailMsg,
              }
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
            "error",
            {
              details: `Error Response Message: ${errMsg}\nTarget URL: ${normalizedTargetUrl}\nSelected Source Portal: ${selectedSource}\nHost: ${currentHost}`,
            }
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
    isGeneratingStoryboard,
    handleGenerateStoryboardAI,
    clearAllNotifications: state.clearAllNotifications,
    markAllNotificationsAsRead: state.markAllNotificationsAsRead,
    markNotificationAsRead: state.markNotificationAsRead,
    deleteNotification: state.deleteNotification,
    scrapedTitle: state.scrapedTitle,
    scrapedGenre: state.scrapedGenre,
    resetWorkspace: state.resetWorkspace,
  };
}
