import React, { useState, useCallback } from "react";
import { GeneratedPanel } from "../types.js";
import { NotificationType } from "../components/NotificationStack.js";
import * as api from "../api/index.js";

interface UseAutoAnalysisProps {
  panels: GeneratedPanel[];
  selectedModel?: string;
  scrapedImages: string[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: any;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  narrationStyle?: string;
  setAccumulatedTokens?: React.Dispatch<React.SetStateAction<number>>;
  audioFeedback?: any;
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
  setAccumulatedTokens,
  audioFeedback,
}: UseAutoAnalysisProps) {
  const runBackgroundAnalysis = useCallback(
    async (panelId: number, imageUrl: string) => {
      console.log(
        `[Smart Auto-Analysis] Starting analysis for panel #${panelId}`
      );
      try {
        const data = await api.analyzeImage(fetchWithInterceptor, {
          url: imageUrl,
          model: selectedModel,
          narrationStyle,
        });
        console.log(
          `[Smart Auto-Analysis] Response for panel #${panelId}:`,
          data
        );
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
            `[Smart Auto-Analysis] System transcribed and fully mapped cinematic properties for Panel #${panelId}!`,
            ...prev,
          ]);
          addNotification(
            `Panel #${panelId} analysis completed successfully!`,
            "success"
          );
          audioFeedback?.playSuccess();
          if (setAccumulatedTokens && (data.inputTokens || data.outputTokens)) {
            const addedTokens =
              (data.inputTokens || 0) + (data.outputTokens || 0);
            setAccumulatedTokens((prev) => prev + addedTokens);
            console.log(
              `[Smart Auto-Analysis] Tracked ${addedTokens} tokens (Total accumulating...)`
            );
          }
        } else {
          throw new Error(
            data.error || "Invalid response keys from System Model Analysis"
          );
        }
      } catch (err: any) {
        console.error(
          `[Smart Auto-Analysis] Analysis failed for panel #${panelId}:`,
          err
        );
        addNotification(
          `Panel #${panelId} Smart Scanner analysis failed: ${
            err.message || err
          }`,
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

  const runSequenceAnalysis = useCallback(
    async (panelIds: number[], imageUrls: string[]) => {
      if (panelIds.length === 0) return;
      console.log(
        `[Smart Sequence Analysis] Starting for ${imageUrls.length} panels`
      );

      // Set loading state for all selected panels
      setPanels((prev) =>
        prev.map((p) =>
          panelIds.includes(p.id) ? { ...p, isAnalyzing: true } : p
        )
      );

      try {
        const data = await api.analyzeSequence(fetchWithInterceptor, {
          urls: imageUrls,
          model: selectedModel,
          narrationStyle,
        });

        if (data.success && data.results) {
          // Map results back to the respective panels
          setPanels((prev) =>
            prev.map((p) => {
              const idx = panelIds.indexOf(p.id);
              if (idx !== -1 && data.results[idx]) {
                const result = data.results[idx];
                return {
                  ...p,
                  speech_text: result.analysis.speech_text || p.speech_text,
                  sfx: result.analysis.sfx || p.sfx,
                  duration: Number(result.analysis.duration) || p.duration,
                  motion_type: result.analysis.motion_type || p.motion_type,
                  visual_description:
                    result.analysis.visual_description || p.visual_description,
                  audio_url: result.audio_url || p.audio_url, // Bind the generated audio!
                  isAnalyzing: false,
                };
              }
              return p;
            })
          );

          setConsoleLogs((prev) => [
            `[Sequence Analysis] Context-aware storyboard script generated for ${imageUrls.length} frames!`,
            ...prev,
          ]);
          addNotification(
            `Sequence analysis completed successfully!`,
            "success"
          );
          audioFeedback?.playSuccess();

          if (setAccumulatedTokens && (data.inputTokens || data.outputTokens)) {
            const addedTokens =
              (data.inputTokens || 0) + (data.outputTokens || 0);
            setAccumulatedTokens((prev) => prev + addedTokens);
            console.log(
              `[Sequence Analysis] Tracked ${addedTokens} tokens (Total accumulating...)`
            );
          }
        } else {
          throw new Error(
            data.error || "Invalid response from sequence analysis"
          );
        }
      } catch (err: any) {
        console.error(`[Sequence Analysis] Failed:`, err);
        addNotification(
          `Sequence analysis failed: ${err.message || err}`,
          "error"
        );

        // Reset analyzing state on failure
        setPanels((prev) =>
          prev.map((p) =>
            panelIds.includes(p.id) ? { ...p, isAnalyzing: false } : p
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
        setActivePreviewTab("timeline");
        setTimeout(() => {
          document
            .getElementById("timeline_section")
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
        `[GUI] Added ${imgUrls.length} frame(s) to timeline.`,
        ...prev,
      ]);
      addNotification(`Added ${imgUrls.length} panel(s) to timeline.`, "info");

      // Developer console visibility
      console.log(
        `[GUI] Added ${imgUrls.length} frame(s) to timeline`,
        newPanelsToAdd
      );
    },
    [panels, addNotification, setActivePreviewTab, setPanels, setConsoleLogs]
  );

  return {
    runBackgroundAnalysis,
    runSequenceAnalysis,
    addPanelsToStoryboard,
  };
}
