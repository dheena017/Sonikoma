import { useState } from "react";
import { GeneratedPanel } from "../types";

interface UseCompileActionsProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
  setVideoUrl?: React.Dispatch<React.SetStateAction<string>>;
  addNotification?: (message: string, type: any) => void;
  targetUrl?: string;
  fetchWithInterceptor?: typeof fetch;
  selectedModel?: string;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
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
}: UseCompileActionsProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const [analyzingPanelId, setAnalyzingPanelId] = useState<number | null>(null);
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
    handleDownloadZip,
    handleAnalyzePanel,
    handleCompileVideo,
  };
}
