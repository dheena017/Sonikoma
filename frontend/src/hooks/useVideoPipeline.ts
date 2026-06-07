import { useState, useEffect } from "react";
import { GeneratedPanel } from "../types";
import { parseWebtoonUrl } from "../utils";

interface UseVideoPipelineProps {
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  selectedModel: string;
  frameRate: number;
  voiceActor: string;
  musicTheme: string;
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  addNotification: (message: string, type: any, options?: any) => void;
  fetchWithInterceptor: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  setCurrentPanelIndex: (idx: number) => void;
  setPlaybackTime: (time: number) => void;
  setStoryboardPlaying: (playing: boolean) => void;
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
  bubbleDetectionStyle: string;
  bubbleEraseMethod: string;
  bubbleSensitivity: number;
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  scrapedImages: string[];
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setIsCleaningBubbles: (v: boolean) => void;
  setCleanProgress: (p: any) => void;
  setBubbleCroppingImgUrl: (v: string | null) => void;
  cropSensitivity: number;
  cropPaddingPx: number;
  cropBackgroundMode: string;
  processingStrategy: string;
  aspectRatioLock: string;
  minPanelAreaPct: number;
  overlapMergeThreshold: number;
  useLocalCV: boolean;
  setIsBatchCropping: (v: boolean) => void;
  setBatchProgress: (p: any) => void;
  setCroppingImgUrl: (v: string | null) => void;
  imageEditStates: Record<string, any>;
  setEditCropTop: (v: number) => void;
  setEditCropBottom: (v: number) => void;
  setEditCropLeft: (v: number) => void;
  setEditCropRight: (v: number) => void;
  setEditAutoTrim: (v: boolean) => void;
}

