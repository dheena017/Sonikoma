import React, { useState, useCallback } from "react";
import { GeneratedPanel } from "../types";
import { NotificationType } from "../components/NotificationStack";

interface UseAutoAnalysisProps {
  scrapedImages: string[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: any;
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
}

export function useAutoAnalysis({
  scrapedImages,
  setPanels,
  setConsoleLogs,
  addNotification,
  fetchWithInterceptor,
  setActivePreviewTab,
}: UseAutoAnalysisProps) {
  const runBackgroundAnalysis = useCallback(async (panelId: number, imageUrl: string) => {
    try {
      const res = await fetchWithInterceptor("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });
      if (!res.ok) throw new Error(`Analysis failed with status ${res.status}`);
      const data = await res.json();
      if (data.success && data.analysis) {
        setPanels((prev) =>
          prev.map((p) =>
            p.id === panelId
              ? {
                  ...p,
                  speech_text: data.analysis.speech_text || p.speech_text,
                  sfx: data.analysis.sfx || p.sfx,
                  duration: Number(data.analysis.duration) || p.duration,
                  motion_type: data.analysis.motion_type || p.motion_type,
                  visual_description:
                    data.analysis.visual_description || p.visual_description,
                  isAnalyzing: false,
                }
              : p
          )
        );
        setConsoleLogs((prev) => [
          `[AI Auto-Analysis] AI transcribed and fully mapped cinematic properties for Panel #${panelId}!`,
          ...prev,
        ]);
        addNotification(`Panel #${panelId} analysis completed successfully!`, 'success');
      } else {
        throw new Error("Invalid response keys from AI Model Analysis");
      }
    } catch (err: any) {
      addNotification(`Panel #${panelId} AI analysis failed.`, 'error');
      setPanels((prev) =>
        prev.map((p) =>
          p.id === panelId
            ? {
                ...p,
                speech_text: `Separated scene segment frame #${panelId}.`,
                sfx: "[Surge]",
                isAnalyzing: false,
              }
            : p
        )
      );
    }
  }, [fetchWithInterceptor, addNotification, setPanels, setConsoleLogs]);

  const addPanelsWithAutoAnalysis = useCallback((imgUrls: string[], currentScrapedList?: string[], shouldScroll: boolean = true) => {
    if (imgUrls.length === 0) return;

    if (shouldScroll) {
      setActivePreviewTab("storyboard");
      setTimeout(() => {
        document.getElementById("storyboard_timeline_section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }

    let newIds: { id: number; url: string }[] = [];
    const imageList = currentScrapedList || scrapedImages;

    setPanels((prev) => {
      const baseId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1;

      const newPanelsToAdd = imgUrls.map((imgUrl, loopIdx) => {
        const assignedId = baseId + loopIdx;
        newIds.push({ id: assignedId, url: imgUrl });

        return {
          id: assignedId,
          image_url: imgUrl,
          speech_text: `Loading dialogue... ✦`,
          sfx: "[Deep Scan]",
          duration: 4.5,
          motion_type: "zoom_in",
          isAnalyzing: true,
        };
      });

      return [...prev, ...newPanelsToAdd];
    });

    setConsoleLogs((prev) => [
      `[GUI] Added ${imgUrls.length} frames; spawning staggered AI OCR dialogue & camera motion detection...`,
      ...prev,
    ]);
    addNotification(`Added ${imgUrls.length} panel(s) to storyboard. Spawning AI analysis...`, 'info');

    // Developer console visibility
    console.log(`[GUI] Added ${imgUrls.length} frame(s) to storyboard`, newIds);

    newIds.forEach((item) => {
      runBackgroundAnalysis(item.id, item.url);
    });
  }, [scrapedImages, runBackgroundAnalysis, addNotification, setActivePreviewTab, setPanels, setConsoleLogs]);

  return {
    runBackgroundAnalysis,
    addPanelsWithAutoAnalysis,
  };
}
