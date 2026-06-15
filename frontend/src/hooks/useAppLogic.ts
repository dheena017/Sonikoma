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
          const res = await fetch(`/api/system-logs?since=${lastLogIdRef.current}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.logs)) {
            const newLogs = data.logs.filter((log: any) => log.id > lastLogIdRef.current);
            if (newLogs.length > 0) {
              newLogs.forEach((log: any) => {
                if (log.id > lastLogIdRef.current) {
                  lastLogIdRef.current = log.id;
                }
              });
              state.setConsoleLogs(prev => [
                ...prev,
                ...newLogs.map((log: any) => log.message)
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
        eventSource = new EventSource('/api/system-logs/stream');

        eventSource.onmessage = (event) => {
          try {
            const entry = JSON.parse(event.data);
            if (entry && entry.id > lastLogIdRef.current) {
              lastLogIdRef.current = entry.id;
              state.setConsoleLogs(prev => [...prev, entry.message]);
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
  };

  // --- System Logs Engine ---
  const scrapeImages = useCallback(async (customUrl?: string) => {
    const activeUrl = customUrl || targetUrl;
    if (!activeUrl.trim()) return;

    const normalizedTargetUrl = extractWebtoonUrl(activeUrl);
    const currentHost = (() => {
      try {
        const urlWithScheme = normalizedTargetUrl.startsWith("http") ? normalizedTargetUrl : `https://${normalizedTargetUrl}`;
        return new URL(urlWithScheme).hostname.toLowerCase();
      } catch {
        return "";
      }
    })();

    const allowedHosts = SOURCE_DOMAINS[selectedSource] || ["webtoons.com", "webtoon.com"];
    const isSourceMismatch = Boolean(
      normalizedTargetUrl &&
      currentHost &&
      !allowedHosts.some((allowedHost) =>
        currentHost === allowedHost || currentHost.endsWith(`.${allowedHost}`)
      )
    );

    if (isSourceMismatch) {
      if (!sourceMismatchNotified.current) {
        state.addNotification(
          `Selected source ${selectedSource} does not match the current URL host (${currentHost}). Please choose the correct website or paste a matching URL.`,
          'error'
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
      state.setConsoleLogs(prev => [
        `[Scraper] Aborting automatic scrape because selected source ${selectedSource} does not match the URL host ${currentHost}.`,
        ...prev
      ]);
      return;
    }

    sourceMismatchNotified.current = false;
    state.setIsScraping(true);

    const { genre, title, episode } = parseWebtoonUrl(normalizedTargetUrl);
    
    state.setPanels([]);
    state.setScrapedImages([]);
    state.setSelectedScraped([]);
    setCurrentPanelIndex(0);
    setPlaybackTime(0);
    setStoryboardPlaying(false);
    
    state.setConsoleLogs(prev => {
      const baseLogs = prev.filter(log => !log.startsWith("[Preloader]") && !log.startsWith("[Scraper]"));
      return [
        `[Scraper] Spawned live scraping task to separate strip images from: ${normalizedTargetUrl}`,
        `[Model] Using AI engine: ${selectedModel} for panel analysis`,
        `[Scraper] Selected source website: ${selectedSource}`,
        `[Scraper] Parsed URL → Genre: ${genre} | Title: ${title} | Episode: ${episode}`,
        ...baseLogs
      ];
    });

    try {
      const res = await state.fetchWithInterceptor("/api/scrape-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedTargetUrl, model: selectedModel, source: selectedSource, bypass_cache: false }),
      });
      const data = await res.json();

      if (data.success && data.images && data.images.length > 0) {
        const proxiedImages = data.images.map((img: string) => 
           img.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(img)}` : img
        );

        state.setScrapedImages([]);
        state.setPanels([]);
        setCurrentPanelIndex(0);
        setPlaybackTime(0);
        setStoryboardPlaying(false);
        
        // Automatically stitch images into one if multiple are found
        if (proxiedImages.length >= 2) {
          state.setConsoleLogs(prev => [
            `[Scraper] Found ${proxiedImages.length} panels. Automatically stitching into a single strip...`,
            ...prev
          ]);

          try {
            const stitchRes = await state.fetchWithInterceptor("/api/stitch-images", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                urls: proxiedImages,
                layout: "vertical",
                spacing: 0,
                spacingColor: "white",
                scaleToFit: true,
                alignMode: "center",
                padding: 0,
              }),
            });
            const stitchData = await stitchRes.json();
            if (stitchData.url) {
              state.setScrapedImages([stitchData.url]);
              state.addNotification(`Successfully extracted and stitched ${proxiedImages.length} panels into one image!`, 'success');
              state.setConsoleLogs(prev => [
                `[Scraper] ✓ Success! Stitched ${proxiedImages.length} panels into one continuous frame: ${stitchData.url}`,
                ...prev
              ]);
            } else {
              state.setScrapedImages(proxiedImages);
              state.addNotification(`Extracted ${proxiedImages.length} panels, but automatic stitching failed.`, 'warning');
            }
          } catch (stitchErr) {
            console.error("Auto-stitch failed:", stitchErr);
            state.setScrapedImages(proxiedImages);
            state.addNotification(`Extracted ${proxiedImages.length} panels, but automatic stitching encountered an error.`, 'warning');
          }
        } else {
          state.setScrapedImages(proxiedImages);
          state.addNotification(`Successfully extracted ${data.total_images} panel frame from the Webtoon page!`, 'success');
        }
        
        state.setConsoleLogs(prev => {
          // Only filter out the "Spawned live scraping..." log, keep the "Stitching..." logs
          const filtered = prev.filter(log => !log.startsWith("[Scraper] Spawned live scraping task"));
          return [
            `[Scraper] Extraction completed. Total images: ${data.total_images}`,
            `[API] Scrape response received — Model: ${selectedModel} | Images: ${data.total_images}`,
            ...filtered
          ];
        });
        state.setIsScraping(false);
        console.log(`[Scraper] Loaded ${data.total_images} images from ${activeUrl}`);
      } else {
        state.setIsScraping(false);
        const errMsg = data.message || "Connected but no native comic elements identified on page.";
        state.setScrapedImages([]);
        state.setPanels([]);
        state.addNotification(`Failed to find comic panels: ${errMsg} Please check the URL and try again.`, "error");
        state.setConsoleLogs(prev => [
          `[Scraper] [WARNING] No comic panels detected on page. Server message: ${errMsg}`,
          ...prev
        ]);
      }
    } catch (err: any) {
      state.setIsScraping(false);
      state.setScrapedImages([]);
      state.setPanels([]);
      state.setConsoleLogs(prev => [
        `[Scraper] [ERROR] Scrape failed: ${err.message || 'Unknown error'}`,
        ...prev
      ]);
      if (!err.intercepted) {
        const errMsg = err.message || "Failed to retrieve comic panels from the specified URL.";
        state.addNotification(`Service unable to access target site. Check the URL or refresh the page. (${errMsg})`, "error");
      }
    }
  }, [targetUrl, selectedModel, selectedSource, state.fetchWithInterceptor, state.addNotification, state.setPanels, state.setScrapedImages, state.setSelectedScraped, state.setConsoleLogs, setCurrentPanelIndex, setPlaybackTime, setStoryboardPlaying, state.setIsScraping]);

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
  }, [targetUrl, isProcessing, scrapeImages, state.setScrapedImages, state.setSelectedScraped, state.setPanels, state.setIsScraping]);

  const totalCalculatedDuration = state.panels.reduce((sum, p) => sum + (p.duration || 0), 0);

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
  };
}
