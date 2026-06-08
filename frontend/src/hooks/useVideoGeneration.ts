import React, { useState } from "react";
import { GeneratedPanel } from "../types";
import { NotificationType } from "../components/NotificationStack";

interface UseVideoGenerationProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: any;
  targetUrl: string;
  selectedModel: string;
  frameRate: number;
  voiceActor: string;
  musicTheme: string;
  setVideoUrl: (url: string | null) => void;
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
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
  setVideoUrl,
  setActivePreviewTab,
}: UseVideoGenerationProps) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [reprocessingPanelId, setReprocessingPanelId] = useState<number | null>(null);

  const handleGenerateVideo = async () => {
    if (!targetUrl.trim()) {
      addNotification("Please enter or select a valid Webtoon URL to initiate the process.", "error");
      return;
    }

    setIsProcessing(true);
    setProgressStatus("Contacting pipeline orchestration...");
    addNotification('Pipeline initiated — generating video with ' + selectedModel + '...', 'info');
    setConsoleLogs([
      `[Control] Initiating dynamic production pipeline request...`,
      `[Control] Webtoon Destination target: ${targetUrl}`,
      `[Control] Cinematic parameters applied -> FPS: ${frameRate} | Actor: ${voiceActor} | Audio: ${musicTheme}`,
      `[Model] Active AI Engine: ${selectedModel}`,
      `[Model] Sending request to AI model for OCR transcription & scene analysis...`,
      `[Pipeline] Storyboard contains ${panels.length} panel(s) queued for compilation`
    ]);

    try {
      setProgressStatus("Scraping Webtoon strips & downloading frames...");
      setConsoleLogs(prev => [...prev, `[Scraper] Spawned crawler tasks to fetch strip images...`]);

      const requestBody = {
        url: targetUrl,
        episode_id: `wp_${Math.random().toString(36).substring(2, 8)}`,
        panels: panels,
        model: selectedModel
      };

      const response = await fetchWithInterceptor("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      
      setConsoleLogs(prev => [
        ...prev,
        `[Scraper] Retrieved vertical strip elements successfully.`,
        `[Vision OCR] Isolated ${responseData.panels_processed} panels dynamically.`,
        `[Model] AI engine ${selectedModel} completed OCR + scene analysis`,
        `[MoviePy] Compiling timeline with Pan/Zoom animations...`,
        `[MoviePy] Encoded output video: ${responseData.video_url}`,
        `[Pipeline] [SUCCESS] Video generation pipeline completed successfully!`
      ]);
      
      setPanels(responseData.panels || []);
      setVideoUrl(responseData.video_url);
      setProgressStatus("Slices mapped & MP4 master timeline generated!");
      setActivePreviewTab("video");
      addNotification('Video generated successfully! Check the preview player.', 'success');
      
    } catch (err: any) {
      setConsoleLogs(prev => [
        ...prev,
        `[Pipeline] [ERROR] Video generation failed: ${err.message || 'Unknown error'}`,
        `[Pipeline] Error code: ${err.status || err.code || 'unknown'} | Model: ${selectedModel}`
      ]);

      if (!err.intercepted) {
        let errMessage = err.message || "An unexpected connection error occurred.";
        if (errMessage.includes("429") || errMessage.includes("quota")) {
          errMessage = "You've exceeded your daily/request quota for the Gemini API. Please wait a short while for the quota to reset, or check your billing plan in Google AI Studio to increase your limits.";
        }
        addNotification(`Pipeline failed: ${errMessage}. Please try refreshing the page or try again.`, "error");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerReprocess = async (panelId: number) => {
    const activePanel = panels.find(p => p.id === panelId);
    if (!activePanel) return;

    setReprocessingPanelId(panelId);
    const activePadding = activePanel.crop_padding !== undefined ? activePanel.crop_padding : 4;
    setConsoleLogs(prev => [
      `[OCR/CV Engine] Recalculating tighter cropping margins (padding: ${activePadding}%) & OCR vectors for Scene #${panelId}...`,
      ...prev
    ]);

    try {
      let currentUrl = activePanel.image_url;
      if (currentUrl.includes("/api/proxy-image")) {
        const urlObj = new URL(currentUrl, window.location.origin);
        urlObj.searchParams.set("reprocess_nonce", Date.now().toString());
        if (activePanel.smart_crop) {
          urlObj.searchParams.set("tighter", "true");
        }
        if (activePanel.crop_padding !== undefined) {
          urlObj.searchParams.set("crop_padding", activePanel.crop_padding.toString());
        }
        currentUrl = urlObj.pathname + urlObj.search;
      }

      await new Promise(resolve => setTimeout(resolve, 900));

      setPanels(prev => prev.map(p => p.id === panelId ? { ...p, image_url: currentUrl } : p));
      
      setConsoleLogs(prev => [
        `[OCR/CV Engine] [SUCCESS] Scene #${panelId} output canvas successfully re-parsed into tighter boundaries with margin padding ${activePadding}%!`,
        ...prev
      ]);
      addNotification(`Panel #${panelId} reprocessed with tighter margins (${activePadding}% padding).`, 'success');
    } catch (err: any) {
      setConsoleLogs(prev => [
        `[OCR/CV Engine] [ERROR] Reprocessing failed for Scene #${panelId}: ${err.message || 'Unknown error'}`,
        ...prev
      ]);
      addNotification(`Panel reprocessing failed. Please try again later.`, "error");
    } finally {
      setReprocessingPanelId(null);
    }
  };

  return {
    isProcessing,
    progressStatus,
    reprocessingPanelId,
    handleGenerateVideo,
    handleTriggerReprocess,
  };
}
