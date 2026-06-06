import React, { useState } from "react";
import { 
  Image as ImageIcon, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus, 
  Check, 
  Scissors, 
  Trash,
  Sliders,
  Sparkles,
  Brain,
  Download,
  X,
  Settings2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { GeneratedPanel } from "../types";

import { NotificationType } from "./NotificationStack";
import { ErrorPopupDetail } from "./ErrorPopupModal";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface LiveScraperDeckProps {
  scrapedImages: string[];
  isScraping: boolean;
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  stitchingIndices: number[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  currentPanelIndex: number;
  handleStitchWithNext: (idx: number) => Promise<void>;
  setEditingImageIdx: (idx: number | null) => void;
  setEditCropTop: (val: number) => void;
  setEditCropBottom: (val: number) => void;
  setEditCropLeft: (val: number) => void;
  setEditCropRight: (val: number) => void;
  setEditAutoTrim: (val: boolean) => void;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor?: typeof fetch;
  setErrorPopup?: (err: ErrorPopupDetail | null) => void;
}

export default function LiveScraperDeck({
  scrapedImages,
  isScraping,
  selectedScraped,
  setSelectedScraped,
  setScrapedImages,
  stitchingIndices,
  setConsoleLogs,
  panels,
  setPanels,
  currentPanelIndex,
  handleStitchWithNext,
  setEditingImageIdx,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setEditAutoTrim,
  addNotification,
  fetchWithInterceptor,
  setErrorPopup
}: LiveScraperDeckProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const [isBatchCropping, setIsBatchCropping] = React.useState<boolean>(false);
  const [batchProgress, setBatchProgress] = React.useState<{ current: number, total: number } | null>(null);
  const [croppingImgUrl, setCroppingImgUrl] = React.useState<string | null>(null);
  const [showAutoCropSettings, setShowAutoCropSettings] = React.useState<boolean>(false);
  const [cropSensitivity, setCropSensitivity] = React.useState<number>(30); // 5 to 90 threshold
  const [cropPaddingPx, setCropPaddingPx] = React.useState<number>(10); // 0 to 50px borders
  const [cropBackgroundMode, setCropBackgroundMode] = React.useState<string>("auto"); // 'auto', 'white', 'black'
  const [autoSplitTallStrips, setAutoSplitTallStrips] = React.useState<boolean>(true); // Slices vertical webtoons strips!

  const [isZipping, setIsZipping] = React.useState<boolean>(false);
  const [downloadReady, setDownloadReady] = React.useState<{ url: string, filename: string } | null>(null);

  const runBackgroundAnalysis = async (panelId: number, imageUrl: string) => {
    try {
      const res = await activeFetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl })
      });
      if (!res.ok) throw new Error(`Analysis failed with status ${res.status}`);
      const data = await res.json();
      if (data.success && data.analysis) {
        setPanels(prev => prev.map(p => p.id === panelId ? {
          ...p,
          speech_text: data.analysis.speech_text || p.speech_text,
          sfx: data.analysis.sfx || p.sfx,
          duration: Number(data.analysis.duration) || p.duration,
          motion_type: data.analysis.motion_type || p.motion_type,
          visual_description: data.analysis.visual_description || p.visual_description,
          isAnalyzing: false
        } : p));
        setConsoleLogs(prev => [
          `[AI Auto-Analysis] AI transcribed and fully mapped cinematic properties for Panel #${panelId}!`,
          ...prev
        ]);
      } else {
        throw new Error("Invalid response keys from AI Model Analysis");
      }
    } catch (err: any) {
      console.error(`AI background analysis failed for Panel #${panelId}:`, err);
      setPanels(prev => prev.map(p => p.id === panelId ? {
        ...p,
        speech_text: `Separated scene segment frame #${panelId}.`,
        sfx: "[Surge]",
        isAnalyzing: false
      } : p));
    }
  };

  const addPanelsWithAutoAnalysis = (imgUrls: string[]) => {
    if (imgUrls.length === 0) return;

    let newIds: { id: number, url: string }[] = [];

    setPanels(prev => {
      const baseId = prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1;
      
      const newPanelsToAdd = imgUrls.map((imgUrl, loopIdx) => {
        const originalIdx = scrapedImages.indexOf(imgUrl);
        const cardNum = originalIdx !== -1 ? originalIdx + 1 : loopIdx + 1;
        const assignedId = baseId + loopIdx;
        newIds.push({ id: assignedId, url: imgUrl });

        return {
          id: assignedId,
          image_url: imgUrl,
          speech_text: `AI Mode: transcribing dialogue/script narration from illustration #${cardNum}... ✦`,
          sfx: "[Deep Scan]",
          duration: 4.5,
          motion_type: "zoom_in",
          isAnalyzing: true
        };
      });

      return [...prev, ...newPanelsToAdd];
    });

    setConsoleLogs(prev => [
      `[GUI] Added ${imgUrls.length} frames; spawning staggered AI OCR dialogue & camera motion detection...`,
      ...prev
    ]);

    setTimeout(() => {
      newIds.forEach((item, index) => {
        setTimeout(() => {
          runBackgroundAnalysis(item.id, item.url);
        }, index * 1000); // Stagger background API calls to respect rate limits
      });
    }, 50);
  };

  if (!isScraping && scrapedImages.length === 0) return null;

  const handleAutoCropSelected = async () => {
    if (selectedScraped.length === 0) return;
    setIsBatchCropping(true);
    setConsoleLogs(prev => [
      `[Auto Cropper] Initiating enhanced auto-crop pipeline with ${selectedScraped.length} selected assets...`,
      ...prev
    ]);

    try {
      let updatedImages = [...scrapedImages];
      let updatedSelected = [...selectedScraped];
      setBatchProgress({ current: 0, total: selectedScraped.length });

      for (let i = 0; i < selectedScraped.length; i++) {
        const imgUrl = selectedScraped[i];
        setBatchProgress({ current: i + 1, total: selectedScraped.length });
        setCroppingImgUrl(imgUrl);
        
        const idx = updatedImages.indexOf(imgUrl);
        if (idx === -1) continue;

        // Standard auto-crop if no subdivision split detected or requested
        const response = await activeFetch("/api/edit-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: imgUrl,
            cropTop: 0,
            cropBottom: 0,
            cropLeft: 0,
            cropRight: 0,
            autoTrim: true,
            sensitivity: cropSensitivity,
            padding: cropPaddingPx,
            backgroundColorMode: cropBackgroundMode
          })
        });

        if (!response.ok) {
          throw new Error(`Auto-trim request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.url) {
          const currentIdx = updatedImages.indexOf(imgUrl);
          if (currentIdx !== -1) {
            updatedImages[currentIdx] = data.url;
          }
          
          const selIdx = updatedSelected.indexOf(imgUrl);
          if (selIdx !== -1) {
            updatedSelected[selIdx] = data.url;
          }

          // Propagate image changes to existing matching storyboard frames!
          setPanels(prevPanels => 
            prevPanels.map(p => p.image_url === imgUrl ? { ...p, image_url: data.url } : p)
          );
          
          setScrapedImages([...updatedImages]);
          setSelectedScraped([...updatedSelected]);
        }
      }

      setConsoleLogs(prev => [
        `[Auto Cropper] Successfully completed smart layout auto-crops for all checked images!`,
        ...prev
      ]);
    } catch (err: any) {
      console.error("[Auto Cropper] Batch process failed:", err);
      setConsoleLogs(prev => [
        `[Auto Cropper ERROR] Smart trimming operation failed: ${err.message || err}`,
        ...prev
      ]);
      addNotification(err.message || "Auto-crop failed. Please try again.", "error");
    } finally {
      setIsBatchCropping(false);
      setBatchProgress(null);
      setCroppingImgUrl(null);
    }
  };

  const [isCleaningBubbles, setIsCleaningBubbles] = React.useState<boolean>(false);
  const [cleanProgress, setCleanProgress] = React.useState<{ current: number, total: number } | null>(null);

  // ── Bubble Cleaner Settings ──────────────────────────────────────────────────
  const [showBubbleSettings, setShowBubbleSettings] = React.useState<boolean>(false);
  // Detection style controls WHICH regions are targeted
  const [bubbleDetectionStyle, setBubbleDetectionStyle] = React.useState<"all" | "white_only" | "text_only">("all");
  // Erase method controls HOW the target region is erased
  const [bubbleEraseMethod, setBubbleEraseMethod] = React.useState<"auto" | "inpaint" | "blur" | "solid_white" | "solid_black">("auto");
  // Sensitivity (0-100) – higher = more aggressive detection
  const [bubbleSensitivity, setBubbleSensitivity] = React.useState<number>(50);
  // ────────────────────────────────────────────────────────────────────────────

  const handleCleanBubblesSelected = async () => {
    if (selectedScraped.length === 0) return;
    setIsCleaningBubbles(true);
    setConsoleLogs(prev => [
      `[Bubble Cleaner] Initiating AI Speech Bubble removal for ${selectedScraped.length} selected assets...`,
      `[Bubble Cleaner] Settings → Detection: "${bubbleDetectionStyle}" | Method: "${bubbleEraseMethod}" | Sensitivity: ${bubbleSensitivity}`,
      ...prev
    ]);

    try {
      let updatedImages = [...scrapedImages];
      let updatedSelected = [...selectedScraped];
      setCleanProgress({ current: 0, total: selectedScraped.length });

      for (let i = 0; i < selectedScraped.length; i++) {
        const imgUrl = selectedScraped[i];
        setCleanProgress({ current: i + 1, total: selectedScraped.length });
        setCroppingImgUrl(imgUrl);
        
        const idx = updatedImages.indexOf(imgUrl);
        if (idx === -1) continue;

        const response = await activeFetch("/api/remove-speech-bubbles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: imgUrl,
            method: bubbleEraseMethod,
            sensitivity: bubbleSensitivity,
            dilation: -1,
            inpaint_radius: 3,
            detection_style: bubbleDetectionStyle
          })
        });

        if (!response.ok) {
          throw new Error(`Speech bubble removal failed with status ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.url) {
          const currentIdx = updatedImages.indexOf(imgUrl);
          if (currentIdx !== -1) {
            updatedImages[currentIdx] = data.url;
          }
          
          const selIdx = updatedSelected.indexOf(imgUrl);
          if (selIdx !== -1) {
            updatedSelected[selIdx] = data.url;
          }

          setPanels(prevPanels => 
            prevPanels.map(p => p.image_url === imgUrl ? { ...p, image_url: data.url } : p)
          );
          
          setScrapedImages([...updatedImages]);
          setSelectedScraped([...updatedSelected]);
        }
      }

      setConsoleLogs(prev => [
        `[Bubble Cleaner] Successfully completed AI Speech Bubble cleaning for all checked panels!`,
        ...prev
      ]);
      addNotification("Speech bubble cleaning completed successfully.", "success");
    } catch (err: any) {
      console.error("[Bubble Cleaner] Batch process failed:", err);
      setConsoleLogs(prev => [
        `[Bubble Cleaner ERROR] Cleaning operation failed: ${err.message || err}`,
        ...prev
      ]);
      addNotification(err.message || "Speech bubble cleaning failed.", "error");
    } finally {
      setIsCleaningBubbles(false);
      setCleanProgress(null);
      setCroppingImgUrl(null);
    }
  };

  return (
    <div id="scraped_strips_deck" className="bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-6 backdrop-blur-md space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-purple-400">
            <ImageIcon className="h-4 w-4" />
            <span className="text-[10px] font-semibold tracking-wider uppercase font-mono">Separated Panels</span>
          </div>
          <h3 className="font-bold text-sm text-white">Live Asset Extraction</h3>
        </div>
        <div className="flex items-center gap-3">
          {scrapedImages.length > 0 && (
            <span className="text-[9px] px-2.5 py-1 font-mono tracking-wider bg-purple-950/50 text-purple-300 rounded-full border border-purple-800/50 shadow-inner">
              {scrapedImages.length} Frames
            </span>
          )}
          <button
            onClick={() => {
              setScrapedImages([]);
              setSelectedScraped([]);
              setConsoleLogs(prev => ["[GUI] Cleared all assets from the deck", ...prev]);
            }}
            className="flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-red-400 bg-neutral-900/50 hover:bg-red-950/20 px-2 py-1 rounded-full border border-neutral-800 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear All
          </button>
        </div>
      </div>

      {isScraping ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <RefreshCw className="h-6 w-6 text-purple-500 animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">Analyzing Webtoon viewer page, extraction in progress...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
            <div className="space-y-0.5 shrink-0">
              <p className="text-xs text-neutral-400">
                These live graphics are separated dynamically from the viewer URL.
              </p>
              {scrapedImages.length > 0 && (
                <div className="text-[10px] font-mono text-neutral-500">
                  Selected: <span className="text-purple-400 font-bold font-mono">{selectedScraped.length}</span> / {scrapedImages.length}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 w-full sm:w-48 shrink-0">
              <button
                onClick={() => {
                  if (selectedScraped.length === scrapedImages.length) {
                    setSelectedScraped([]);
                    setConsoleLogs(prev => ["[GUI] Cleared selections", ...prev]);
                  } else {
                    setSelectedScraped([...scrapedImages]);
                    setConsoleLogs(prev => ["[GUI] Selected all extracted frames", ...prev]);
                  }
                }}
                disabled={scrapedImages.length === 0}
                className="w-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white px-3 py-2 rounded-lg text-[11px] uppercase tracking-wider font-semibold font-sans border border-neutral-800/60 cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedScraped.length === scrapedImages.length && scrapedImages.length > 0 ? (
                  <>
                    <Square className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Select All</span>
                  </>
                )}
              </button>

              <button
                onClick={handleAutoCropSelected}
                disabled={isBatchCropping || selectedScraped.length === 0}
                className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-neutral-800/60 text-indigo-300 px-3 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                title="Auto-Crop with Standard CV"
              >
                {isBatchCropping ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Scissors className="h-3.5 w-3.5" />
                )}
                <span className="text-[11px] uppercase tracking-wider font-semibold font-sans">
                  {isBatchCropping && batchProgress ? `Cropping (${batchProgress.current}/${batchProgress.total})` : "Auto-Crop"}
                </span>
              </button>

              {/* ── Clean Bubbles button + settings toggle ────────────────── */}
              <div className="flex gap-1">
                <button
                  onClick={handleCleanBubblesSelected}
                  disabled={isCleaningBubbles || selectedScraped.length === 0}
                  className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 border border-neutral-800/60 text-purple-300 px-3 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                  title="AI Speech Bubble removal and narration blur"
                >
                  {isCleaningBubbles ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Brain className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[11px] uppercase tracking-wider font-semibold font-sans">
                    {isCleaningBubbles && cleanProgress ? `Cleaning (${cleanProgress.current}/${cleanProgress.total})` : "Clean Bubbles"}
                  </span>
                </button>
                {/* Settings gear – toggles the bubble config panel */}
                <button
                  onClick={() => setShowBubbleSettings(prev => !prev)}
                  title="Bubble cleaner settings"
                  className={`px-2.5 rounded-lg border transition-all cursor-pointer ${
                    showBubbleSettings
                      ? "bg-purple-600/30 border-purple-500/60 text-purple-300"
                      : "bg-neutral-900/60 border-neutral-800/60 text-neutral-500 hover:text-purple-300 hover:border-purple-700/50"
                  }`}
                >
                  {showBubbleSettings ? <ChevronUp className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* ── Bubble Cleaner Settings Panel ────────────────────────── */}
              {showBubbleSettings && (
                <div id="bubble_cleaner_settings_panel" className="bg-neutral-950/90 border border-purple-900/40 rounded-2xl p-4 space-y-4 shadow-2xl animate-fadeIn">
                  <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5">
                    <Brain className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-widest font-mono">Bubble Cleaner Settings</span>
                  </div>

                  {/* ── DETECTION STYLE ── */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider font-semibold">What to detect</p>
                    <div className="flex flex-col gap-1.5">
                      {([
                        { value: "all",        label: "All Bubble Types",     hint: "White bubbles + colored boxes + floating text (uses AI)" },
                        { value: "white_only", label: "White Bubbles Only",   hint: "Standard speech / shout / thought bubbles with white fill" },
                        { value: "text_only",  label: "Floating Text Only",   hint: "Narration boxes & borderless text on colored backgrounds" },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setBubbleDetectionStyle(opt.value)}
                          className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                            bubbleDetectionStyle === opt.value
                              ? "bg-purple-900/40 border-purple-500 text-white"
                              : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                          }`}
                        >
                          <span className="text-[11px] font-bold font-mono">{opt.label}</span>
                          <span className="text-[9px] text-neutral-500 font-sans mt-0.5">{opt.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── ERASE METHOD ── */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider font-semibold">How to erase</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { value: "auto",        label: "Auto (AI)",       hint: "AI classifies each region then picks the best eraser" },
                        { value: "inpaint",     label: "Inpaint TELEA",   hint: "Reconstructs background behind the bubble (best quality)" },
                        { value: "blur",        label: "Gaussian Blur",   hint: "Softly blurs the bubble area – preserves background tones" },
                        { value: "solid_white", label: "Fill White",      hint: "Paints the bubble region solid white" },
                        { value: "solid_black", label: "Fill Black",      hint: "Paints the bubble region solid black" },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setBubbleEraseMethod(opt.value)}
                          title={opt.hint}
                          className={`flex flex-col items-start px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                            bubbleEraseMethod === opt.value
                              ? "bg-indigo-900/40 border-indigo-500 text-white"
                              : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                          }`}
                        >
                          <span className="text-[11px] font-bold font-mono">{opt.label}</span>
                          <span className="text-[9px] text-neutral-500 font-sans mt-0.5 leading-tight">{opt.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── SENSITIVITY SLIDER ── */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider font-mono flex justify-between">
                      <span>Detection Sensitivity</span>
                      <span className="text-white font-bold">{bubbleSensitivity}%</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={bubbleSensitivity}
                      onChange={(e) => setBubbleSensitivity(Number(e.target.value))}
                      className="w-full accent-purple-500 bg-neutral-800 rounded-lg h-1.5 px-0 cursor-pointer hover:accent-purple-400 transition-colors"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
                      <span>Conservative (miss less)</span>
                      <span>Aggressive (catch more)</span>
                    </div>
                  </div>

                  {/* ── Explanation legend ── */}
                  <div className="border-t border-neutral-800 pt-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wider">How it works</p>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { color: "bg-purple-500", label: "White Bubbles",     desc: "Detected by brightness threshold → inpainted" },
                        { color: "bg-orange-400", label: "Narration Boxes",   desc: "Colored rectangles → Gaussian blur to kill text" },
                        { color: "bg-sky-400",    label: "Floating Text",     desc: "Borderless text on art → soft blur mask applied" },
                        { color: "bg-red-400",    label: "SFX (BOOM/CRASH)", desc: "Embedded art text → kept for visual style" },
                      ].map(item => (
                        <div key={item.label} className="flex items-start gap-2">
                          <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                          <p className="text-[9px] text-neutral-400 font-sans">
                            <span className="font-bold text-neutral-300">{item.label}: </span>{item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}



              <div className="flex items-stretch bg-neutral-900/80 border border-neutral-800/60 rounded-lg overflow-hidden shadow-sm">
                <button
                  onClick={async () => {
                    const isSelected = selectedScraped.length > 0;
                    const toDownload = isSelected ? selectedScraped : scrapedImages;
                    if (toDownload.length === 0) return;
                    setIsZipping(true);
                    setDownloadReady(null);
                    try {
                      const zip = new JSZip();
                      const folder = zip.folder("webtoon_frames");
                      if (!folder) {
                         addNotification("Failed to create zip folder", "error");
                         setIsZipping(false);
                         return;
                      }
                      for (let i = 0; i < toDownload.length; i++) {
                        try {
                          const url = toDownload[i];
                          const res = await fetch(url);
                          const blob = await res.blob();
                          const filename = `webtoon_frame_${String(i + 1).padStart(3, '0')}.png`;
                          folder.file(filename, blob);
                        } catch (err) {
                          console.error("Download failed for:", toDownload[i], err);
                        }
                      }
                      const base64Content = await zip.generateAsync({ type: "base64" });
                      const dataUrl = "data:application/zip;base64," + base64Content;
                      try {
                          const blobContent = await zip.generateAsync({ type: "blob" });
                          saveAs(blobContent, "webtoon_frames.zip");
                      } catch(e) {}
                      setDownloadReady({ url: dataUrl, filename: "webtoon_frames.zip" });
                      setConsoleLogs(prev => [`[GUI] Successfully generated zip for ${toDownload.length} images`, ...prev]);
                      addNotification(`Finished zipping ${toDownload.length} image(s).`, "success");
                    } catch (err) {
                      console.error("Zip generation failed:", err);
                      addNotification("Failed to generate zip file", "error");
                    } finally {
                      setIsZipping(false);
                    }
                  }}
                  disabled={scrapedImages.length === 0 || isZipping}
                  className="flex-1 bg-neutral-900/50 hover:bg-neutral-800 border-r border-neutral-800/60 text-neutral-300 hover:text-white px-3 py-2 flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isZipping ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="text-[11px] uppercase tracking-wider font-semibold font-sans">
                    {isZipping ? "Downloading..." : "Download"}
                  </span>
                </button>

                {downloadReady && (
                  <a
                    href={downloadReady.url}
                    download={downloadReady.filename}
                    onClick={() => setTimeout(() => setDownloadReady(null), 3000)}
                    className="bg-emerald-600 hover:bg-emerald-500 border-r border-neutral-800/60 text-white px-3 py-2 flex items-center gap-2 transition-colors animate-pulse"
                    title="Click here to save the generated ZIP locally"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-wider font-bold font-sans">Ready!</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    if (selectedScraped.length === 0) return;
                    setScrapedImages(prev => prev.filter(img => !selectedScraped.includes(img)));
                    setConsoleLogs(prev => [`[GUI] Removed ${selectedScraped.length} images`, ...prev]);
                    setSelectedScraped([]);
                  }}
                  className="bg-red-950/20 hover:bg-red-900/60 text-red-400 hover:text-red-300 px-3 py-2 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={selectedScraped.length === 0}
                  title="Delete Selected"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="text-[11px] uppercase tracking-wider font-semibold font-sans">Delete</span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (selectedScraped.length === 0) return;
                  addPanelsWithAutoAnalysis(selectedScraped);
                  setSelectedScraped([]);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 flex items-center justify-center gap-2 rounded-lg shadow-md transition-all cursor-pointer font-sans disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-95"
                disabled={selectedScraped.length === 0}
              >
                <Plus className="h-4 w-4" />
                <span className="text-[11px] uppercase tracking-wider font-bold">Add to Canvas</span>
              </button>
            </div>
          </div>

          {showAutoCropSettings && (
            <div id="smart_crop_options_box" className="bg-neutral-950/80 p-5 rounded-2xl border border-purple-900/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn shadow-2xl">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider font-mono flex justify-between">
                  <span>Sensitivity</span>
                  <span className="text-white font-bold">{cropSensitivity}%</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="90"
                  value={cropSensitivity}
                  onChange={(e) => setCropSensitivity(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-neutral-800 rounded-lg h-1.5 px-0 cursor-pointer hover:accent-purple-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider font-mono flex justify-between">
                  <span>Margin Padding</span>
                  <span className="text-white font-bold">{cropPaddingPx}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={cropPaddingPx}
                  onChange={(e) => setCropPaddingPx(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-neutral-800 rounded-lg h-1.5 px-0 cursor-pointer hover:accent-purple-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider font-mono block">
                  Color Filter
                </label>
                <select
                  value={cropBackgroundMode}
                  onChange={(e) => setCropBackgroundMode(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-purple-600 focus:outline-none hover:border-neutral-500 transition-colors cursor-pointer"
                >
                  <option value="auto">Auto-Detect BG</option>
                  <option value="white">Force White</option>
                  <option value="black">Force Black</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider font-mono block">
                  Processing Strategy
                </label>
                <select
                  className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-purple-600 focus:outline-none hover:border-neutral-500 transition-colors cursor-pointer"
                >
                  <option value="balanced">Balanced Quality</option>
                  <option value="precise">High Precision</option>
                  <option value="fast">High Speed</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-4 border-t border-neutral-800 pt-4 flex gap-4 flex-wrap">
                <label className="relative flex items-center gap-3 bg-neutral-900/60 border border-neutral-700 rounded-xl px-4 py-3 cursor-pointer hover:bg-neutral-800 transition-all select-none flex-1">
                  <input
                    type="checkbox"
                    checked={autoSplitTallStrips}
                    onChange={(e) => setAutoSplitTallStrips(e.target.checked)}
                    className="accent-purple-500 h-4 w-4 rounded"
                  />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-white">Auto-Split Strips</span>
                    <span className="text-[10px] text-neutral-400">Automatically slice long strips into panels.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-4 overflow-x-auto pb-4 pt-1.5 scrollbar-thin">
            {scrapedImages.map((imgUrl, idx) => {
              const isSelected = selectedScraped.includes(imgUrl);
              return (
                <div 
                  key={`${imgUrl}-${idx}`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedScraped(prev => prev.filter(img => img !== imgUrl));
                    } else {
                      setSelectedScraped(prev => [...prev, imgUrl]);
                    }
                  }}
                  className={`group relative w-[140px] shrink-0 rounded-xl border p-2 space-y-2 transition-all text-center cursor-pointer select-none ${
                    isSelected 
                      ? "border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-900/40" 
                      : "border-neutral-800 bg-neutral-950 hover:border-purple-500/80"
                  }`}
                >
                  {/* Image preview frame */}
                  <div className="relative h-28 rounded-lg overflow-hidden bg-neutral-900 flex items-center justify-center">
                    <img 
                      src={imgUrl} 
                      alt=""
                      className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ${croppingImgUrl === imgUrl ? 'opacity-30 blur-[4px]' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                    
                    {croppingImgUrl === imgUrl && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/85 backdrop-blur-xs animate-fadeIn p-2 text-center select-none" id={`loading_overlay_${idx}`}>
                        <RefreshCw className="h-6 w-6 text-purple-400 animate-spin drop-shadow-md mb-2" />
                        <span className="text-[9px] font-mono font-bold tracking-wider text-purple-300 uppercase animate-pulse">
                          {isBatchCropping ? "Auto-Cropping" : "Processing"}
                        </span>
                        <span className="text-[8px] font-sans text-neutral-400 mt-1">
                          Processing panel...
                        </span>
                      </div>
                    )}
                    
                    {/* Card badge index */}
                    <div className="absolute top-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-purple-400">
                      #{idx + 1}
                    </div>

                    {/* Check Circle corner indicator overlay */}
                    <div className={`absolute top-1 right-1 rounded-full p-0.5 border transition-all ${
                      isSelected 
                        ? "bg-purple-600 border-purple-400 text-white opacity-100" 
                        : "bg-black/60 border-neutral-700 text-transparent opacity-0 group-hover:opacity-100 hover:text-neutral-300"
                    }`}>
                      <Check className="h-2.5 w-2.5 font-bold text-white" />
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        addPanelsWithAutoAnalysis([imgUrl]);
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white text-[9px] py-1 rounded font-mono transition-colors font-medium border border-purple-500/30 cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <span>+ Insert to Storyboard</span>
                    </button>

                    {/* Individual stitch with next element option */}
                    {idx < scrapedImages.length - 1 && (
                      <button
                        onClick={() => handleStitchWithNext(idx)}
                        disabled={stitchingIndices.includes(idx)}
                        className="w-full bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-900/60 text-indigo-300 hover:text-indigo-100 text-[9px] py-1 rounded font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {stitchingIndices.includes(idx) ? (
                          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <span className="text-[10px] font-bold">🔗</span>
                        )}
                        <span>Stitch with #{idx + 2}</span>
                      </button>
                    )}
                    
                    <div className="flex gap-1 justify-between items-center bg-transparent w-full">
                      {/* Remove Background and Crop Scissors Button */}
                      <button
                        onClick={() => {
                          setEditingImageIdx(idx);
                          setEditCropTop(0);
                          setEditCropBottom(0);
                          setEditCropLeft(0);
                          setEditCropRight(0);
                          setEditAutoTrim(true);
                        }}
                        title="Crop & Trim White Background"
                        className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-purple-950 hover:text-purple-400 text-neutral-400 py-1 rounded border border-neutral-800 hover:border-purple-900/60 transition-colors cursor-pointer text-[10px] font-mono"
                      >
                        <Scissors className="h-3 w-3" />
                        <span>Edit</span>
                      </button>

                      {/* Remove individual extracted image */}
                      <button
                        onClick={() => {
                          setScrapedImages(prev => prev.filter((_, i) => i !== idx));
                          setSelectedScraped(prev => prev.filter(img => img !== imgUrl));
                          setConsoleLogs(prev => [
                            `[GUI] Deleted extracted frame #${idx + 1} from deck.`,
                            ...prev
                          ]);
                        }}
                        title="Remove element from deck"
                        className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-red-950 hover:text-red-400 text-neutral-500 py-1 rounded border border-neutral-800 hover:border-red-900/60 transition-colors cursor-pointer text-[10px] font-mono"
                      >
                        <Trash className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
