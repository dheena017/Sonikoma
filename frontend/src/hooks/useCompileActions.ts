import React, { useState } from "react";
import { GeneratedPanel } from "../types.js";
import { processWithConcurrency, chunkArray } from "../utils/batchUtils.js";
import * as api from "../api/index.js";

interface UseCompileActionsProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setVideoUrl?: React.Dispatch<React.SetStateAction<string>>;
  addNotification?: (message: string, type: unknown) => void;
  targetUrl?: string;
  fetchWithInterceptor?: typeof fetch;
  selectedModel?: string;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  voiceActor?: string;
  musicTheme?: string;
  narrationStyle?: string;
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
}: UseCompileActionsProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const [analyzingPanelId, setAnalyzingPanelId] = useState<number | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const abortSignalRef = React.useRef({ aborted: false });
  const abortControllerRef = React.useRef<AbortController | null>(null);

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
      console.log(
        "[API] Requesting image ZIP download with",
        urls.length,
        "image URLs"
      );
      const data = await api.downloadZip(activeFetch, { urls, url: targetUrl });
      if (data.success && data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = data.filename || "comic_panels_archive.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("[Timeline] ZIP archive download triggered successfully");
        if (addNotification) {
          addNotification("ZIP archive downloaded successfully!", "success");
        }
      } else {
        throw new Error(data.error || "Failed to package ZIP archive.");
      }
    } catch (err: any) {
      console.error("[Timeline] ZIP download failed:", err);
      if (addNotification) {
        addNotification(
          err.message || "Failed to compile ZIP archive.",
          "error"
        );
      }
    } finally {
      setIsZipping(false);
      console.log("[Timeline] ZIP download operation completed");
    }
  };

  const handleAnalyzePanel = async (panelId: number, imageUrl: string) => {
    setAnalyzingPanelId(panelId);
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, isAnalyzing: true } : p))
    );
    const activeModel = selectedModel || "gemini-2.5-flash";
    const originalPanel = panels.find((p) => p.id === panelId);
    const originalText = originalPanel ? originalPanel.speech_text : "";
    const originalMotion = originalPanel ? originalPanel.motion_type : "";

    console.log(
      "[Timeline] Starting Smart Scanner analysis for panel",
      panelId
    );
    console.log(`  - Model used: ${activeModel}`);
    console.log(`  - Sent Image: ${imageUrl.substring(0, 60)}...`);
    console.log(`  - Sent Original Dialogue: "${originalText}"`);
    console.log(`  - Sent Original Motion: "${originalMotion}"`);

    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Smart Auto-Analysis] Initiated image analysis on Panel #${panelId} using model: ${activeModel}`,
        `[Smart Auto-Analysis]   - Sent (Original Dialogue): "${originalText}"`,
        ...prev,
      ]);
    }

    try {
      abortControllerRef.current = new AbortController();
      console.log("[API] Analyzing image for panel", panelId);
      const data = await api.analyzeImage(
        activeFetch,
        {
          url: imageUrl,
          model: activeModel,
          narrationStyle,
          voice: voiceActor,
        },
        { signal: abortControllerRef.current.signal }
      );
      if (data.success && data.analysis) {
        const aiDuration = Number(data.analysis.duration);
        const aiMotion = String(data.analysis.motion_type || "").trim();
        setPanels((prev) =>
          prev.map((p) =>
            p.id === panelId
              ? {
                  ...p,
                  speech_text: data.analysis.speech_text || p.speech_text,
                  sfx: data.analysis.sfx || p.sfx,
                  // Always use System duration if it's a valid positive number
                  duration: aiDuration > 0 ? aiDuration : p.duration,
                  // Always use System motion if it returned a valid value
                  motion_type: aiMotion.length > 0 ? aiMotion : p.motion_type,
                  visual_description:
                    data.analysis.visual_description || p.visual_description,
                  audio_url: data.audio_url || p.audio_url,
                  isAnalyzing: false,
                }
              : p
          )
        );

        console.log(
          "[Timeline] Smart Scanner analysis completed successfully for panel",
          panelId
        );

        if (setConsoleLogs) {
          setConsoleLogs((prev) => [
            `[Smart Auto-Analysis] [SUCCESS] Panel #${panelId} analysis completed by ${activeModel}!`,
            `[Smart Auto-Analysis]   - System Set Dialogue: "${data.analysis.speech_text}"`,
            `[Smart Auto-Analysis]   - System Set Motion: "${aiMotion}" | System Set Duration: ${aiDuration}s`,
            `[Smart Auto-Analysis]   - System Set SFX: "${data.analysis.sfx}"`,
            ...prev,
          ]);
        }

        if (addNotification) {
          addNotification(
            `Smart Scanner analysis completed for Panel #${panelId}!`,
            "success"
          );
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
        prev.map((p) => (p.id === panelId ? { ...p, isAnalyzing: false } : p))
      );
    }
  };

  const handleAnalyzeSelectedPanels = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) return;
    setIsAnalyzingAll(true);
    if (addNotification) {
      addNotification(
        `Starting global Sequence Analysis for ${selectedIds.length} selected panel(s)...`,
        "info"
      );
    }

    // Set all selected panels to analyzing state
    setPanels((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, isAnalyzing: true } : p
      )
    );

    try {
      const activeModel = selectedModel || "gemini-2.5-flash";
      const targetPanels = panels.filter((p) => selectedIds.includes(p.id));
      abortControllerRef.current = new AbortController();

      const imageUrls = targetPanels.map((p) => p.image_url);

      const data = await api.analyzeSequence(
        activeFetch,
        {
          urls: imageUrls,
          model: activeModel,
          narrationStyle,
          voice: voiceActor,
        },
        { signal: abortControllerRef.current.signal }
      );

      if (data.success && data.results) {
        setPanels((prev) =>
          prev.map((p) => {
            if (!selectedIds.includes(p.id)) return p;

            const result = data.results.find((r: any) => r.url === p.image_url);
            if (result && result.analysis) {
              const aiDuration = Number(result.analysis.duration);
              const aiMotion = String(result.analysis.motion_type || "").trim();
              return {
                ...p,
                speech_text: result.analysis.speech_text || p.speech_text,
                sfx: result.analysis.sfx || p.sfx,
                duration: aiDuration > 0 ? aiDuration : p.duration,
                motion_type: aiMotion.length > 0 ? aiMotion : p.motion_type,
                visual_description:
                  result.analysis.visual_description || p.visual_description,
                audio_url: result.audio_url || p.audio_url,
                isAnalyzing: false,
              };
            }
            return { ...p, isAnalyzing: false };
          })
        );

        if (setConsoleLogs) {
          setConsoleLogs((prev) => [
            `[Sequence Analysis] Context-aware storyboard script generated for ${imageUrls.length} frames!`,
            ...prev,
          ]);
        }
      } else {
        throw new Error(
          data.error || "Sequence analysis returned unsuccessful status"
        );
      }

      if (!abortSignalRef.current.aborted && addNotification) {
        addNotification(
          `Smart Sequence Analysis completed for ${selectedIds.length} selected panel(s)!`,
          "success"
        );
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
            "Sequence analysis of selected panels encountered an error.",
            "error"
          );
        }
      }
      setPanels((prev) =>
        prev.map((p) =>
          selectedIds.includes(p.id) ? { ...p, isAnalyzing: false } : p
        )
      );
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  const handleAnalyzeAllPanels = async () => {
    if (panels.length === 0) return;
    setIsAnalyzingAll(true);
    if (addNotification) {
      addNotification(
        "Starting global Sequence Analysis for all panels...",
        "info"
      );
    }

    // Set all panels to analyzing state
    setPanels((prev) => prev.map((p) => ({ ...p, isAnalyzing: true })));

    try {
      const activeModel = selectedModel || "gemini-2.5-flash";
      abortControllerRef.current = new AbortController();

      const imageUrls = panels.map((p) => p.image_url);

      const data = await api.analyzeSequence(
        activeFetch,
        {
          urls: imageUrls,
          model: activeModel,
          narrationStyle,
          voice: voiceActor,
        },
        { signal: abortControllerRef.current.signal }
      );

      if (data.success && data.results) {
        setPanels((prev) =>
          prev.map((p) => {
            const result = data.results.find((r: any) => r.url === p.image_url);
            if (result && result.analysis) {
              const aiDuration = Number(result.analysis.duration);
              const aiMotion = String(result.analysis.motion_type || "").trim();
              return {
                ...p,
                speech_text: result.analysis.speech_text || p.speech_text,
                sfx: result.analysis.sfx || p.sfx,
                duration: aiDuration > 0 ? aiDuration : p.duration,
                motion_type: aiMotion.length > 0 ? aiMotion : p.motion_type,
                visual_description:
                  result.analysis.visual_description || p.visual_description,
                audio_url: result.audio_url || p.audio_url,
                isAnalyzing: false,
              };
            }
            return { ...p, isAnalyzing: false };
          })
        );
        if (setConsoleLogs) {
          setConsoleLogs((prev) => [
            `[Sequence Analysis] Context-aware storyboard script generated for ${imageUrls.length} frames!`,
            ...prev,
          ]);
        }
      } else {
        throw new Error(
          data.error || "Sequence analysis returned unsuccessful status"
        );
      }

      if (!abortSignalRef.current.aborted && addNotification) {
        addNotification(
          "Smart Sequence Analysis completed for all panels!",
          "success"
        );
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[useCompileActions] Full sequence analysis cancelled.");
        if (addNotification) {
          addNotification("Full sequence analysis was cancelled.", "info");
        }
      } else {
        console.error("[useCompileActions] Sequential analysis failed:", err);
        if (addNotification) {
          addNotification(
            "Smart Timeline analysis encountered an error.",
            "error"
          );
        }
      }
      setPanels((prev) => prev.map((p) => ({ ...p, isAnalyzing: false })));
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  return {
    analyzingPanelId,
    isAnalyzingAll,
    isZipping,
    handleDownloadZip,
    handleAnalyzePanel,
    handleAnalyzeAllPanels,
    handleAnalyzeSelectedPanels,
    handleCancelAnalysis,
  };
}
