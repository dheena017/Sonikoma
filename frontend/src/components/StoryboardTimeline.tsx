import React from "react";
import { GeneratedPanel } from "../types";
import { getPanelFilterStyle } from "../utils";
import { Sparkles, RefreshCw, Download } from "lucide-react";

interface StoryboardTimelineProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  currentPanelIndex: number;
  setCurrentPanelIndex: (idx: number) => void;
  activePreviewTab: "video" | "storyboard";
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
  setPlaybackTime: (time: number) => void;
  hasScrapedImages?: boolean;
  setVideoUrl?: React.Dispatch<React.SetStateAction<string>>;
  addNotification?: (message: string, type: any) => void;
  targetUrl?: string;
  fetchWithInterceptor?: typeof fetch;
  selectedModel?: string;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function StoryboardTimeline({
  panels,
  setPanels,
  currentPanelIndex,
  setCurrentPanelIndex,
  activePreviewTab,
  setActivePreviewTab,
  setPlaybackTime,
  hasScrapedImages = false,
  setVideoUrl,
  addNotification,
  targetUrl,
  fetchWithInterceptor,
  selectedModel,
  setConsoleLogs
}: StoryboardTimelineProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const [analyzingPanelId, setAnalyzingPanelId] = React.useState<number | null>(null);
  const [isCompiling, setIsCompiling] = React.useState<boolean>(false);
  const [isZipping, setIsZipping] = React.useState<boolean>(false);

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
        console.log('  - Revise (New Dialogue):', data.analysis.speech_text);
        console.log('  - Revise (New Motion):', data.analysis.motion_type);
        console.log('  - Revise (New Duration):', data.analysis.duration);
        console.log('  - Revise (SFX):', data.analysis.sfx);
        console.log('  - Revise (Visual Desc):', data.analysis.visual_description);

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
      console.log('[StoryboardTimeline] AI analysis operation completed for panel', panelId);
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
      console.log('[StoryboardTimeline] Video compilation operation completed');
    }
  };

  if (panels.length === 0) {
    if (hasScrapedImages) {
      return (
        <div id="panels_timeline_section_empty" className="bg-neutral-900/30 rounded-2xl border border-purple-500/20 border-dashed p-10 text-center space-y-4 max-w-4xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-xl bg-purple-950/40 border border-purple-500/35 flex items-center justify-center text-purple-400 font-mono text-xl animate-pulse">
            ✦
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-neutral-200 font-sans">No Scenes in Storyboard Yet</p>
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              Images are loaded in the deck below! Select frame items and click <span className="text-purple-300 font-semibold font-mono">Insert Selected</span>, or click <span className="text-purple-300 font-semibold font-mono font-sans">+ Insert to Storyboard</span> on any individual panel card in the deck to build your video storyboard.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div id="panels_timeline_section_empty" className="bg-neutral-900/30 rounded-2xl border border-neutral-800/60 border-dashed p-8 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-center text-neutral-500 font-mono text-lg">
          #
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-neutral-300 font-sans">Storyboard Deck Awaiting URL</p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
            Once a valid Webtoon viewer URL is pasted, the continuous canvas strip will automatically scrape. You can then insert, partition, and map them into editable scenes here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="panels_timeline_section" className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="font-bold text-base text-white">Dynamic Storyboard & OCR Transcription</h3>
          <p className="text-xs text-neutral-400">Review live isolated panel frames. Adjust speech transcripts locally below.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* ZIP Download Button */}
          <button
            type="button"
            disabled={isZipping || panels.length === 0}
            onClick={handleDownloadZip}
            className={`px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isZipping
                ? "bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed"
                : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-200 shadow-sm hover:border-neutral-700"
            }`}
          >
            {isZipping ? (
              <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
            ) : (
              <Download className="h-4 w-4 text-purple-400" />
            )}
            <span>{isZipping ? "Zipping..." : "Download Panels ZIP"}</span>
          </button>

          <button
            type="button"
            disabled={isCompiling || panels.length === 0}
            onClick={handleCompileVideo}
            className={`px-4 py-2 text-xs rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isCompiling
                ? "bg-purple-900/40 border-purple-500/50 text-purple-200 cursor-not-allowed"
                : "bg-purple-600 border-purple-500 hover:bg-purple-500 text-white shadow-md hover:shadow-purple-500/20"
            }`}
          >
            {isCompiling ? (
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
            )}
            <span>{isCompiling ? "Compiling Video..." : "Convert Storyboard to Video"}</span>
          </button>
        </div>
      </div>

      {/* Storyboard grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {panels.map((panel, idx) => {
          const isCurrent = idx === currentPanelIndex && activePreviewTab === "storyboard";
          return (
            <div
              key={panel.id}
              className={`w-[260px] shrink-0 rounded-xl border p-3.5 space-y-3 transition-all ${
                isCurrent 
                  ? "bg-neutral-800/80 border-purple-500 shadow-lg" 
                  : "bg-neutral-950 border-neutral-800"
              }`}
            >
              {/* Image Thumbnail */}
              <div 
                onClick={() => {
                  setCurrentPanelIndex(idx);
                  setActivePreviewTab("storyboard");
                  setPlaybackTime(0);
                }}
                className="relative h-32 rounded-lg overflow-hidden cursor-pointer select-none bg-neutral-950 border border-neutral-800 flex items-center justify-center group"
              >
                <img 
                  src={panel.image_url} 
                  alt={`Panel ${panel.id}`} 
                  className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  style={{ filter: getPanelFilterStyle(panel) }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />

                {(panel.isAnalyzing || analyzingPanelId === panel.id) && (
                  <div className="absolute inset-0 bg-purple-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center animate-pulse z-10">
                    <Sparkles className="h-5 w-5 text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-[9px] font-mono font-bold text-purple-300 mt-1 uppercase tracking-wider">Loading...</span>
                    <div className="scanner-line" />
                  </div>
                )}
                
                {/* Number tag */}
                <div className="absolute top-2 left-2 h-5 w-5 rounded bg-black/80 backdrop-blur flex items-center justify-center font-mono text-[10px] text-purple-400 font-bold border border-purple-900/40">
                  #{panel.id}
                </div>

                {/* Motion overlay text */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono uppercase tracking-wider text-neutral-300">
                  {panel.motion_type}
                </div>
              </div>

              {/* Text OCR Editable Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">Dialogue/Subtitle Text</label>
                  {(panel.isAnalyzing || analyzingPanelId === panel.id) && (
                    <span className="text-[9px] font-mono font-bold text-purple-400 animate-pulse flex items-center gap-0.5">
                      <span>✦ Loading...</span>
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
                  value={panel.speech_text}
                  onChange={(e) => handleModifySpeechText(panel.id, e.target.value)}
                  className={`w-full bg-neutral-900 border border-neutral-800 text-[11px] rounded-lg p-2 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all ${
                    (panel.isAnalyzing || analyzingPanelId === panel.id) ? "opacity-60 cursor-not-allowed border-purple-900/40 text-purple-300" : ""
                  }`}
                />
              </div>

              {/* Playback specifications */}
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-neutral-900/80">
                <div>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block">Cam Motion</span>
                  <select
                    value={panel.motion_type}
                    onChange={(e) => handleModifyMotion(panel.id, e.target.value)}
                    className="bg-neutral-900 text-[11px] text-neutral-300 rounded border border-neutral-800 p-1 w-full outline-none"
                  >
                    <option value="zoom_in">Zoom In</option>
                    <option value="zoom_out">Zoom Out</option>
                    <option value="pan_right">Pan Right</option>
                    <option value="pan_left">Pan Left</option>
                    <option value="pan_down">Pan Down</option>
                  </select>
                </div>

                <div>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block">Timing (sec)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={15}
                      step={0.5}
                      value={panel.duration}
                      onChange={(e) => handleModifyDuration(panel.id, parseFloat(e.target.value) || 4.0)}
                      className="bg-neutral-900 text-[11px] text-neutral-300 rounded border border-neutral-800 p-1 w-full outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={analyzingPanelId === panel.id}
                  onClick={() => handleAnalyzePanel(panel.id, panel.image_url)}
                  className={`w-full py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    analyzingPanelId === panel.id
                      ? "bg-purple-900/40 border-purple-500/50 text-purple-200"
                      : "bg-purple-950/40 border-purple-800/40 hover:bg-purple-900/60 text-purple-300 hover:border-purple-600"
                  }`}
                >
                  {analyzingPanelId === panel.id ? (
                    <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
                  ) : (
                    <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
                  )}
                  <span>{analyzingPanelId === panel.id ? "Analyzing Panel..." : "AI Image Analyse"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-1 font-mono">
                <span>SFX: {panel.sfx || "None"}</span>
                <span>{idx + 1} / {panels.length}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
