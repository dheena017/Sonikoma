import { useState, useRef, useCallback, useEffect } from "react";
import { GeneratedPanel } from "../types";
import { AI_MODELS } from "../models";
import { createFetchWithInterceptor } from "../api/fetchWithInterceptor";
import {
  setEngineVolume,
  startAmbientBackgroundMusic,
  stopAmbientBackgroundMusic,
  playComicSoundEffect,
} from "../audio";
import { parseWebtoonUrl } from "../utils";
import { Notification, NotificationType } from "../components/NotificationStack";
import { ErrorPopupDetail } from "../components/ErrorPopupModal";

export function useAppLogic() {
  const [panels, setPanels] = useState<GeneratedPanel[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  
  // Scraped images states from live URL separation
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [selectedScraped, setSelectedScraped] = useState<string[]>([]);

  // Tab View for Preview ("video" for MP4 player, "storyboard" for step-by-step)
  const [activePreviewTab, setActivePreviewTab] = useState<"video" | "storyboard">("video");

  // Image editing/cropping states
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
  const [editCropTop, setEditCropTop] = useState<number>(0);
  const [editCropBottom, setEditCropBottom] = useState<number>(0);
  const [editCropLeft, setEditCropLeft] = useState<number>(0);
  const [editCropRight, setEditCropRight] = useState<number>(0);
  const [editAutoTrim, setEditAutoTrim] = useState<boolean>(true);
  const [imageEditStates, setImageEditStates] = useState<Record<string, any>>({});

  // Bubble cleaner states
  const [showBubbleModal, setShowBubbleModal] = useState<boolean>(false);
  const [bubbleDetectionStyle, setBubbleDetectionStyle] = useState<"all" | "white_only" | "text_only">("all");
  const [bubbleEraseMethod, setBubbleEraseMethod] = useState<"auto" | "inpaint" | "blur" | "solid_white" | "solid_black">("auto");
  const [bubbleSensitivity, setBubbleSensitivity] = useState<number>(50);
  const [isCleaningBubbles, setIsCleaningBubbles] = useState<boolean>(false);
  const [cleanProgress, setCleanProgress] = useState<{ current: number; total: number } | null>(null);
  const [bubbleCroppingImgUrl, setBubbleCroppingImgUrl] = useState<string | null>(null);

  // Auto crop states
  const [showAutoCropModal, setShowAutoCropModal] = useState<boolean>(false);
  const [cropSensitivity, setCropSensitivity] = useState<number>(30);
  const [cropPaddingPx, setCropPaddingPx] = useState<number>(10);
  const [cropBackgroundMode, setCropBackgroundMode] = useState<string>("auto");
  const [autoSplitTallStrips, setAutoSplitTallStrips] = useState<boolean>(true);
  const [processingStrategy, setProcessingStrategy] = useState<string>("balanced");
  const [aspectRatioLock, setAspectRatioLock] = useState<string>("free");
  const [minPanelAreaPct, setMinPanelAreaPct] = useState<number>(2);
  const [overlapMergeThreshold, setOverlapMergeThreshold] = useState<number>(20);
  const [useLocalCV, setUseLocalCV] = useState<boolean>(false);
  const [isBatchCropping, setIsBatchCropping] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [croppingImgUrl, setCroppingImgUrl] = useState<string | null>(null);

  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // --- Notifications State ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [errorPopup, setErrorPopup] = useState<ErrorPopupDetail | null>(null);

  const addNotification = useCallback((
    message: string,
    type: NotificationType,
    options?: { errorCode?: number; retryDelay?: number; onRetry?: () => void }
  ) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type, ...options }]);

    // Only auto-dismiss if a countdown/retry action is NOT active
    if (!options?.onRetry) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const fetchWithInterceptor = useCallback(
    createFetchWithInterceptor({ addNotification, setErrorPopup }),
    [addNotification, setErrorPopup]
  );

  // --- Settings State ---
  const [targetUrl, setTargetUrl] = useState<string>(() => localStorage.getItem('ai_comic_url') || "");
  const [voiceActor, setVoiceActor] = useState<string>(() => localStorage.getItem('ai_comic_voice') || "Standard Comic Narrator (Male)");
  const [musicTheme, setMusicTheme] = useState<string>(() => localStorage.getItem('ai_comic_music') || "Orchestral Battle Theme");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">(() => (localStorage.getItem('ai_comic_aspectRatio') as "9:16" | "16:9") || "9:16");
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('ai_comic_model') || AI_MODELS[0].id);
  const [frameRate, setFrameRate] = useState<number>(() => parseInt(localStorage.getItem('ai_comic_fps') || '24'));
  const [volume, setVolume] = useState<number>(() => parseInt(localStorage.getItem('ai_comic_volume') || '80'));
  const [isMuted, setIsMuted] = useState<boolean>(() => localStorage.getItem('ai_comic_muted') === 'true');

  useEffect(() => {
    localStorage.setItem('ai_comic_url', targetUrl);
    localStorage.setItem('ai_comic_voice', voiceActor);
    localStorage.setItem('ai_comic_music', musicTheme);
    localStorage.setItem('ai_comic_aspectRatio', aspectRatio);
    localStorage.setItem('ai_comic_model', selectedModel);
    localStorage.setItem('ai_comic_fps', frameRate.toString());
    localStorage.setItem('ai_comic_volume', volume.toString());
    localStorage.setItem('ai_comic_muted', isMuted.toString());
  }, [targetUrl, voiceActor, musicTheme, aspectRatio, selectedModel, frameRate, volume, isMuted]);

  // --- Playback States ---
  const [currentPanelIndex, setCurrentPanelIndex] = useState<number>(0);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [storyboardPlaying, setStoryboardPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<any>(null);

  // --- System Logs Engine ---
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;
    let isPolling = false;
    const lastLogIdRef = { current: 0 };

    const startPolling = () => {
      if (isPolling) return;
      isPolling = true;

      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/system-logs?since=${lastLogIdRef.current}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.logs)) {
            const newLogs = data.logs.filter((log: any) => log.id > lastLogIdRef.current);
            if (newLogs.length > 0) {
              newLogs.forEach((log: any) => {
                if (log.id > lastLogIdRef.current) {
                  lastLogIdRef.current = log.id;
                }
              });
              setConsoleLogs(prev => [
                ...prev,
                ...newLogs.map((log: any) => log.message)
              ]);
            }
          }
        } catch (err) {
          // Silent catch to prevent console flooding during network restarts
        }
      }, 1500);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      isPolling = false;
    };

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/system-logs/stream');

        eventSource.onmessage = (event) => {
          try {
            const entry = JSON.parse(event.data);
            if (entry && entry.id > lastLogIdRef.current) {
              lastLogIdRef.current = entry.id;
              setConsoleLogs(prev => [...prev, entry.message]);
            }
          } catch (e) {
            // silent catch on malformed stream messages
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          startPolling();
        };
      } catch (err) {
        startPolling();
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      stopPolling();
    };
  }, []);

  const speakDialogue = useCallback((text: string) => {
    if (!window.speechSynthesis || isMuted) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    let selectedVoice = null;
    if (voiceActor.toLowerCase().includes("sultry") || voiceActor.toLowerCase().includes("female")) {
      selectedVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha"));
    } else {
      selectedVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("premium"));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.volume = volume / 100;
    utterance.rate = 0.95;
    
    window.speechSynthesis.speak(utterance);
  }, [isMuted, voiceActor, volume]);

  const playStoryboardAudio = useCallback((panelIdx: number) => {
    const activePanel = panels[panelIdx];
    if (!activePanel) return;

    speakDialogue(activePanel.speech_text);

    if (activePanel.sfx && !isMuted) {
      playComicSoundEffect(activePanel.sfx);
    }
  }, [panels, speakDialogue, isMuted]);

  useEffect(() => {
    setEngineVolume(volume, isMuted);
  }, [volume, isMuted]);

  useEffect(() => {
    if (storyboardPlaying) {
      startAmbientBackgroundMusic(musicTheme, volume, isMuted);
    } else {
      stopAmbientBackgroundMusic();
    }
    return () => {
      stopAmbientBackgroundMusic();
    };
  }, [storyboardPlaying, musicTheme, volume, isMuted]);

  useEffect(() => {
    if (storyboardPlaying && panels.length > 0) {
      const activePanel = panels[currentPanelIndex];
      const stepMs = 100;

      playTimerRef.current = setTimeout(() => {
        setPlaybackTime(prev => {
          const nextTime = parseFloat((prev + 0.1).toFixed(1));
          if (nextTime >= activePanel.duration) {
            if (currentPanelIndex < panels.length - 1) {
              const nextIdx = currentPanelIndex + 1;
              setCurrentPanelIndex(nextIdx);
              playStoryboardAudio(nextIdx);
              return 0;
            } else {
              setStoryboardPlaying(false);
              return 0;
            }
          }
          return nextTime;
        });
      }, stepMs);
    } else {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [storyboardPlaying, currentPanelIndex, panels, playStoryboardAudio]);

  const toggleStoryboardPlayback = () => {
    if (panels.length === 0) return;
    if (storyboardPlaying) {
      setStoryboardPlaying(false);
      if (window.speechSynthesis) window.speechSynthesis.pause();
    } else {
      setStoryboardPlaying(true);
      playStoryboardAudio(currentPanelIndex);
    }
  };

  const resetStoryboardPlayback = () => {
    setStoryboardPlaying(false);
    setCurrentPanelIndex(0);
    setPlaybackTime(0);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopAmbientBackgroundMusic();
  };

  // --- Video Pipeline & Action Handlers ---
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [mergingIndices, setMergingIndices] = useState<number[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [reprocessingPanelId, setReprocessingPanelId] = useState<number | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

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
  }, [targetUrl, selectedModel, fetchWithInterceptor, addNotification]);

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

  const handleSaveEditedImage = async () => {
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

  const handleSaveMultipleCuts = async (cuts: Array<{ cropTop: number; cropBottom: number; cropLeft: number; cropRight: number; autoTrim: boolean }>) => {
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

  const runBackgroundAnalysis = useCallback(async (panelId: number, imageUrl: string) => {
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
  }, [fetchWithInterceptor, addNotification]);

  const addPanelsWithAutoAnalysis = useCallback((imgUrls: string[], currentScrapedList?: string[], shouldScroll: boolean = true) => {
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
  }, [scrapedImages, runBackgroundAnalysis, addNotification]);

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

  const totalCalculatedDuration = panels.reduce((sum, p) => sum + p.duration, 0);

  return {
    panels,
    setPanels,
    consoleLogs,
    setConsoleLogs,
    scrapedImages,
    setScrapedImages,
    selectedScraped,
    setSelectedScraped,
    activePreviewTab,
    setActivePreviewTab,
    editingImageIdx,
    setEditingImageIdx,
    editCropTop,
    setEditCropTop,
    editCropBottom,
    setEditCropBottom,
    editCropLeft,
    setEditCropLeft,
    editCropRight,
    setEditCropRight,
    editAutoTrim,
    setEditAutoTrim,
    imageEditStates,
    setImageEditStates,
    showBubbleModal,
    setShowBubbleModal,
    bubbleDetectionStyle,
    setBubbleDetectionStyle,
    bubbleEraseMethod,
    setBubbleEraseMethod,
    bubbleSensitivity,
    setBubbleSensitivity,
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,
    showAutoCropModal,
    setShowAutoCropModal,
    cropSensitivity,
    setCropSensitivity,
    cropPaddingPx,
    setCropPaddingPx,
    cropBackgroundMode,
    setCropBackgroundMode,
    autoSplitTallStrips,
    setAutoSplitTallStrips,
    processingStrategy,
    setProcessingStrategy,
    aspectRatioLock,
    setAspectRatioLock,
    minPanelAreaPct,
    setMinPanelAreaPct,
    overlapMergeThreshold,
    setOverlapMergeThreshold,
    useLocalCV,
    setUseLocalCV,
    isBatchCropping,
    batchProgress,
    croppingImgUrl,
    videoPlayerRef,
    notifications,
    errorPopup,
    setErrorPopup,
    addNotification,
    removeNotification,
    fetchWithInterceptor,
    targetUrl,
    setTargetUrl,
    voiceActor,
    setVoiceActor,
    musicTheme,
    setMusicTheme,
    aspectRatio,
    setAspectRatio,
    selectedModel,
    setSelectedModel,
    frameRate,
    setFrameRate,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    currentPanelIndex,
    setCurrentPanelIndex,
    playbackTime,
    setPlaybackTime,
    storyboardPlaying,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
    isProcessing,
    progressStatus,
    isScraping,
    mergingIndices,
    videoUrl,
    setVideoUrl,
    reprocessingPanelId,
    isSavingEdit,
    handleGenerateVideo,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    handleStitchWithNext,
    handleTriggerReprocess,
    addPanelsWithAutoAnalysis,
    handleCleanBubblesSelected,
    handleAutoCropSelected,
    totalCalculatedDuration,
  };
}
