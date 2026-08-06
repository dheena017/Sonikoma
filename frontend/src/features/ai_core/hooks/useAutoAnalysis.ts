import { LogEntry, normalizeLog } from "@/types/logs";
import React, { useState, useCallback, useMemo } from "react";
import { GeneratedPanel } from "@/types";
import { NotificationType } from "@/features/app_notification";
import * as api from "@/api/index";

interface UseAutoAnalysisProps {
  panels: GeneratedPanel[];
  selectedModel?: string;
  scrapedImages: string[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: any;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  narrationStyle?: string;
  voiceActor?: string;
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
  voiceActor,
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
                        duration:
                          data.analysis.duration !== undefined
                            ? Number(data.analysis.duration)
                            : p.duration,
                        motion_type:
                          data.analysis.motion_type !== undefined
                            ? data.analysis.motion_type
                            : p.motion_type,
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
        const data = await api.analyzeSelectedPanels(fetchWithInterceptor, {
          panels: panelIds.map((id, idx) => ({ id, url: imageUrls[idx] })),
          model: selectedModel,
          narrationStyle,
          voice: voiceActor,
        });

        if (data.success && data.results) {
          setPanels((prev) =>
            prev.map((p) => {
              const result = data.results.find((r: any) => r.id === p.id);
              if (result && result.analysis) {
                return {
                  ...p,
                  speech_text: result.analysis.speech_text || p.speech_text,
                  sfx: result.analysis.sfx || p.sfx,
                  duration:
                    result.analysis.duration !== undefined
                      ? Number(result.analysis.duration)
                      : p.duration,
                  motion_type:
                    result.analysis.motion_type !== undefined
                      ? result.analysis.motion_type
                      : p.motion_type,
                  visual_description:
                    result.analysis.visual_description || p.visual_description,
                  audio_url: result.audio_url || p.audio_url,
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
      voiceActor,
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

      const episodeGroups: Array<{ episodeLabel: string; startIndex: number; count: number }> =
        ((window as any).__scrapeEpisodeGroups as Array<{ episodeLabel: string; startIndex: number; count: number }>) || [];
      const scrapedList: string[] = currentScrapedList || (window as any).__scrapedImagesList || scrapedImages || [];

      const newPanelsToAdd = imgUrls.map((imgUrl, loopIdx) => {
        // Resolve original_url from the scrape origins map so the DB can recover
        // this image if the in-memory cache is lost after a server restart
        const origins: Record<string, string> =
          (window as any).__scrapeImageOrigins || {};
        const originalUrl = origins[imgUrl] || null;

        // Find which episode group this image belongs to
        let targetEpLabel: string | undefined = undefined;
        if (episodeGroups.length > 0 && scrapedList.length > 0) {
          const imgIdx = scrapedList.indexOf(imgUrl);
          if (imgIdx !== -1) {
            const matchedGrp = episodeGroups.find(
              (g) => imgIdx >= g.startIndex && imgIdx < g.startIndex + g.count
            );
            if (matchedGrp) {
              targetEpLabel = matchedGrp.episodeLabel;
            }
          }
        }

        return {
          id: baseId + loopIdx,
          image_url: imgUrl,
          original_url: originalUrl ?? undefined,
          speech_text: "",
          sfx: "",
          duration: 0,
          motion_type: "",
          isAnalyzing: false,
          episode_label: targetEpLabel,
        };
      });

      setPanels((prev) => [...prev, ...newPanelsToAdd]);

      setConsoleLogs((prev) => [
        `[GUI] Added ${imgUrls.length} frame(s) to timeline.`,
        ...prev,
      ]);
      addNotification(
        `Added ${imgUrls.length} panel(s) to timeline. Unsaved changes — click "Save Project" to save.`,
        "warning"
      );

      // Developer console visibility
      console.log(
        `[GUI] Added ${imgUrls.length} frame(s) to timeline`,
        newPanelsToAdd
      );
    },
    [panels, addNotification, setActivePreviewTab, setPanels, setConsoleLogs]
  );

  return useMemo(
    () => ({
      runBackgroundAnalysis,
      runSequenceAnalysis,
      addPanelsToStoryboard,
    }),
    [runBackgroundAnalysis, runSequenceAnalysis, addPanelsToStoryboard]
  );
}
