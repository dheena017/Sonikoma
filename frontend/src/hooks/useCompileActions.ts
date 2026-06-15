import React, { useState } from "react";
import { GeneratedPanel } from "../types";

interface UseCompileActionsProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
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
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const handleDownloadZip = async () => {
    if (panels.length === 0) return;
    setIsZipping(true);
    console.log('[StoryboardTimeline] Starting ZIP download for', panels.length, 'panels');
    try {
      const urls = panels.map(p => p.image_url);
      console.log('[API] POST /api/download-zip with', urls.length, 'image URLs');
      const res = await activeFetch("/api/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls })
      });
      if (!res.ok) {
        throw new Error("ZIP generation failed");
      }
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = "comic_panels_archive.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('[StoryboardTimeline] ZIP archive download triggered successfully');
        if (addNotification) {
          addNotification("ZIP archive downloaded successfully!", "success");
        }
      } else {
        throw new Error(data.error || "Failed to package ZIP archive.");
      }
    } catch (err: any) {
      console.error('[StoryboardTimeline] ZIP download failed:', err);
      if (addNotification) {
        addNotification(err.message || "Failed to compile ZIP archive.", "error");
      }
    } finally {
      setIsZipping(false);
      console.log('[StoryboardTimeline] ZIP download operation completed');
    }
  };

  const handleAnalyzePanel = async (panelId: number, imageUrl: string) => {
    setAnalyzingPanelId(panelId);
    const activeModel = selectedModel || "gemini-2.5-flash";
    const originalPanel = panels.find(p => p.id === panelId);
    const originalText = originalPanel ? originalPanel.speech_text : "";
    const originalMotion = originalPanel ? originalPanel.motion_type : "";

    console.log('[StoryboardTimeline] Starting AI analysis for panel', panelId);
    console.log(`  - Model used: ${activeModel}`);
    console.log(`  - Sent Image: ${imageUrl.substring(0, 60)}...`);
    console.log(`  - Sent Original Dialogue: "${originalText}"`);
    console.log(`  - Sent Original Motion: "${originalMotion}"`);

    if (setConsoleLogs) {
      setConsoleLogs(prev => [
        `[AI Auto-Analysis] Initiated image analysis on Panel #${panelId} using model: ${activeModel}`,
        `[AI Auto-Analysis]   - Sent (Original Dialogue): "${originalText}"`,
        ...prev
      ]);
    }

    try {
      console.log('[API] POST /api/analyze-image for panel', panelId);
      const res = await activeFetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl, model: activeModel, narrationStyle })
      });
      if (!res.ok) throw new Error("Image analysis failed");
      const data = await res.json();
      if (data.success && data.analysis) {
        const aiDuration = Number(data.analysis.duration);
        const aiMotion = String(data.analysis.motion_type || "").trim();
        setPanels(prev => prev.map(p => p.id === panelId ? {
          ...p,
          speech_text: data.analysis.speech_text || p.speech_text,
          sfx: data.analysis.sfx || p.sfx,
          // Always use AI duration if it's a valid positive number
          duration: aiDuration > 0 ? aiDuration : p.duration,
          // Always use AI motion if it returned a valid value
          motion_type: aiMotion.length > 0 ? aiMotion : p.motion_type,
          visual_description: data.analysis.visual_description || p.visual_description
        } : p));

        console.log('[StoryboardTimeline] AI analysis completed successfully for panel', panelId);

        if (setConsoleLogs) {
          setConsoleLogs(prev => [
            `[AI Auto-Analysis] [SUCCESS] Panel #${panelId} analysis completed by ${activeModel}!`,
            `[AI Auto-Analysis]   - AI Set Dialogue: "${data.analysis.speech_text}"`,
            `[AI Auto-Analysis]   - AI Set Motion: "${aiMotion}" | AI Set Duration: ${aiDuration}s`,
            `[AI Auto-Analysis]   - AI Set SFX: "${data.analysis.sfx}"`,
            ...prev
          ]);
        }

        if (addNotification) {
          addNotification(`AI analysis completed for Panel #${panelId}!`, 'success');
        }
      } else {
        throw new Error(data.error || "AI Model Analysis returned unsuccessful status");
      }
    } catch (err: any) {
      console.error('[StoryboardTimeline] Panel analysis failed:', err);
      if (setConsoleLogs) {
        setConsoleLogs(prev => [
          `[AI Auto-Analysis] [ERROR] Analysis failed for Panel #${panelId}: ${err.message || 'Unknown error'}`,
          ...prev
        ]);
      }
      if (addNotification) {
        addNotification(`AI analysis failed for Panel #${panelId}: ${err.message || 'Please try again.'}`, 'error');
      }
    } finally {
      setAnalyzingPanelId(null);
    }
  };

  const handleCompileVideo = async () => {
    setIsCompiling(true);
    console.log('[StoryboardTimeline] Starting video compilation with', panels.length, 'panels');
    try {
      console.log('[API] POST /api/convert-images-to-video with', panels.length, 'panels');
      const res = await activeFetch("/api/convert-images-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panels,
          url: targetUrl || "",
          voice_actor: voiceActor,
          music_theme: musicTheme,
        })
      });
      if (!res.ok) throw new Error("Compilation API returned status " + res.status);
      const data = await res.json();
      if (data.success && data.video_url) {
        if (setVideoUrl) {
          setVideoUrl(data.video_url);
        }
        setActivePreviewTab("video");
        console.log('[StoryboardTimeline] Video compiled successfully:', data.video_url);
        if (addNotification) {
          addNotification("Cinematic video converted successfully!", "success");
        }
      } else {
        throw new Error(data.message || "Failed to locate generated video output URL.");
      }
    } catch (err: any) {
      console.error('[StoryboardTimeline] Video compilation failed:', err);
      if (addNotification) {
        addNotification(err.message || "Video compilation failed. Please try again.", "error");
      }
    } finally {
      setIsCompiling(false);
    }
  };

  const handleAnalyzeSelectedPanels = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) return;
    setIsAnalyzingAll(true);
    if (addNotification) {
      addNotification(`Starting AI analysis for ${selectedIds.length} selected panel(s)...`, "info");
    }
    console.log('[useCompileActions] Analyzing selected panels:', selectedIds);
    try {
      for (let i = 0; i < selectedIds.length; i++) {
        const panel = panels.find(p => p.id === selectedIds[i]);
        if (!panel) continue;
        console.log(`[useCompileActions] Analyzing selected panel ${i + 1}/${selectedIds.length} (ID: ${panel.id})`);
        try {
          await handleAnalyzePanel(panel.id, panel.image_url);
        } catch (err) {
          console.error(`[useCompileActions] Failed to analyze selected panel ID ${panel.id}:`, err);
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (addNotification) {
        addNotification(`AI analysis completed for ${selectedIds.length} selected panel(s)!`, "success");
      }
    } catch (err: any) {
      console.error("[useCompileActions] Selected panel analysis failed:", err);
      if (addNotification) {
        addNotification("AI analysis of selected panels encountered an error.", "error");
      }
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  const handleAnalyzeAllPanels = async () => {
    if (panels.length === 0) return;
    setIsAnalyzingAll(true);
    if (addNotification) {
      addNotification("Starting sequential AI analysis for all panels...", "info");
    }
    console.log('[useCompileActions] Initiating sequential AI analysis for all panels:', panels.length);
    try {
      // Loop sequentially to prevent API rate limiting (429/503 errors)
      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        console.log(`[useCompileActions] Analyzing panel ${i + 1}/${panels.length} (ID: ${panel.id})`);
        try {
          await handleAnalyzePanel(panel.id, panel.image_url);
        } catch (panelErr) {
          console.error(`[useCompileActions] Failed to analyze panel ID ${panel.id}:`, panelErr);
          // Continue to next panel in case one fails
        }
        // Small delay between calls to be safe with rate limits
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (addNotification) {
        addNotification("AI analysis completed for all panels!", "success");
      }
    } catch (err: any) {
      console.error("[useCompileActions] Sequential analysis failed:", err);
      if (addNotification) {
        addNotification("AI Storyboard analysis encountered an error.", "error");
      }
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  return {
    analyzingPanelId,
    isAnalyzingAll,
    isCompiling,
    isZipping,
    handleDownloadZip,
    handleAnalyzePanel,
    handleAnalyzeAllPanels,
    handleAnalyzeSelectedPanels,
    handleCompileVideo,
  };
}
