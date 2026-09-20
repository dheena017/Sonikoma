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
          voice: voiceActor || localStorage.getItem("ai_comic_voice") || undefined,
          narrationStyle,
        });
        console.log(
          `[Smart Auto-Analysis] Response for panel #${panelId}:`,
          data
        );
        if (data.success && data.analysis) {
          const modelUsed = (data as any).model || selectedModel || "gemini-2.5-flash";
          const returnedAudioUrl = data.audio_url || data.analysis.audio_url || null;

          setPanels((prev) =>
            prev.map((p) =>
              String(p.id) === String(panelId)
                ? {
                    ...p,
                    speech_text: data.analysis.speech_text || p.speech_text,
                    narrative: data.narrative || data.analysis.narrative || p.narrative,
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
                    audio_url: returnedAudioUrl || p.audio_url,
                    speech_audio_url: returnedAudioUrl || p.speech_audio_url,
                    isAnalyzing: false,
                  }
                : p
            )
          );
          setConsoleLogs((prev) => [
            `[Smart Auto-Analysis] [SUCCESS] Model: ${modelUsed} | Panel #${panelId} transcribed & fully mapped!`,
            ...prev,
          ]);
          addNotification(
            `Model: ${modelUsed} | Panel #${panelId} analysis completed!`,
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
      audioFeedback,
      setAccumulatedTokens,
    ]
  );

  const runSequenceAnalysis = useCallback(
    async (panelIds: number[], imageUrls: string[]) => {
      if (panelIds.length === 0) return;
      const activeModel = selectedModel || undefined;
      const modelDisplay = activeModel ? `Model: ${activeModel}` : "AI Core Routing (Dynamic)";
      console.log(
        `[Smart Sequence Analysis] Starting for ${imageUrls.length} panels (${modelDisplay})`
      );

      setConsoleLogs((prev) => [
        `[Sequence Analysis] Initiating analysis for ${panelIds.length} panel(s) (${modelDisplay})`,
        ...prev,
      ]);

      // Set loading state for all selected panels
      setPanels((prev) =>
        prev.map((p) =>
          panelIds.includes(p.id) ? { ...p, isAnalyzing: true } : p
        )
      );

      try {
        const data = await api.analyzeSelectedPanels(fetchWithInterceptor, {
          panels: panelIds.map((id, idx) => ({ id, url: imageUrls[idx] })),
          model: activeModel,
          narrationStyle,
          voice: voiceActor,
        });

        if (data.success && data.results) {
          const tierLabel = (data as any).tier_label || (data.results?.[0] as any)?.tier_label || "Tier 1: Primary";
          const modelUsed = (data as any).model || (data.results?.[0] as any)?.model || activeModel || "Dynamic AI Model";
          const attempt = (data as any).attempt || (data.results?.[0] as any)?.attempt || 1;
          const totalCandidates = (data as any).total_candidates || (data.results?.[0] as any)?.total_candidates || 1;

          setPanels((prev) =>
            prev.map((p, idx) => {
              if (!panelIds.map(String).includes(String(p.id))) return p;
              const result =
                data.results.find((r: any) => String(r.id) === String(p.id)) ||
                (data.results.length === 1 && panelIds.length === 1 ? data.results[0] : data.results[idx]);
              const analysis = result?.analysis || result;
              if (result && (result.analysis || analysis?.speech_text !== undefined || analysis?.visual_description !== undefined)) {
                const speech = analysis.speech_text !== undefined ? analysis.speech_text : p.speech_text;
                const sfx = analysis.sfx !== undefined ? analysis.sfx : p.sfx;
                const visual = analysis.visual_description !== undefined ? analysis.visual_description : p.visual_description;
                const aiDuration = Number(analysis.duration);
                const aiMotion = String(analysis.motion_type || "").trim();
                const narrative =
                  result.narrative ||
                  result.narrativeText ||
                  result.analysis?.narrative ||
                  result.analysis?.narrativeText ||
                  p.narrative;
                const narrativeAudioUrl =
                  result.narrative_audio_url ||
                  result.analysis?.narrative_audio_url ||
                  p.narrative_audio_url;

                return {
                  ...p,
                  speech_text: speech,
                  dialogueSubtitleText: speech,
                  sfx: sfx,
                  soundEffectSfx: sfx,
                  duration: aiDuration > 0 ? aiDuration : p.duration,
                  timingSec: aiDuration > 0 ? aiDuration : p.duration,
                  motion_type: aiMotion.length > 0 ? aiMotion : p.motion_type,
                  camMotion: aiMotion.length > 0 ? aiMotion : p.motion_type,
                  visual_description: visual,
                  visual_scene_description: visual,
                  audio_url: result.audio_url || p.audio_url,
                  narrative,
                  narrative_audio_url: narrativeAudioUrl,
                  isAnalyzing: false,
                };
              }
              return { ...p, isAnalyzing: false };
            })
          );

          setConsoleLogs((prev) => [
            `[Sequence Analysis] [SUCCESS] [${tierLabel}] (Attempt ${attempt}/${totalCandidates}) | Model: ${modelUsed} | Context-aware storyboard script generated for ${imageUrls.length} frame(s)!`,
            ...prev,
          ]);
          addNotification(
            `[${tierLabel}] (Attempt ${attempt}/${totalCandidates}) | Model: ${modelUsed} | Sequence analysis completed for ${panelIds.length} panel(s)!`,
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
      } finally {
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

      const episodeGroups: Array<{
        episodeLabel: string;
        startIndex: number;
        count: number;
      }> =
        ((window as any).__scrapeEpisodeGroups as Array<{
          episodeLabel: string;
          startIndex: number;
          count: number;
        }>) || [];
      const scrapedList: string[] =
        currentScrapedList ||
        (window as any).__scrapedImagesList ||
        scrapedImages ||
        [];

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
          prompt: "",
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