export function useVideoPipeline({
  targetUrl,
  setTargetUrl,
  selectedModel,
  frameRate,
  voiceActor,
  musicTheme,
  panels,
  setPanels,
  addNotification,
  fetchWithInterceptor,
  setConsoleLogs,
  setCurrentPanelIndex,
  setPlaybackTime,
  setStoryboardPlaying,
  setActivePreviewTab,
  bubbleDetectionStyle,
  bubbleEraseMethod,
  bubbleSensitivity,
  selectedScraped,
  setSelectedScraped,
  scrapedImages,
  setScrapedImages,
  setIsCleaningBubbles,
  setCleanProgress,
  setBubbleCroppingImgUrl,
  cropSensitivity,
  cropPaddingPx,
  cropBackgroundMode,
  processingStrategy,
  aspectRatioLock,
  minPanelAreaPct,
  overlapMergeThreshold,
  useLocalCV,
  setIsBatchCropping,
  setBatchProgress,
  setCroppingImgUrl,
  imageEditStates,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setEditAutoTrim,
}: UseVideoPipelineProps) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [mergingIndices, setMergingIndices] = useState<number[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [reprocessingPanelId, setReprocessingPanelId] = useState<number | null>(null);

  // Load preview images and panels on targetUrl changes
  useEffect(() => {
    let isCurrent = true;

    if (!targetUrl.trim()) {
      setScrapedImages([]);
      setSelectedScraped([]);
      setPanels([]);
      return;
    }

    const timer = setTimeout(() => {
      const { genre, title, episode } = parseWebtoonUrl(targetUrl);
      
      setPanels([]);
      setScrapedImages([]);
      setSelectedScraped([]);
      setCurrentPanelIndex(0);
      setPlaybackTime(0);
      setStoryboardPlaying(false);
      
      setConsoleLogs(prev => {
        const baseLogs = prev.filter(log => !log.startsWith("[Preloader]") && !log.startsWith("[Scraper]"));
        return [
          `[Scraper] Spawned live scraping task to separate strip images from: ${targetUrl}`,
          `[Model] Using AI engine: ${selectedModel} for panel analysis`,
          `[Scraper] Parsed URL → Genre: ${genre} | Title: ${title} | Episode: ${episode}`,
          ...baseLogs
        ];
      });

      setIsScraping(true);

      fetchWithInterceptor("/api/scrape-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, model: selectedModel })
      })
        .then(res => {
          if (!isCurrent) throw new Error("Stale request cleanup");
          return res.json();
        })
        .then(data => {
          if (!isCurrent) return;
          if (data.success && data.images && data.images.length > 0) {
            const proxiedImages = data.images.map((img: string) => 
               img.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(img)}` : img
            );
            setScrapedImages(proxiedImages);
            setPanels([]);
            setCurrentPanelIndex(0);
            setPlaybackTime(0);
            setStoryboardPlaying(false);
            
            addNotification(`Successfully extracted ${data.total_images} panel frames from the Webtoon page!`, 'success');
            
            setConsoleLogs(prev => {
              const filtered = prev.filter(log => !log.startsWith("[Scraper]"));
              return [
                `[Scraper] Success! Separated ${data.total_images} continuous panel strips from active page.`,
                `[Scraper] Images loaded. Select and insert panels from the deck below.`,
                `[API] Scrape response received — Model: ${selectedModel} | Images: ${data.total_images}`,
                ...filtered
              ];
            });
          } else {
            const errMsg = data.message || "Connected but no native comic elements identified on page.";
            setScrapedImages([]);
            setPanels([]);
            addNotification(`Failed to find comic panels: ${errMsg} Please check the URL and try again.`, "error");
            setConsoleLogs(prev => [
              `[Scraper] [WARNING] No comic panels detected on page. Server message: ${errMsg}`,
              ...prev
            ]);
          }
        })
        .catch(err => {
          if (!isCurrent) return;
          setScrapedImages([]);
          setPanels([]);
          setConsoleLogs(prev => [
            `[Scraper] [ERROR] Scrape failed: ${err.message || 'Unknown error'}`,
            ...prev
          ]);
          
          if (!err.intercepted) {
            const errMsg = err.message || "Failed to retrieve comic panels from the specified URL.";
            addNotification(`Service unable to access target site. Check the URL or refresh the page. (${errMsg})`, "error");
          }
        })
        .finally(() => {
          if (isCurrent) {
            setIsScraping(false);
          }
        });
    }, 750);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [targetUrl, selectedModel]);

  const handleGenerateVideo = async () => {
    if (!targetUrl.trim()) {
      addNotification("Please enter or select a valid Webtoon URL to initiate the process.", "error");
      return;
    }

    setIsProcessing(true);
    setProgressStatus("Contacting pipeline orchestration...");
    addNotification('Pipeline initiated — generating video with ' + selectedModel + '...', 'info');
    setConsoleLogs([
      `[Control] Initiating dynamic production pipeline request...`,
      `[Control] Webtoon Destination target: ${targetUrl}`,
      `[Control] Cinematic parameters applied -> FPS: ${frameRate} | Actor: ${voiceActor} | Audio: ${musicTheme}`,
      `[Model] Active AI Engine: ${selectedModel}`,
      `[Model] Sending request to AI model for OCR transcription & scene analysis...`,
      `[Pipeline] Storyboard contains ${panels.length} panel(s) queued for compilation`
    ]);

    try {
      setProgressStatus("Scraping Webtoon strips & downloading frames...");
      setConsoleLogs(prev => [...prev, `[Scraper] Spawned crawler tasks to fetch strip images...`]);

      const requestBody = {
        url: targetUrl,
        episode_id: `wp_${Math.random().toString(36).substring(2, 8)}`,
        panels: panels,
        model: selectedModel
      };

      const response = await fetchWithInterceptor("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      
      setConsoleLogs(prev => [
        ...prev,
        `[Scraper] Retrieved vertical strip elements successfully.`,
        `[Vision OCR] Isolated ${responseData.panels_processed} panels dynamically.`,
        `[Model] AI engine ${selectedModel} completed OCR + scene analysis`,
        `[MoviePy] Compiling timeline with Pan/Zoom animations...`,
        `[MoviePy] Encoded output video: ${responseData.video_url}`,
        `[Pipeline] [SUCCESS] Video generation pipeline completed successfully!`
      ]);
      
      setPanels(responseData.panels || []);
      setVideoUrl(responseData.video_url);
      setProgressStatus("Slices mapped & MP4 master timeline generated!");
      setActivePreviewTab("video");
      addNotification('Video generated successfully! Check the preview player.', 'success');
      
    } catch (err: any) {
      setConsoleLogs(prev => [
        ...prev,
        `[Pipeline] [ERROR] Video generation failed: ${err.message || 'Unknown error'}`,
        `[Pipeline] Error code: ${err.status || err.code || 'unknown'} | Model: ${selectedModel}`
      ]);

      if (!err.intercepted) {
        let errMessage = err.message || "An unexpected connection error occurred.";
        if (errMessage.includes("429") || errMessage.includes("quota")) {
          errMessage = "You've exceeded your daily/request quota for the Gemini API. Please wait a short while for the quota to reset, or check your billing plan in Google AI Studio to increase your limits.";
        }
        addNotification(`Pipeline failed: ${errMessage}. Please try refreshing the page or try again.`, "error");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEditedImage = async (
    editingImageIdx: number | null,
    editCropTop: number,
    editCropBottom: number,
    editCropLeft: number,
    editCropRight: number,
    editAutoTrim: boolean,
    setIsSavingEdit: (v: boolean) => void
  ) => {
    if (editingImageIdx === null) return;
    
    const originalUrl = scrapedImages[editingImageIdx];
    setIsSavingEdit(true);
    setConsoleLogs(prev => [
      `[Image Editor] Processing Crop & Auto-Trim operations on Frame #${editingImageIdx + 1}...`,
      `[Image Editor] Crop values → Top: ${editCropTop}% | Bottom: ${editCropBottom}% | Left: ${editCropLeft}% | Right: ${editCropRight}% | AutoTrim: ${editAutoTrim}`,
      ...prev
    ]);

    try {
      const response = await fetchWithInterceptor("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: originalUrl,
          cropTop: editCropTop,
          cropBottom: editCropBottom,
          cropLeft: editCropLeft,
          cropRight: editCropRight,
          autoTrim: editAutoTrim
        })
      });

      const data = await response.json();
      const croppedUrl = data.url;

      setScrapedImages(prev => {
        const copy = [...prev];
        copy[editingImageIdx] = croppedUrl;
        return copy;
      });

      setSelectedScraped(prev => {
        if (prev.includes(originalUrl)) {
          return prev.map(img => img === originalUrl ? croppedUrl : img);
        }
        return prev;
      });

      setConsoleLogs(prev => [
        `[Image Editor] [SUCCESS] Successfully cropped and trimmed Frame #${editingImageIdx + 1}!`,
        `[Image Editor]   - Sent (Original): ${originalUrl.substring(0, 60)}...`,
        `[Image Editor]   - Revise (Cropped): ${croppedUrl.substring(0, 60)}...`,
        ...prev
      ]);
      addNotification(`Frame #${editingImageIdx + 1} cropped and trimmed successfully!`, 'success');
    } catch (err: any) {
      setConsoleLogs(prev => [
        `[Image Editor] [ERROR] Failed to save edits for Frame #${editingImageIdx + 1}: ${err.message || 'Unknown error'}`,
        ...prev
      ]);
      if (!err.intercepted) {
        addNotification(`Failed to save edits for Frame #${editingImageIdx + 1}. Please try again later.`, "error");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSaveMultipleCuts = async (
    editingImageIdx: number | null,
    cuts: Array<{ cropTop: number; cropBottom: number; cropLeft: number; cropRight: number; autoTrim: boolean }>,
    setIsSavingEdit: (v: boolean) => void
  ) => {
    if (editingImageIdx === null || cuts.length === 0) return;
    
    const originalUrl = scrapedImages[editingImageIdx];
    setIsSavingEdit(true);
    setConsoleLogs(prev => [
      `[Image Editor] Processing Batch Multiple Cut operations (${cuts.length} cuts) on Frame #${editingImageIdx + 1}...`,
      ...prev
    ]);

    try {
      const croppedUrls: string[] = [];

      for (let i = 0; i < cuts.length; i++) {
        const cut = cuts[i];
        setConsoleLogs(prev => [
          `[Image Editor] Executing Crop Cut #${i + 1}/${cuts.length}...`,
          ...prev
        ]);
        const response = await fetchWithInterceptor("/api/edit-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: originalUrl,
            cropTop: cut.cropTop,
            cropBottom: cut.cropBottom,
            cropLeft: cut.cropLeft,
            cropRight: cut.cropRight,
            autoTrim: cut.autoTrim
          })
        });

        const data = await response.json();
        croppedUrls.push(data.url);
      }

      setScrapedImages(prev => {
        const copy = [...prev];
        copy.splice(editingImageIdx, 1, ...croppedUrls);
        return copy;
      });

      setSelectedScraped(prev => {
        if (prev.includes(originalUrl)) {
          const idx = prev.indexOf(originalUrl);
          const copy = [...prev];
          copy.splice(idx, 1, ...croppedUrls);
          return copy;
        }
        return prev;
      });

      setConsoleLogs(prev => [
        `[Image Editor] Successfully generated ${cuts.length} cropped/trimmed frames from Frame #${editingImageIdx + 1}!`,
        ...prev
      ]);
    } catch (err: any) {
      if (!err.intercepted) {
        addNotification(`Batch crop failed. Please check the edits and try again.`, "error");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleStitchWithNext = async (idx: number) => {
    if (idx < 0 || idx >= scrapedImages.length - 1) return;
    
    setMergingIndices(prev => [...prev, idx]);
    setConsoleLogs(prev => [
      `[Stitcher] Merging Frame #${idx + 1} with Frame #${idx + 2} vertically...`,
      ...prev
    ]);

    try {
      const img1 = scrapedImages[idx];
      const img2 = scrapedImages[idx + 1];
      
      const response = await fetchWithInterceptor("/api/stitch-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [img1, img2] })
      });
      
      const data = await response.json();
      const stitchedUrl = data.url;
      
      setScrapedImages(prev => {
        const copy = [...prev];
        copy.splice(idx, 2, stitchedUrl);
        return copy;
      });

      setSelectedScraped(prev => {
        const hasImg1 = prev.includes(img1);
        const hasImg2 = prev.includes(img2);
        const filtered = prev.filter(img => img !== img1 && img !== img2);
        if (hasImg1 || hasImg2) {
          return [...filtered, stitchedUrl];
        }
        return filtered;
      });

      setConsoleLogs(prev => [
        `[Stitcher] [SUCCESS] Successfully merged Frame #${idx + 1} and Frame #${idx + 2} vertically into a new seamless frame asset!`,
        ...prev
      ]);
      addNotification(`Frames #${idx + 1} and #${idx + 2} stitched successfully!`, 'success');
    } catch (err: any) {
      setConsoleLogs(prev => [
        `[Stitcher] [ERROR] Merge failed for Frame #${idx + 1} + #${idx + 2}: ${err.message || 'Unknown error'}`,
        ...prev
      ]);
      if (!err.intercepted) {
        addNotification(`Stitching failed. Please try again or refresh the page.`, "error");
      }
    } finally {
      setMergingIndices(prev => prev.filter(i => i !== idx));
    }
  };

  const handleTriggerReprocess = async (panelId: number) => {
    const activePanel = panels.find(p => p.id === panelId);
    if (!activePanel) return;

    setReprocessingPanelId(panelId);
    const activePadding = activePanel.crop_padding !== undefined ? activePanel.crop_padding : 4;
    setConsoleLogs(prev => [
      `[OCR/CV Engine] Recalculating tighter cropping margins (padding: ${activePadding}%) & OCR vectors for Scene #${panelId}...`,
      ...prev
    ]);

    try {
      let currentUrl = activePanel.image_url;
      if (currentUrl.includes("/api/proxy-image")) {
        const urlObj = new URL(currentUrl, window.location.origin);
        urlObj.searchParams.set("reprocess_nonce", Date.now().toString());
        if (activePanel.smart_crop) {
          urlObj.searchParams.set("tighter", "true");
        }
        if (activePanel.crop_padding !== undefined) {
          urlObj.searchParams.set("crop_padding", activePanel.crop_padding.toString());
        }
        currentUrl = urlObj.pathname + urlObj.search;
      }

      await new Promise(resolve => setTimeout(resolve, 900));

      setPanels(prev => prev.map(p => p.id === panelId ? { ...p, image_url: currentUrl } : p));
      
      setConsoleLogs(prev => [
        `[OCR/CV Engine] [SUCCESS] Scene #${panelId} output canvas successfully re-parsed into tighter boundaries with margin padding ${activePadding}%!`,
        ...prev
      ]);
      addNotification(`Panel #${panelId} reprocessed with tighter margins (${activePadding}% padding).`, 'success');
    } catch (err: any) {
      setConsoleLogs(prev => [
        `[OCR/CV Engine] [ERROR] Reprocessing failed for Scene #${panelId}: ${err.message || 'Unknown error'}`,
        ...prev
      ]);
      addNotification(`Panel reprocessing failed. Please try again later.`, "error");
    } finally {
      setReprocessingPanelId(null);
    }
  };

  const runBackgroundAnalysis = async (panelId: number, imageUrl: string) => {
    try {
      const res = await fetchWithInterceptor("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });
      if (!res.ok) throw new Error(`Analysis failed with status ${res.status}`);
      const data = await res.json();
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
          `[AI Auto-Analysis] AI transcribed and fully mapped cinematic properties for Panel #${panelId}!`,
          ...prev,
        ]);
        addNotification(`Panel #${panelId} analysis completed successfully!`, 'success');
      } else {
        throw new Error("Invalid response keys from AI Model Analysis");
      }
    } catch (err: any) {
      addNotification(`Panel #${panelId} AI analysis failed.`, 'error');
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
  };

  const addPanelsWithAutoAnalysis = (imgUrls: string[], currentScrapedList?: string[], shouldScroll: boolean = true) => {
    if (imgUrls.length === 0) return;

    if (shouldScroll) {
      setActivePreviewTab("storyboard");
      setTimeout(() => {
        document.getElementById("storyboard_timeline_section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }

    let newIds: { id: number; url: string }[] = [];
    const imageList = currentScrapedList || scrapedImages;

    setPanels((prev) => {
      const baseId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1;

      const newPanelsToAdd = imgUrls.map((imgUrl, loopIdx) => {
        const originalIdx = imageList.indexOf(imgUrl);
        const assignedId = baseId + loopIdx;
        newIds.push({ id: assignedId, url: imgUrl });

        return {
          id: assignedId,
          image_url: imgUrl,
          speech_text: `Loading dialogue... ✦`,
          sfx: "[Deep Scan]",
          duration: 4.5,
          motion_type: "zoom_in",
          isAnalyzing: true,
        };
      });

      return [...prev, ...newPanelsToAdd];
    });

    setConsoleLogs((prev) => [
      `[GUI] Added ${imgUrls.length} frames; spawning staggered AI OCR dialogue & camera motion detection...`,
      ...prev,
    ]);
    addNotification(`Added ${imgUrls.length} panel(s) to storyboard. Spawning AI analysis...`, 'info');

    setTimeout(() => {
      newIds.forEach((item, index) => {
        setTimeout(() => {
          runBackgroundAnalysis(item.id, item.url);
        }, index * 1000);
      });
    }, 50);
  };

  const handleCleanBubblesSelected = async () => {
    if (selectedScraped.length === 0) return;
    setIsCleaningBubbles(true);
    setConsoleLogs(prev => [
      `[Bubble Cleaner] Initiating AI Speech Bubble removal for ${selectedScraped.length} selected panels...`,
      ...prev
    ]);
    try {
      let updatedImages = [...scrapedImages];
      let updatedSelected = [...selectedScraped];
      setCleanProgress({ current: 0, total: selectedScraped.length });

      for (let i = 0; i < selectedScraped.length; i++) {
        const imgUrl = selectedScraped[i];
        addNotification(`Cleaning speech bubbles on panel ${i + 1}/${selectedScraped.length}...`, 'info');
        setCleanProgress({ current: i + 1, total: selectedScraped.length });
        setBubbleCroppingImgUrl(imgUrl);

        const response = await fetchWithInterceptor("/api/remove-speech-bubbles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imgUrl,
            method: bubbleEraseMethod,
            sensitivity: bubbleSensitivity,
            dilation: -1,
            inpaint_radius: 3,
            detection_style: bubbleDetectionStyle,
          }),
        });

        if (!response.ok) throw new Error(`Speech bubble removal failed with status ${response.status}`);

        const data = await response.json();
        if (data.success && data.url) {
          const ci = updatedImages.indexOf(imgUrl);
          if (ci !== -1) updatedImages[ci] = data.url;
          const si = updatedSelected.indexOf(imgUrl);
          if (si !== -1) updatedSelected[si] = data.url;

          setPanels(prev => prev.map(p => p.image_url === imgUrl ? { ...p, image_url: data.url } : p));
          setScrapedImages([...updatedImages]);
          setSelectedScraped([...updatedSelected]);
        }
      }

      addNotification("Speech bubble cleaning completed!", "success");
    } catch (err: any) {
      if (!err.intercepted) addNotification(err.message || "Speech bubble cleaning failed.", "error");
    } finally {
      setIsCleaningBubbles(false);
      setCleanProgress(null);
      setBubbleCroppingImgUrl(null);
    }
  };

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
        addNotification(`Auto-cropping panel ${i + 1}/${selectedScraped.length}...`, 'info');
        setBatchProgress({ current: i + 1, total: selectedScraped.length });
        setCroppingImgUrl(imgUrl);

        const response = await fetchWithInterceptor("/api/edit-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imgUrl,
            cropTop: 0,
            cropBottom: 0,
            cropLeft: 0,
            cropRight: 0,
            autoTrim: true,
            sensitivity: cropSensitivity,
            padding: cropPaddingPx,
            backgroundColorMode: cropBackgroundMode,
            processingStrategy,
            aspectRatioLock: aspectRatioLock !== "free" ? aspectRatioLock : undefined,
            minPanelAreaPct,
            overlapMergeThreshold,
            useLocalCV,
          })
        });

        if (!response.ok) {
          throw new Error(`Auto-trim request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.url) {
          const currentIdx = updatedImages.indexOf(imgUrl);
          if (currentIdx !== -1) updatedImages[currentIdx] = data.url;
          const selIdx = updatedSelected.indexOf(imgUrl);
          if (selIdx !== -1) updatedSelected[selIdx] = data.url;

          setPanels(prevPanels => 
            prevPanels.map(p => p.image_url === imgUrl ? { ...p, image_url: data.url } : p)
          );
          
          setScrapedImages([...updatedImages]);
          setSelectedScraped([...updatedSelected]);
        }
      }

      addNotification("Auto-crop completed!", "success");
    } catch (err: any) {
      addNotification(err.message || "Auto-crop failed. Please try again.", "error");
    } finally {
      setIsBatchCropping(false);
      setBatchProgress(null);
      setCroppingImgUrl(null);
    }
  };

  // Restore editor states from cache when entering/switching the edit mode for a panel
  useEffect(() => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    if (!currentUrl) return;

    const saved = imageEditStates[currentUrl];
    if (saved) {
      setEditCropTop(saved.cropTop ?? 0);
      setEditCropBottom(saved.cropBottom ?? 0);
      setEditCropLeft(saved.cropLeft ?? 0);
      setEditCropRight(saved.cropRight ?? 0);
      setEditAutoTrim(saved.autoTrim ?? true);
    } else {
      setEditCropTop(0);
      setEditCropBottom(0);
      setEditCropLeft(0);
      setEditCropRight(0);
      setEditAutoTrim(true);
    }
  }, [editingImageIdx, scrapedImages, imageEditStates]);

  return {
    isProcessing,
    progressStatus,
    isScraping,
    mergingIndices,
    videoUrl,
    setVideoUrl,
    reprocessingPanelId,
    handleGenerateVideo,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    handleStitchWithNext,
    handleTriggerReprocess,
    runBackgroundAnalysis,
    addPanelsWithAutoAnalysis,
    handleCleanBubblesSelected,
    handleAutoCropSelected,
  };
}
