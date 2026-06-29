import { LogEntry, normalizeLog } from "../types/logs";
import React, { useState, useCallback, useMemo } from "react";
import { GeneratedPanel } from "../types.js";
import { NotificationType } from "../components/NotificationStack.js";
import * as api from "../api/index.js";

interface UseVideoGenerationProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: any;
  targetUrl: string;
  selectedModel: string;
  selectedSource: string;
  frameRate: number;
  voiceActor: string;
  musicTheme: string;
  setVideoUrl: (url: string | null) => void;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  narrationStyle?: string;
  seriesTitle: string;
  chapterNumber: string;
  chapterTitle: string;
  scrapedGenre: string;
  seriesAuthor?: string;
  seriesCoverImage?: string;
  seriesSynopsis?: string;
  audioFeedback?: any;
}

export function useVideoGeneration({
  panels,
  setPanels,
  setConsoleLogs,
  addNotification,
  fetchWithInterceptor,
  targetUrl,
  selectedModel,
  frameRate,
  voiceActor,
  musicTheme,
  selectedSource,
  setVideoUrl,
  setActivePreviewTab,
  narrationStyle = "long",
  seriesTitle,
  chapterNumber,
  chapterTitle,
  scrapedGenre,
  seriesAuthor,
  seriesCoverImage,
  seriesSynopsis,
  audioFeedback,
}: UseVideoGenerationProps) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [reprocessingPanelId, setReprocessingPanelId] = useState<number | null>(
    null
  );
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderEtaSeconds, setRenderEtaSeconds] = useState<number | null>(null);
  const [renderStartTime, setRenderStartTime] = useState<number | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRendering) {
      interval = setInterval(() => {
        setRenderEtaSeconds((prev) => {
          if (prev === null) return null;
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRendering]);

  const handleGenerateVideo = useCallback(async () => {
    if (!targetUrl.trim()) {
      addNotification(
        "Please enter or select a valid Webtoon URL to initiate the process.",
        "error"
      );
      return;
    }

    const sourceDisplayNames: Record<string, string> = {
      webtoons: "Webtoons",
      webcomicsapp: "WebComics App",
      mangadex: "MangaDex",
      toomics: "Toomics",
      linewebtoon: "Line Webtoon",
      asurascans: "Asura Scans",
      manhuato: "ManhuaTo",
      reaperscans: "Reaper Scans",
      flamecomics: "Flame Comics",
      voidscans: "Void Scans",
      luminousscans: "Luminous Scans",
      tapas: "Tapas",
      tappytoon: "Tappytoon",
      copincomics: "Copin Comics",
      pocketcomics: "Pocket Comics",
      lezhin: "Lezhin",
      bilibilicomics: "Bilibili Comics",
      mangatoon: "MangaToon",
      webnovel: "Webnovel",
      manhuaplus: "Manhua Plus",
      manhwaclan: "Manhwa Clan",
      "1stkissmanga": "1st Kiss Manga",
      manganato: "Manganato",
      mangakakalot: "Mangakakalot",
      batoto: "Bato.to",
      custom: "Direct Image / Custom URL",
    };

    const selectedSourceName =
      sourceDisplayNames[selectedSource] || selectedSource;
    const normalizeTarget = (() => {
      try {
        return targetUrl.trim().startsWith("http")
          ? targetUrl.trim()
          : `https://${targetUrl.trim()}`;
      } catch {
        return targetUrl.trim();
      }
    })();

    const currentHost = (() => {
      try {
        return new URL(normalizeTarget).hostname.toLowerCase();
      } catch {
        return "";
      }
    })();

    const allowedHosts: Record<string, string[]> = {
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

    const isSourceMismatch = Boolean(
      currentHost &&
        !allowedHosts[selectedSource]?.some(
          (allowedHost) =>
            currentHost === allowedHost ||
            currentHost.endsWith(`.${allowedHost}`)
        )
    );

    if (isSourceMismatch) {
      addNotification(
        `Selected source ${selectedSourceName} does not match the URL host (${currentHost}). Please choose the correct website or paste a matching URL.`,
        "error"
      );
      return;
    }

    console.log(
      `[Control] Starting video generation pipeline with model: ${selectedModel}`
    );
    setIsProcessing(true);
    setProgressStatus("Contacting pipeline orchestration...");
    addNotification(
      "Pipeline initiated — generating video with " + selectedModel + "...",
      "info"
    );
    setConsoleLogs([
      `[Control] Initiating video creation request...`,
      `[Control] Link target: ${targetUrl}`,
      `[Control] Video parameters applied -> FPS: ${frameRate} | Voice: ${voiceActor} | Audio: ${musicTheme}`,
      `[Engine] Active Voice: ${selectedModel}`,
      `[Engine] Requesting text and scene processing...`,
      `[Pipeline] Timeline contains ${panels.length} panel(s) queued for compilation`,
    ]);

    try {
      setProgressStatus("Downloading images...");
      setConsoleLogs((prev) => [
        ...prev,
        `[Downloader] Started fetching images...`,
      ]);

      const formattedEpisode = (() => {
        const num = chapterNumber.trim();
        const name = chapterTitle.trim();
        if (num && name) return `Chapter ${num} - ${name}`;
        if (num) return `Chapter ${num}`;
        if (name) return name;
        return "";
      })();

      const requestBody = {
        url: targetUrl,
        source: selectedSource,
        episode_id: `wp_${Math.random().toString(36).substring(2, 8)}`,
        panels: panels,
        model: selectedModel,
        narrationStyle,
        title: seriesTitle ? seriesTitle.trim() : undefined,
        episode: formattedEpisode || undefined,
        genre: scrapedGenre ? scrapedGenre.trim() : undefined,
        author: seriesAuthor ? seriesAuthor.trim() : undefined,
        cover_image: seriesCoverImage ? seriesCoverImage.trim() : undefined,
        synopsis: seriesSynopsis ? seriesSynopsis.trim() : undefined,
      };

      console.log(`[API] Requesting video generation`, requestBody);
      const responseData = await api.generateVideo(
        fetchWithInterceptor,
        requestBody
      );
      console.log(`[API] Video generation response:`, responseData);

      if (responseData.status !== "success" || !responseData.video_url) {
        throw new Error(
          responseData.message || "Failed to compile cinematic video sequence."
        );
      }

      setConsoleLogs((prev) => [
        ...prev,
        `[Downloader] Downloaded images successfully.`,
        `[Text Processing] Found ${responseData.panels_processed} panels.`,
        `[Engine] Voice engine ${selectedModel} completed text processing`,
        `[Video] Building timeline...`,
        `[Video] Final video generated: ${responseData.video_url}`,
        `[Pipeline] [SUCCESS] Video generation completed successfully!`,
      ]);

      setPanels(responseData.panels || []);
      setVideoUrl(responseData.video_url);
      setProgressStatus("Slices mapped & MP4 master timeline generated!");
      setActivePreviewTab("video");
      addNotification(
        "Video generated successfully! Check the preview player.",
        "success"
      );
      audioFeedback?.playSuccess();
    } catch (err: any) {
      setConsoleLogs((prev) => [
        ...prev,
        `[Pipeline] [ERROR] Video generation failed: ${
          (err as any).message || "Unknown error"
        }`,
        `[Pipeline] Error code: ${
          (err as any).status || (err as any).code || "unknown"
        } | Model: ${selectedModel}`,
      ]);

      if (!(err as any).intercepted) {
        let errMessage =
          (err as any).message || "An unexpected connection error occurred.";
        if (errMessage.includes("429") || errMessage.includes("quota")) {
          errMessage =
            "You've exceeded your daily/request quota for the System API. Please wait a short while for the quota to reset, or check your billing plan in Google Cloud to increase your limits.";
        }
        addNotification(
          `Pipeline failed: ${errMessage}. Please try refreshing the page or try again.`,
          "error"
        );
      }
    } finally {
      setIsProcessing(false);
    }
  }, [targetUrl, addNotification, selectedSource, selectedModel, frameRate, voiceActor, musicTheme, panels, narrationStyle, seriesTitle, chapterNumber, chapterTitle, scrapedGenre, seriesAuthor, seriesCoverImage, seriesSynopsis, fetchWithInterceptor, setConsoleLogs, setPanels, setVideoUrl, setActivePreviewTab, audioFeedback]);

  const handleTriggerReprocess = useCallback(async (panelId: number) => {
    const activePanel = panels.find((p) => p.id === panelId);
    if (!activePanel) return;

    setReprocessingPanelId(panelId);
    const activePadding =
      activePanel.crop_padding !== undefined ? activePanel.crop_padding : 4;
    setConsoleLogs((prev) => [
      `[Image Editor] Updating cropping margins (padding: ${activePadding}%) for Panel #${panelId}...`,
      ...prev,
    ]);

    try {
      let currentUrl = activePanel.image_url;
      if (api.isProxyUrl(currentUrl)) {
        const urlObj = new URL(currentUrl, window.location.origin);
        urlObj.searchParams.set("reprocess_nonce", Date.now().toString());
        if (activePanel.smart_crop) {
          urlObj.searchParams.set("tighter", "true");
        }
        if (activePanel.crop_padding !== undefined) {
          urlObj.searchParams.set(
            "crop_padding",
            activePanel.crop_padding.toString()
          );
        }
        currentUrl = urlObj.pathname + urlObj.search;
      }

      console.log(`[Image Editor] Updating panel #${panelId}...`);
      await new Promise((resolve) => setTimeout(resolve, 900));

      setPanels((prev) =>
        prev.map((p) =>
          p.id === panelId ? { ...p, image_url: currentUrl } : p
        )
      );

      setConsoleLogs((prev) => [
        `[Image Editor] [SUCCESS] Panel #${panelId} successfully updated with padding ${activePadding}%!`,
        ...prev,
      ]);
      addNotification(
        `Panel #${panelId} reprocessed with tighter margins (${activePadding}% padding).`,
        "success"
      );
    } catch (err: any) {
      setConsoleLogs((prev) => [
        `[Image Editor] [ERROR] Update failed for Panel #${panelId}: ${
          (err as any).message || "Unknown error"
        }`,
        ...prev,
      ]);
      addNotification(
        `Panel reprocessing failed. Please try again later.`,
        "error"
      );
    } finally {
      setReprocessingPanelId(null);
    }
  }, [panels, setConsoleLogs, setPanels, addNotification]);

  const handleRenderFinalVideo = useCallback(async () => {
    setIsRendering(true);
    setRenderProgress(5);
    setRenderEtaSeconds(null);
    const startTime = Date.now();
    setRenderStartTime(startTime);

    try {
      const data = await api.renderVideo(fetchWithInterceptor, {
        panels,
        voice: voiceActor,
      });
      if (!data.success || !data.job_id) {
        throw new Error(
          data.detail || data.error || "Failed to start render job"
        );
      }

      const jobId = data.job_id;

      // Start polling
      const pollInterval = setInterval(async () => {
        try {
          const statusData = await api.getVideoStatus(
            fetchWithInterceptor,
            jobId
          );

          if (statusData.progress) {
            setRenderProgress(statusData.progress);
            const elapsed = (Date.now() - startTime) / 1000;
            if (statusData.progress > 5) {
              const totalEstimated = (elapsed / statusData.progress) * 100;
              setRenderEtaSeconds(
                Math.max(0, Math.floor(totalEstimated - elapsed))
              );
            }
          }

          if (statusData.status === "completed") {
            clearInterval(pollInterval);
            setRenderProgress(100);
            setRenderEtaSeconds(0);
            setVideoUrl(statusData.url);
            setActivePreviewTab("video");
            addNotification("Final video rendered successfully!", "success");
            audioFeedback?.playSuccess();
            setIsRendering(false);
            setTimeout(() => setRenderProgress(0), 2000);
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            throw new Error(statusData.error || "Render failed");
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          console.error("Polling error:", pollErr);
          addNotification(`Render failed: ${pollErr.message}`, "error");
          setIsRendering(false);
          setRenderProgress(0);
        }
      }, 2000);
    } catch (error: any) {
      console.error("Error starting render:", error);
      addNotification(`Render failed: ${error.message}`, "error");
      setIsRendering(false);
      setRenderProgress(0);
      setRenderEtaSeconds(null);
    }
  }, [panels, voiceActor, fetchWithInterceptor, addNotification, setVideoUrl, setActivePreviewTab, audioFeedback]);

  return useMemo(() => ({
    isProcessing,
    progressStatus,
    reprocessingPanelId,
    handleGenerateVideo,
    handleTriggerReprocess,
    isRendering,
    renderProgress,
    renderEtaSeconds,
    handleRenderFinalVideo,
  }), [
    isProcessing,
    progressStatus,
    reprocessingPanelId,
    handleGenerateVideo,
    handleTriggerReprocess,
    isRendering,
    renderProgress,
    renderEtaSeconds,
    handleRenderFinalVideo,
  ]);
}
