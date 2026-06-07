import { useState } from "react";
import { GeneratedPanel } from "../types";

interface UseStoryboardOperationsProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setCurrentPanelIndex: (idx: number) => void;
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
  setVideoUrl?: React.Dispatch<React.SetStateAction<string>>;
  addNotification?: (message: string, type: any) => void;
  targetUrl?: string;
  fetchWithInterceptor?: typeof fetch;
  selectedModel?: string;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useStoryboardOperations({
  panels,
  setPanels,
  setCurrentPanelIndex,
  setActivePreviewTab,
  setVideoUrl,
  addNotification,
  targetUrl,
  fetchWithInterceptor,
  selectedModel,
  setConsoleLogs,
}: UseStoryboardOperationsProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const [analyzingPanelId, setAnalyzingPanelId] = useState<number | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [showBulkOps, setShowBulkOps] = useState<boolean>(false);
  const [bulkDuration, setBulkDuration] = useState<number>(4.0);
  const [bulkMotion, setBulkMotion] = useState<string>("zoom_in");
  const [bulkPreset, setBulkPreset] = useState<string>("none");

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

  const handleModifySpeechText = (panelId: number, text: string) => {
    const originalPanel = panels.find(p => p.id === panelId);
    const originalText = originalPanel ? originalPanel.speech_text : "";
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, speech_text: text } : p));
    console.log(`[StoryboardTimeline] [Text Edit] Panel #${panelId} dialogue revised:`);
    console.log(`  - Sent (Original): "${originalText}"`);
    console.log(`  - Revise (Revised): "${text}"`);
    if (setConsoleLogs) {
      setConsoleLogs(prev => [
        `[Speech Bubbles] Dialogue revised on Panel #${panelId}`,
        `[Speech Bubbles]   - Sent (Original): "${originalText}"`,
        `[Speech Bubbles]   - Revise (Revised): "${text}"`,
        ...prev
      ]);
    }
  };

  const handleModifyMotion = (panelId: number, motionVal: string) => {
    const originalPanel = panels.find(p => p.id === panelId);
    const originalMotion = originalPanel ? originalPanel.motion_type : "";
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, motion_type: motionVal } : p));
    console.log(`[StoryboardTimeline] [Motion Edit] Panel #${panelId} camera motion changed:`);
    console.log(`  - Sent (Original): "${originalMotion}"`);
    console.log(`  - Revise (Revised): "${motionVal}"`);
    if (setConsoleLogs) {
      setConsoleLogs(prev => [
        `[MoviePy] Camera motion revised on Panel #${panelId}`,
        `[MoviePy]   - Sent (Original): "${originalMotion}"`,
        `[MoviePy]   - Revise (Revised): "${motionVal}"`,
        ...prev
      ]);
    }
  };

  const handleModifyDuration = (panelId: number, durVal: number) => {
    const originalPanel = panels.find(p => p.id === panelId);
    const originalDuration = originalPanel ? originalPanel.duration : 0;
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, duration: durVal } : p));
    console.log(`[StoryboardTimeline] [Duration Edit] Panel #${panelId} duration changed:`);
    console.log(`  - Sent (Original): ${originalDuration}s`);
    console.log(`  - Revise (Revised): ${durVal}s`);
    if (setConsoleLogs) {
      setConsoleLogs(prev => [
        `[MoviePy] Playback duration revised on Panel #${panelId}`,
        `[MoviePy]   - Sent (Original): ${originalDuration}s`,
        `[MoviePy]   - Revise (Revised): ${durVal}s`,
        ...prev
      ]);
    }
  };

  const handleShiftPanel = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index > 0) {
      setPanels(prev => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[index - 1];
        copy[index - 1] = temp;
        return copy;
      });
      setCurrentPanelIndex(index - 1);
    } else if (direction === "right" && index < panels.length - 1) {
      setPanels(prev => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[index + 1];
        copy[index + 1] = temp;
        return copy;
      });
      setCurrentPanelIndex(index + 1);
    }
  };

  const handleBulkSetDuration = () => {
    setPanels(prev => prev.map(p => ({ ...p, duration: bulkDuration })));
    addNotification?.(`Applied ${bulkDuration}s duration to all panels!`, "success");
  };

  const handleBulkSetMotion = () => {
    setPanels(prev => prev.map(p => ({ ...p, motion_type: bulkMotion })));
    addNotification?.(`Applied '${bulkMotion}' motion to all panels!`, "success");
  };

  const handleBulkSetPreset = () => {
    setPanels(prev => prev.map(p => ({ ...p, filter_preset: bulkPreset })));
    addNotification?.(`Applied '${bulkPreset}' style filter to all panels!`, "success");
  };

  const handleClearTimeline = () => {
    if (window.confirm("Are you sure you want to clear the entire storyboard timeline?")) {
      setPanels([]);
      addNotification?.("Storyboard cleared", "info");
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
        body: JSON.stringify({ url: imageUrl, model: activeModel })
      });
      if (!res.ok) throw new Error("Image analysis failed");
      const data = await res.json();
      if (data.success && data.analysis) {
        setPanels(prev => prev.map(p => p.id === panelId ? {
          ...p,
          speech_text: data.analysis.speech_text || p.speech_text,
          sfx: data.analysis.sfx || p.sfx,
          duration: Number(data.analysis.duration) || p.duration,
          motion_type: data.analysis.motion_type || p.motion_type,
          visual_description: data.analysis.visual_description || p.visual_description
        } : p));

        console.log('[StoryboardTimeline] AI analysis completed successfully for panel', panelId);

        if (setConsoleLogs) {
          setConsoleLogs(prev => [
            `[AI Auto-Analysis] [SUCCESS] Panel #${panelId} analysis completed by ${activeModel}!`,
            `[AI Auto-Analysis]   - Revise (Dialogue): "${data.analysis.speech_text}"`,
            `[AI Auto-Analysis]   - Revise (Motion): "${data.analysis.motion_type}" | Duration: ${data.analysis.duration}s`,
            `[AI Auto-Analysis]   - Revise (SFX): "${data.analysis.sfx}"`,
            ...prev
          ]);
        }

        if (addNotification) {
          addNotification(`AI analysis completed for Panel #${panelId}!`, 'success');
        }
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
        addNotification(`AI analysis failed for Panel #${panelId}. Please try again.`, 'error');
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
          url: targetUrl || ""
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

  return {
    analyzingPanelId,
    isCompiling,
    isZipping,
    showBulkOps,
    setShowBulkOps,
    bulkDuration,
    setBulkDuration,
    bulkMotion,
    setBulkMotion,
    bulkPreset,
    setBulkPreset,
    handleDownloadZip,
    handleModifySpeechText,
    handleModifyMotion,
    handleModifyDuration,
    handleShiftPanel,
    handleBulkSetDuration,
    handleBulkSetMotion,
    handleBulkSetPreset,
    handleClearTimeline,
    handleAnalyzePanel,
    handleCompileVideo,
  };
}
