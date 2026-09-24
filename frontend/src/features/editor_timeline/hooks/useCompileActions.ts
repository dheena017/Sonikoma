import { normalizeLog } from "@/types/logs";
import React, { useState } from "react";
import { GeneratedPanel } from "@/types";
import { processWithConcurrency, chunkArray } from "@/shared/utils/batchUtils";
import * as api from "@/api/index";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { saveAs } from "file-saver";
import { buildZipBlobFromUrls } from "@/features/workspace_scraper/hooks/useLiveScraperZip";

interface UseCompileActionsProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setVideoUrl?: React.Dispatch<React.SetStateAction<string>>;
  addNotification?: (message: string, type: unknown) => void;
  targetUrl?: string;
  fetchWithInterceptor?: typeof fetch;
  selectedModel?: string;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  voiceActor?: string;
  musicTheme?: string;
  narrationStyle?: string;
  speechRate?: number;
  speechPitch?: number;
  audioFeedback?: any;
  enableDialogueAudio?: boolean;
  enableNarrativeAudio?: boolean;
}

export function useCompileActions({
  panels,
  setPanels,
  setActivePreviewTab,
  setVideoUrl,
  addNotification,
  targetUrl,
  fetchWithInterceptor,
  selectedModel,
  setConsoleLogs,
  voiceActor,
  musicTheme,
  narrationStyle = "long",
  speechRate = 1.0,
  speechPitch = 1.0,
  audioFeedback,
  enableDialogueAudio,
  enableNarrativeAudio,
}: UseCompileActionsProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const [analyzingPanelId, setAnalyzingPanelId] = useState<number | string | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState<boolean>(false);
  const [isAnalyzingSelected, setIsAnalyzingSelected] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const abortSignalRef = React.useRef({ aborted: false });
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const getAudioFlags = () => {
    const genDiag =
      enableDialogueAudio !== undefined
        ? enableDialogueAudio
        : typeof window !== "undefined"
        ? localStorage.getItem("ai_comic_enable_dialogue_audio") === "true"
        : false;
    const genNarr =
      enableNarrativeAudio !== undefined
        ? enableNarrativeAudio
        : typeof window !== "undefined"
        ? localStorage.getItem("ai_comic_enable_narrative_audio") !== "false"
        : true;
    return {
      generate_audio: genDiag || genNarr,
      generate_dialogue_audio: genDiag,
      generate_narrative_audio: genNarr,
      enableDialogueAudio: genDiag,
      enableNarrativeAudio: genNarr,
    };
  };

  const handleCancelAnalysis = () => {
    abortSignalRef.current.aborted = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (addNotification) {
      addNotification("Cancelling analysis...", "info");
    }
  };

  const handleDownloadZip = async () => {
    if (panels.length === 0) return;
    setIsZipping(true);
    console.log(
      "[Timeline] Starting ZIP download for",
      panels.length,
      "panels"
    );
    try {
      const urls = panels.map((p) => p.image_url);
      const { blob, zipFilename } = await buildZipBlobFromUrls(
        urls,
        activeFetch,
        { targetUrl }
      );
      saveAs(blob, zipFilename);
      console.log(
        `[Timeline] ZIP archive download triggered successfully (${zipFilename})`
      );
      if (addNotification) {
        addNotification(
          `ZIP archive (${zipFilename}) downloaded successfully!`,
          "success"
        );
        audioFeedback?.playSuccess();
      }
    } catch (err: any) {
      console.error(
        "[Timeline] Client ZIP generation failed, falling back to API:",
        err
      );
      try {
        const urls = panels.map((p) => p.image_url);
        const data = await api.downloadZip(activeFetch, {
          urls,
          url: targetUrl,
        });
        if (data.success && data.downloadUrl) {
          const link = document.createElement("a");
          link.href = data.downloadUrl;
          link.download = data.filename || "comic_panels_archive.zip";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          addNotification?.("ZIP archive downloaded successfully!", "success");
          audioFeedback?.playSuccess();
        } else {
          throw new Error(data.error || "Failed to package ZIP archive.");
        }
      } catch (fallbackErr: any) {
        console.error(
          "[Timeline] ZIP download failed completely:",
          fallbackErr
        );
        if (addNotification) {
          addNotification(
            fallbackErr.message || "Failed to compile ZIP archive.",
            "error"
          );
        }
      }
    } finally {
      setIsZipping(false);
      console.log("[Timeline] ZIP download operation completed");
    }
  };

  const handleAnalyzePanel = async (panelId: number | string, imageUrl: string) => {
    setAnalyzingPanelId(panelId);
    setPanels((prev) =>
      prev.map((p) => (String(p.id) === String(panelId) ? { ...p, isAnalyzing: true } : p))
    );
    const activeModel = selectedModel;
    const originalPanel = panels.find((p) => String(p.id) === String(panelId));
    const originalText = originalPanel ? originalPanel.speech_text : "";
    const originalMotion = originalPanel ? originalPanel.motion_type : "";

    console.log(
      "[Timeline] Starting Smart Scanner analysis for panel",
      panelId
    );
    console.log(`  - Model used: ${activeModel}`);
    console.log(`  - Sent Image: ${imageUrl.substring(0, 60)}...`);
    console.log(`  - Sent Original Dialogue: "${originalText}"`);
    console.log(`  - Sent Original Motion: "${originalPanel?.motion_type || ""}"`);

    if (addNotification) {
      addNotification(
        `Starting AI Scanner for Panel #${panelId}...`,
        "info"
      );
    }

    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Smart Auto-Analysis] Initiated analysis on Panel #${panelId} (Model: ${activeModel || "gemini-2.5-flash"})`,
        `[Smart Auto-Analysis]   - Sent Dialogue: "${originalText || "None"}"`,
        ...prev,
      ]);
    }

    try {
      abortControllerRef.current = new AbortController();
      console.log("[API] Analyzing image for panel", panelId);

      const currentMemory = useProjectStore.getState().activeProjectData?.story_memory;
      const panelIndex = panels.findIndex((p) => String(p.id) === String(panelId));
      let precedingContext = "";
      if (panelIndex > 0) {
        const prevPanel = panels[panelIndex - 1];
        const prevSpeech = prevPanel.speech_text ? `Previous speech: "${prevPanel.speech_text}"` : "";
        const prevNarrative = prevPanel.narrative ? `Previous scene recap: "${prevPanel.narrative}"` : "";
        precedingContext = [prevSpeech, prevNarrative].filter(Boolean).join(" | ");
      }

      const data = await api.analyzeSingleImage(
        activeFetch,
        {
          url: imageUrl,
          model: activeModel,
          narrationStyle,
          voice: voiceActor,
          story_memory: currentMemory || undefined,
          story_context: precedingContext || undefined,
          ...getAudioFlags(),
        },
        { signal: abortControllerRef.current.signal }
      );

      if (data.story_memory) {
        useProjectStore.getState().updateStoryMemory(data.story_memory);
      }

      const analysis = data.analysis || data;
      if (data.success && (data.analysis || analysis.speech_text !== undefined || analysis.visual_description !== undefined)) {
        const aiDuration = Number(analysis.duration);
        const aiMotion = String(analysis.motion_type || "").trim();
        const usedModel = (data as any).model || activeModel || "gemini-2.5-flash";
        const latMs = (data as any).latency_ms ? ` (${(data as any).latency_ms}ms)` : "";
        const speech = analysis.speech_text !== undefined ? analysis.speech_text : originalPanel?.speech_text;
        const sfx = analysis.sfx !== undefined ? analysis.sfx : originalPanel?.sfx;
        const visual = analysis.visual_description !== undefined ? analysis.visual_description : originalPanel?.visual_description;
        const narrative = data.narrative || data.narrativeText || analysis.narrative || analysis.narrativeText || originalPanel?.narrative;
        const narrativeAudioUrl = data.narrative_audio_url || analysis.narrative_audio_url || originalPanel?.narrative_audio_url;

        setPanels((prev) =>
          prev.map((p) =>
            String(p.id) === String(panelId)
              ? {
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
                  audio_url: data.audio_url || p.audio_url,
                  narrative,
                  narrative_audio_url: narrativeAudioUrl,
                  isAnalyzing: false,
                }
              : p
          )
        );

        console.log(
          `[Timeline] Smart Scanner completed for panel #${panelId} (${usedModel})`
        );

        if (setConsoleLogs) {
          setConsoleLogs((prev) => [
            `[Smart Auto-Analysis] [SUCCESS] Panel #${panelId} analyzed by ${usedModel}${latMs}!`,
            `[Smart Auto-Analysis]   - Dialogue: "${speech}"`,
            `[Smart Auto-Analysis]   - Motion: "${aiMotion}" | Duration: ${aiDuration}s | SFX: "${sfx}"`,
            ...prev,
          ]);
        }

        if (addNotification) {
          addNotification(
            `Smart Scanner analysis completed for Panel #${panelId}!`,
            "success"
          );
          audioFeedback?.playSuccess();
        }
      } else {
        throw new Error(
          data.error || "System Model Analysis returned unsuccessful status"
        );
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[Timeline] Panel analysis was cancelled.");
        if (addNotification) {
          addNotification("Panel analysis was cancelled.", "info");
        }
        return;
      }
      console.error("[Timeline] Panel analysis failed:", err);
      if (setConsoleLogs) {
        setConsoleLogs((prev) => [
          `[Smart Auto-Analysis] [ERROR] Analysis failed for Panel #${panelId}: ${
            err.message || "Unknown error"
          }`,
          ...prev,
        ]);
      }
      if (addNotification) {
        addNotification(
          `Smart Scanner analysis failed for Panel #${panelId}: ${
            err.message || "Please try again."
          }`,
          "error"
        );
      }
    } finally {
      setAnalyzingPanelId(null);
      setPanels((prev) =>
        prev.map((p) => (String(p.id) === String(panelId) ? { ...p, isAnalyzing: false } : p))
      );
    }
  };

  const handleAnalyzeSelectedPanels = async (selectedIds: (number | string)[]) => {
    if (selectedIds.length === 0) return;
    setIsAnalyzingSelected(true);
    const activeModel = selectedModel || undefined;
    const modelDisplay = activeModel ? `Model: ${activeModel}` : "AI Core Routing (Dynamic)";
    const selectedIdsSet = new Set(selectedIds.map(String));

    if (addNotification) {
      addNotification(
        `Starting Sequence Analysis for ${selectedIds.length} selected panel(s) (${modelDisplay})...`,
        "info"
      );
    }

    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Sequence Analysis] Initiating analysis for ${selectedIds.length} selected panel(s) (${modelDisplay})`,
        ...prev,
      ]);
    }

    // Set ONLY selected panels to analyzing state
    setPanels((prev) =>
      prev.map((p) =>
        selectedIdsSet.has(String(p.id)) ? { ...p, isAnalyzing: true } : p
      )
    );

    try {
      const targetPanels = panels.filter((p) => selectedIdsSet.has(String(p.id)));
      abortControllerRef.current = new AbortController();

      const BATCH_SIZE = 5;
      const chunks: typeof targetPanels[] = [];
      for (let i = 0; i < targetPanels.length; i += BATCH_SIZE) {
        chunks.push(targetPanels.slice(i, i + BATCH_SIZE));
      }

      let totalSuccess = 0;
      let lastModelUsed = activeModel || "Dynamic AI Model";

      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        if (abortSignalRef.current.aborted) break;
        const currentChunk = chunks[cIdx];
        const currentChunkSet = new Set(currentChunk.map((p) => String(p.id)));
        const currentMemory = useProjectStore.getState().activeProjectData?.story_memory;

        if (setConsoleLogs) {
          setConsoleLogs((prev) => [
            `[Sequence Analysis] Processing Batch ${cIdx + 1}/${chunks.length} (${currentChunk.length} panels)...`,
            ...prev,
          ]);
        }

        const data = await api.analyzeSelectedPanels(
          activeFetch,
          {
            panels: currentChunk.map((p) => ({ id: p.id, url: p.image_url })),
            model: activeModel,
            narrationStyle,
            voice: voiceActor,
            story_memory: currentMemory || undefined,
            ...getAudioFlags(),
          },
          { signal: abortControllerRef.current.signal }
        );

        if (data.story_memory) {
          useProjectStore.getState().updateStoryMemory(data.story_memory);
        }

        if (data.success && data.results) {
          lastModelUsed = (data as any).model || (data.results?.[0] as any)?.model || lastModelUsed;

          const resultsById = new Map<string, any>();
          data.results.forEach((r: any, index: number) => {
            if (r.id !== undefined && r.id !== null) {
              resultsById.set(String(r.id), r);
            }
            if (currentChunk[index]) {
              resultsById.set(String(currentChunk[index].id), r);
            }
          });

          setPanels((prev) =>
            prev.map((p) => {
              if (!currentChunkSet.has(String(p.id))) return p;

              const result = resultsById.get(String(p.id));
              const analysis = result?.analysis || result;

              if (result && (result.analysis || analysis?.speech_text !== undefined || analysis?.visual_description !== undefined)) {
                totalSuccess++;
                const aiDuration = Number(analysis.duration);
                const aiMotion = String(analysis.motion_type || "").trim();
                const speech = analysis.speech_text !== undefined ? analysis.speech_text : p.speech_text;
                const sfx = analysis.sfx !== undefined ? analysis.sfx : p.sfx;
                const visual = analysis.visual_description !== undefined ? analysis.visual_description : p.visual_description;
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
        }
      }

      if (setConsoleLogs) {
        setConsoleLogs((prev) => [
          `[Sequence Analysis] [SUCCESS] Model: ${lastModelUsed} | Completed analysis for ${totalSuccess}/${targetPanels.length} frame(s)!`,
          ...prev,
        ]);
      }

      if (!abortSignalRef.current.aborted && addNotification) {
        addNotification(
          `Sequence analysis completed for ${totalSuccess} panel(s)!`,
          "success"
        );
        audioFeedback?.playSuccess();
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[useCompileActions] Sequence analysis cancelled.");
        if (addNotification) {
          addNotification("Sequence analysis was cancelled.", "info");
        }
      } else {
        console.error(
          "[useCompileActions] Selected panel analysis failed:",
          err
        );
        if (addNotification) {
          addNotification(
            `Sequence analysis failed: ${err.message || "Unknown error"}`,
            "error"
          );
        }
      }
      setPanels((prev) =>
        prev.map((p) =>
          selectedIdsSet.has(String(p.id)) ? { ...p, isAnalyzing: false } : p
        )
      );
    } finally {
      setIsAnalyzingSelected(false);
      setPanels((prev) =>
        prev.map((p) =>
          selectedIdsSet.has(String(p.id)) ? { ...p, isAnalyzing: false } : p
        )
      );
    }
  };

  const handleAnalyzeAllPanels = async () => {
    if (panels.length === 0) return;
    setIsAnalyzingAll(true);
    abortSignalRef.current.aborted = false;
    const activeModel = selectedModel || undefined;
    const modelDisplay = activeModel ? `Model: ${activeModel}` : "AI Core Routing (Dynamic)";

    if (addNotification) {
      addNotification(
        `Analyzing Sequence... (Phase 1: Character Dialogue, Sound Effects & Timing | ${modelDisplay})`,
        "info"
      );
    }

    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Sequence Analysis] Initiating multimodal context-aware sequential analysis for all ${panels.length} panels (${modelDisplay})...`,
        ...prev,
      ]);
    }

    // Set all panels to analyzing state
    setPanels((prev) => prev.map((p) => ({ ...p, isAnalyzing: true })));

    try {
      abortControllerRef.current = new AbortController();

      const BATCH_SIZE = 5;
      const chunks: typeof panels[] = [];
      for (let i = 0; i < panels.length; i += BATCH_SIZE) {
        chunks.push(panels.slice(i, i + BATCH_SIZE));
      }

      let totalSuccess = 0;
      let lastModelUsed = activeModel || "Dynamic AI Model";

      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        if (abortSignalRef.current.aborted) break;
        const currentChunk = chunks[cIdx];
        const currentChunkSet = new Set(currentChunk.map((p) => String(p.id)));
        const currentMemory = useProjectStore.getState().activeProjectData?.story_memory;

        if (setConsoleLogs) {
          setConsoleLogs((prev) => [
            `[Sequence Analysis] Processing Batch ${cIdx + 1}/${chunks.length} (${currentChunk.length} panels)...`,
            ...prev,
          ]);
        }

        const data = await api.analyzeAllPanels(
          activeFetch,
          {
            panels: currentChunk.map((p) => ({ id: p.id, url: p.image_url })),
            model: activeModel,
            narrationStyle,
            voice: voiceActor,
            story_memory: currentMemory || undefined,
            ...getAudioFlags(),
          },
          { signal: abortControllerRef.current.signal }
        );

        if (data.story_memory) {
          useProjectStore.getState().updateStoryMemory(data.story_memory);
        }

        if (data.success && data.results) {
          lastModelUsed = (data as any).model || (data.results?.[0] as any)?.model || lastModelUsed;

          const resultsById = new Map<string, any>();
          data.results.forEach((r: any, index: number) => {
            if (r.id !== undefined && r.id !== null) {
              resultsById.set(String(r.id), r);
            }
            if (currentChunk[index]) {
              resultsById.set(String(currentChunk[index].id), r);
            }
          });

          // Map of results to panels state
          setPanels((prev) =>
            prev.map((p) => {
              if (!currentChunkSet.has(String(p.id))) return p;

              const result = resultsById.get(String(p.id));
              const analysis = result?.analysis || result;

              if (result && (result.analysis || analysis?.speech_text !== undefined || analysis?.visual_description !== undefined)) {
                totalSuccess++;
                const aiDuration = Number(analysis.duration);
                const aiMotion = String(analysis.motion_type || "").trim();
                const speech = analysis.speech_text !== undefined ? analysis.speech_text : p.speech_text;
                const sfx = analysis.sfx !== undefined ? analysis.sfx : p.sfx;
                const visual = analysis.visual_description !== undefined ? analysis.visual_description : p.visual_description;
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
        }
      }

      if (setConsoleLogs) {
        setConsoleLogs((prev) => [
          `[Sequence Analysis] [SUCCESS] Model: ${lastModelUsed} | Completed full sequence analysis for ${totalSuccess}/${panels.length} frames!`,
          ...prev,
        ]);
      }

      if (!abortSignalRef.current.aborted && addNotification) {
        addNotification(
          `Sequence analysis completed for ${totalSuccess} panel(s)!`,
          "success"
        );
        audioFeedback?.playSuccess();
      }
    } catch (err: any) {
      if (err.name === "AbortError" || abortSignalRef.current.aborted) {
        console.log("[useCompileActions] Sequence analysis cancelled.");
        if (addNotification) {
          addNotification("Sequence analysis was cancelled.", "info");
        }
      } else {
        console.error("[useCompileActions] Sequence analysis failed:", err);
        if (addNotification) {
          addNotification(
            err?.message || "Sequence analysis encountered an error.",
            "error"
          );
        }
      }
    } finally {
      setIsAnalyzingAll(false);
      setPanels((prev) => prev.map((p) => ({ ...p, isAnalyzing: false })));
    }
  };

  return {
    analyzingPanelId,
    isAnalyzingAll,
    isAnalyzingSelected,
    isZipping,
    handleDownloadZip,
    handleAnalyzePanel,
    handleAnalyzeAllPanels,
    handleAnalyzeSelectedPanels,
    handleCancelAnalysis,
  };
}
