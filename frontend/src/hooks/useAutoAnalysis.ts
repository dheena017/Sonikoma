import React, { useState, useCallback } from "react";
import { GeneratedPanel } from "../types";
import { NotificationType } from "../components/NotificationStack";

interface UseAutoAnalysisProps {
  panels: GeneratedPanel[];
  selectedModel?: string;
  scrapedImages: string[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: any;
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
  narrationStyle?: string;
}

export function useAutoAnalysis({
  panels,
  selectedModel,
  scrapedImages,
  setPanels,
  setConsoleLogs,
  addNotification,
  fetchWithInterceptor,
  setActivePreviewTab,
  narrationStyle = "long",
}: UseAutoAnalysisProps) {
  const runBackgroundAnalysis = useCallback(
    async (panelId: number, imageUrl: string) => {
      console.log(`[AI Auto-Analysis] Starting analysis for panel #${panelId}`);
      try {
        const res = await fetchWithInterceptor("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrl,
            model: selectedModel,
            narrationStyle,
          }),
        });
        if (!res.ok)
          throw new Error(`Analysis failed with status ${res.status}`);
        const data = await res.json();
        console.log(`[AI Auto-Analysis] Response for panel #${panelId}:`, data);
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
          addNotification(
            `Panel #${panelId} analysis completed successfully!`,
            "success"
          );
        } else {
          throw new Error(
            data.error || "Invalid response keys from AI Model Analysis"
          );
        }
      } catch (err: any) {
        console.error(
          `[AI Auto-Analysis] Analysis failed for panel #${panelId}:`,
          err
        );
        addNotification(
          `Panel #${panelId} AI analysis failed: ${err.message || err}`,
          "error"
        );
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
    },
    [
      fetchWithInterceptor,
      addNotification,
      setPanels,
      setConsoleLogs,
      selectedModel,
      narrationStyle,
    ]
  );

  const addPanelsToStoryboard = useCallback(
    (
      imgUrls: string[],
      currentScrapedList?: string[],
      shouldScroll: boolean = true
    ) => {
      if (imgUrls.length === 0) return;

      if (shouldScroll) {
        setActivePreviewTab("storyboard");
        setTimeout(() => {
          document
            .getElementById("storyboard_timeline_section")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }

      const baseId =
        panels.length > 0 ? Math.max(...panels.map((p) => p.id)) + 1 : 1;

      const newPanelsToAdd = imgUrls.map((imgUrl, loopIdx) => {
        // Resolve original_url from the scrape origins map so the DB can recover
        // this image if the in-memory cache is lost after a server restart
        const origins: Record<string, string> =
          (window as any).__scrapeImageOrigins || {};
        const originalUrl = origins[imgUrl] || null;

        return {
          id: baseId + loopIdx,
          image_url: imgUrl,
          original_url: originalUrl,
          speech_text: "",
          sfx: "",
          duration: 4.5,
          motion_type: "zoom_in",
          isAnalyzing: false,
        };
      });

      setPanels((prev) => [...prev, ...newPanelsToAdd]);

      setConsoleLogs((prev) => [
        `[GUI] Added ${imgUrls.length} frame(s) to storyboard.`,
        ...prev,
      ]);
      addNotification(
        `Added ${imgUrls.length} panel(s) to storyboard.`,
        "info"
      );

      // Developer console visibility
      console.log(
        `[GUI] Added ${imgUrls.length} frame(s) to storyboard`,
        newPanelsToAdd
      );
    },
    [panels, addNotification, setActivePreviewTab, setPanels, setConsoleLogs]
  );

  return {
    runBackgroundAnalysis,
    addPanelsToStoryboard,
  };
}
