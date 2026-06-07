import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Sparkles, 
  Cpu, 
  RefreshCw, 
  AlertCircle,
  Film,
  Download
} from "lucide-react";

import { 
  setEngineVolume, 
  startAmbientBackgroundMusic, 
  stopAmbientBackgroundMusic, 
  playComicSoundEffect 
} from "./audio";

import { GeneratedPanel } from "./types";
import { parseWebtoonUrl } from "./utils";
import { AI_MODELS } from "./models";
import { usePersistedState } from "./hooks/usePersistedState";
import { createFetchWithInterceptor } from "./api/fetchWithInterceptor";

// Child Components
import Header from "./components/Header";
import LiveScraperDeck from "./components/LiveScraperDeck";
import StoryboardTimeline from "./components/StoryboardTimeline";
import VideoMonitor from "./components/VideoMonitor";
import VolumeAndProgressPanel from "./components/VolumeAndProgressPanel";
import CropEditorModal from "./components/CropEditorModal";
import BubbleCleanerModal from "./components/BubbleCleanerModal";
import AutoCropModal from "./components/AutoCropModal";
import TerminalLogs from "./components/TerminalLogs";
import ModelStatusTable from "./components/ModelStatusTable";
import NotificationStack, { Notification, NotificationType } from "./components/NotificationStack";
import ErrorPopupModal, { ErrorPopupDetail } from "./components/ErrorPopupModal";
import UrlInputPanel from "./components/UrlInputPanel";
import PipelineStatusCard from "./components/PipelineStatusCard";
import FinalVideoPlayer from "./components/FinalVideoPlayer";
import OutputMetadataPanel from "./components/OutputMetadataPanel";

export default function App() {
  // Input parameters
  const [targetUrl, setTargetUrl] = useState<string>(() => localStorage.getItem('ai_comic_url') || "");
  const [errorPopup, setErrorPopup] = useState<ErrorPopupDetail | null>(null);
  // ... (add state for notifications)
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    message: string,
    type: NotificationType,
    options?: { errorCode?: number; retryDelay?: number; onRetry?: () => void }
  ) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type, ...options }]);
    
    // Only auto-dismiss if a countdown/retry action is NOT active
    if (!options?.onRetry) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Centralized response error interceptor mapping status codes (401, 429, 500) & HTML content-types
  const fetchWithInterceptor = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    return new Promise<Response>((resolve, reject) => {
      const executeFetch = async () => {
        try {
          const response = await fetch(input, init);
          const contentType = response.headers.get("content-type") || "";
          const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml+xml");

          if (isHtml) {
            addNotification("Service Unavailable: The app back-end returned an HTML routing fallback instead of JSON. Please check server configurations or retry.", "error");
            const err = new Error("Service Unavailable (backend returned HTML instead of a valid JSON response)");
            (err as any).intercepted = true;
            reject(err);
            return;
          }

          if (!response.ok) {
            let errMsg = `Server returned HTTP ${response.status}`;
            let handled = false;

            if (response.status === 401) {
              errMsg = "Action Unauthorized (401): You do not have valid authentication or server credentials.";
              addNotification(errMsg, "error");
              setErrorPopup({
                title: "Authentication Required (401)",
                message: errMsg,
                type: "error",
                technicalDetails: `HTTP 401 Unauthorized\nRequested API Path: ${input}`,
                suggestion: "This action is protected. Please check that any API keys, credentials, or secrets are correctly declared in your container environment."
              });
              handled = true;
            } else if (response.status === 429) {
              errMsg = "Quota Exhausted (429): You've exceeded your request rate limit or daily API quota. Retrying automatically...";
              
              let suggestedDelay = 10;
              const retryAfterHeader = response.headers.get("Retry-After");
              if (retryAfterHeader) {
                const parsed = parseInt(retryAfterHeader, 10);
                if (!isNaN(parsed) && parsed > 0) {
                  suggestedDelay = parsed;
                }
              }

              addNotification(errMsg, "error", {
                errorCode: 429,
                retryDelay: suggestedDelay,
                onRetry: () => {
                  executeFetch();
                }
              });

              setErrorPopup({
                title: "API Limit Enforced (429)",
                message: "Too many concurrent requests are active, or you've hit your daily Gemini API quota. The system will recover automatically.",
                type: "warning",
                technicalDetails: `HTTP 429 Too Many Requests\nEndpoint: ${input}\nSuggested Retry Delay: ${suggestedDelay}s`,
                suggestion: "Please wait for resets. For best stability, configure the processor model dropdown back to Gemini 3.5 Flash or Gemini 2.5 Flash, which have much larger free tiered bandwidths.",
                onRetry: () => {
                  executeFetch();
                }
              });
              handled = true;
              return; // Pause execution, retry will resume and call executeFetch again
            } else if (response.status === 500) {
              let backendError = "";
              if (contentType.includes("application/json")) {
                const errorData = await response.clone().json().catch(() => ({}));
                if (errorData.error) backendError = errorData.error;
                else if (errorData.message) backendError = errorData.message;
              }
              errMsg = backendError 
                ? `Pipeline Failure (500): ${backendError}`
                : "Pipeline Failure (500): The backend server failed to process the request. Please check server console logs or retry.";
              
              addNotification(errMsg, "error", { errorCode: 500 });
              setErrorPopup({
                title: "Internal Engine Fault (500)",
                message: backendError || "The backend server encountered an unexpected error while executing this request.",
                type: "error",
                technicalDetails: `HTTP 500 Internal Server Error\nRequested path: ${input}\nDetails: ${backendError || 'N/A'}`,
                suggestion: "This usually points to a backend error, temporary memory constraints during image merging, or model processing issues. Make sure the scraped panel matches general dimensions and click Retry.",
                onRetry: () => {
                  executeFetch();
                }
              });
              handled = true;
            } else {
              if (contentType.includes("application/json")) {
                const errorData = await response.json().catch(() => ({}));
                errMsg = errorData.message || errorData.detail || errorData.error || errMsg;
              }
              setErrorPopup({
                title: `Server Operation Error (${response.status})`,
                message: errMsg,
                type: "error",
                technicalDetails: `HTTP ${response.status} Error\nEndpoint: ${input}`,
                suggestion: "Double check model specifications and link parameters. If problems persist, refresh your browser tab or choose an alternative frame.",
                onRetry: () => {
                  executeFetch();
                }
              });
            }

            const err = new Error(errMsg);
            if (handled) {
              (err as any).intercepted = true;
            }
            reject(err);
            return;
          }

          resolve(response);
        } catch (error: any) {
          if (error.intercepted) {
            reject(error);
            return;
          }
          if (error instanceof TypeError && error.message === "Failed to fetch") {
            const netErrMessage = "Network Connection Error: Server is currently unreachable. Make sure the development server is active.";
            addNotification(netErrMessage, "error");
            setErrorPopup({
              title: "Network Unreachable",
              message: netErrMessage,
              type: "error",
              technicalDetails: `Network TypeError: Failed to fetch\nTarget URL: ${input}`,
              suggestion: "Please check your network signal or wait a brief moment for the sandboxed backend node to finish warming up and compiling, then retry the request.",
              onRetry: () => {
                executeFetch();
              }
            });
            (error as any).intercepted = true;
          }
          reject(error);
        }
      };

      executeFetch();
    });
  };
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

  // Active compiled results
  const [panels, setPanels] = useState<GeneratedPanel[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [reprocessingPanelId, setReprocessingPanelId] = useState<number | null>(null);

  // Scraped images states from live URL separation
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [selectedScraped, setSelectedScraped] = useState<string[]>([]);
  const [mergingIndices, setMergingIndices] = useState<number[]>([]);

  // Tab View for Preview ("video" for MP4 player, "storyboard" for step-by-step)
  const [activePreviewTab, setActivePreviewTab] = useState<"video" | "storyboard">("video");

  // Core API states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>("");

  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // Synchronize backend server logs in real-time with automatic SSE-to-polling fallback
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

  // Storyboard Preview player sub-states
  const [currentPanelIndex, setCurrentPanelIndex] = useState<number>(0);
  const [storyboardPlaying, setStoryboardPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);

  // Image editing/cropping states
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
  const [returnScrollY, setReturnScrollY] = useState<number>(0);
  const [editCropTop, setEditCropTop] = useState<number>(0);
  const [editCropBottom, setEditCropBottom] = useState<number>(0);
  const [editCropLeft, setEditCropLeft] = useState<number>(0);
  const [editCropRight, setEditCropRight] = useState<number>(0);
  const [editAutoTrim, setEditAutoTrim] = useState<boolean>(true);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [imageEditStates, setImageEditStates] = useState<Record<string, any>>({});
  const prevEditingImageIdxRef = useRef<number | null>(null);

  const openEditingImageIdx = useCallback((idx: number | null) => {
    if (idx !== null) {
      setReturnScrollY(window.scrollY);
    }
    setEditingImageIdx(idx);
  }, []);

  useEffect(() => {
    if (prevEditingImageIdxRef.current !== null && editingImageIdx === null) {
      window.scrollTo({ top: returnScrollY, behavior: "auto" });
    }
    prevEditingImageIdxRef.current = editingImageIdx;
  }, [editingImageIdx, returnScrollY]);

  // Restore editor states from cache when entering/switching the edit mode for a panel
  useEffect(() => {
    if (editingImageIdx === null) return;
    const imageUrl = scrapedImages[editingImageIdx];
    if (!imageUrl) return;

    const saved = imageEditStates[imageUrl];
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
  }, [editingImageIdx, scrapedImages]);

  // Bubble cleaner states (lifted to App level so the modal is rendered at the same
  // level as CropEditorModal — replacing the main workspace, not overlaying it)
  const [showBubbleModal, setShowBubbleModal] = useState<boolean>(false);
  const [bubbleDetectionStyle, setBubbleDetectionStyle] = useState<"all" | "white_only" | "text_only">("all");
  const [bubbleEraseMethod, setBubbleEraseMethod] = useState<"auto" | "inpaint" | "blur" | "solid_white" | "solid_black">("auto");
  const [bubbleSensitivity, setBubbleSensitivity] = useState<number>(50);
  const [isCleaningBubbles, setIsCleaningBubbles] = useState<boolean>(false);
  const [cleanProgress, setCleanProgress] = useState<{ current: number; total: number } | null>(null);
  const [bubbleCroppingImgUrl, setBubbleCroppingImgUrl] = useState<string | null>(null);

  // Auto crop states (lifted to App level)
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

  // References
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // ── Bubble Cleaner: runs the API call for all selected panels ────────────────
  const handleCleanBubblesSelected = async () => {
    if (selectedScraped.length === 0) return;
    setIsCleaningBubbles(true);
    setConsoleLogs(prev => [
      `[Bubble Cleaner] Initiating AI Speech Bubble removal for ${selectedScraped.length} selected panels...`,
      `[Bubble Cleaner] Settings → Detection: "${bubbleDetectionStyle}" | Method: "${bubbleEraseMethod}" | Sensitivity: ${bubbleSensitivity}%`,
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

        const idx = updatedImages.indexOf(imgUrl);
        if (idx === -1) continue;

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

      setConsoleLogs(prev => [
        `[Bubble Cleaner] ✓ Completed speech bubble cleaning for ${selectedScraped.length} panel(s)!`,
        ...prev
      ]);
      addNotification("Speech bubble cleaning completed!", "success");
    } catch (err: any) {
      console.error("[Bubble Cleaner] Failed:", err);
      if (!err.intercepted) addNotification(err.message || "Speech bubble cleaning failed.", "error");
    } finally {
      setIsCleaningBubbles(false);
      setCleanProgress(null);
      setBubbleCroppingImgUrl(null);
    }
  };

  // ── Auto Cropper: runs the API call for all selected panels ────────────────
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
        
        const idx = updatedImages.indexOf(imgUrl);
        if (idx === -1) continue;

        const response = await fetchWithInterceptor("/api/edit-image", {
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
        `[Auto Cropper] Successfully completed smart layout auto-crops for all checked images!`,
        ...prev
      ]);
      addNotification("Auto-crop completed!", "success");
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
  // ─────────────────────────────────────────────────────────────────────────────

  // Load preview images and panels immediately when targetUrl changes (either pasted or typed or clicked)
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
      
      console.log('[Scraper] Starting image scrape for URL:', targetUrl);
      console.log('[Scraper] Parsed metadata → Genre:', genre, '| Title:', title, '| Episode:', episode);
      console.log('[Model] Active AI model engine:', selectedModel);
      
      // Clear previous panels and images to start with a pristine slate
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
      console.log('[Scraper] Starting image scrape for URL:', targetUrl);

      fetchWithInterceptor("/api/scrape-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: targetUrl, model: selectedModel })
      })
        .then(res => {
          if (!isCurrent) throw new Error("Stale request cleanup");
          return res.json();
        })
        .then(data => {
          if (!isCurrent) return;
          if (data.success && data.images && data.images.length > 0) {
            console.log('[Scraper] Successfully scraped', data.images.length, 'images from target URL');
            console.log('[Scraper] Total images reported by server:', data.total_images);
            console.log('[API] Response status: success | Model used:', selectedModel);
            
            // Pre-apply referrer-bypass proxy so we never hit 403 hotlink errors in client browser
            const proxiedImages = data.images.map((img: string) => 
               img.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(img)}` : img
            );
            setScrapedImages(proxiedImages);
            
            // We keep the panels list (Storyboard) completely empty upon entering/scraping the URL,
            // as requested by the user, so they can manually add images to the storyboard.
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
            console.warn('[Scraper] No panels found:', errMsg);
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
          console.error('[Scraper] Background asset scraper failed:', err);
          console.log('[Scraper] Error type:', err.name, '| Message:', err.message);
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
    }, 750); // Debounce delay

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [targetUrl, selectedModel]);

  // Triggering text-to-speech for the storyboard previews
  const speakDialogue = (text: string) => {
    if (!window.speechSynthesis || isMuted) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Choose appropriate voice characteristics matching metadata
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
  };

  // Trigger both voice dialogue and synthesised comic SFX on panel transitions
  const playStoryboardAudio = (panelIdx: number) => {
    const activePanel = panels[panelIdx];
    if (!activePanel) return;

    // TTS speaker narrative
    speakDialogue(activePanel.speech_text);

    // Synthesis of standard comic SFXs
    if (activePanel.sfx && !isMuted) {
      playComicSoundEffect(activePanel.sfx);
    }
  };

  // Synchronize audio engine state values instantly
  useEffect(() => {
    setEngineVolume(volume, isMuted);
  }, [volume, isMuted]);

  // Synchronize background soundtrack loops based on story choice and status
  useEffect(() => {
    if (storyboardPlaying) {
      startAmbientBackgroundMusic(musicTheme, volume, isMuted);
    } else {
      stopAmbientBackgroundMusic();
    }
    return () => {
      stopAmbientBackgroundMusic();
    };
  }, [storyboardPlaying, musicTheme]);

  // Storyboard playback simulation loop
  useEffect(() => {
    if (storyboardPlaying && panels.length > 0) {
      const activePanel = panels[currentPanelIndex];
      const stepMs = 100;

      playTimerRef.current = setTimeout(() => {
        setPlaybackTime(prev => {
          const nextTime = parseFloat((prev + 0.1).toFixed(1));
          if (nextTime >= activePanel.duration) {
            // Advance sequence
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
  }, [storyboardPlaying, currentPanelIndex, panels, isMuted, volume]);

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

  // Execute Dynamic API Pipeline Generation Call
  const handleGenerateVideo = async () => {
    if (!targetUrl.trim()) {
      addNotification("Please enter or select a valid Webtoon URL to initiate the process.", "error");
      console.warn('[Pipeline] Generate video called without a URL');
      return;
    }

    console.log('[Pipeline] ═══════════════════════════════════════════');
    console.log('[Pipeline] Starting video generation pipeline...');
    console.log('[Pipeline] Target URL:', targetUrl);
    console.log('[Pipeline] AI Model:', selectedModel);
    console.log('[Pipeline] Frame Rate:', frameRate, 'fps');
    console.log('[Pipeline] Voice Actor:', voiceActor);
    console.log('[Pipeline] Music Theme:', musicTheme);
    console.log('[Pipeline] Panels in storyboard:', panels.length);
    console.log('[Pipeline] ═══════════════════════════════════════════');

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
      console.log('[Pipeline] Scraping phase initiated, target:', targetUrl);

      const requestBody = {
        url: targetUrl,
        episode_id: `wp_${Math.random().toString(36).substring(2, 8)}`,
        panels: panels,
        model: selectedModel
      };

      console.log('[API] Sending POST /api/generate with', JSON.stringify({ url: targetUrl, model: selectedModel, panelCount: panels.length }));
      
      // Real fetch endpoint integration targeting local app server
      const response = await fetchWithInterceptor("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      
      console.log('[Pipeline] Server responded with', responseData.panels_processed, 'panels');
      console.log('[Pipeline] Generated video URL:', responseData.video_url);
      console.log('[API] Full response keys:', Object.keys(responseData).join(', '));
      
      setConsoleLogs(prev => [
        ...prev,
        `[Scraper] Retrieved vertical strip elements successfully.`,
        `[Vision OCR] Isolated ${responseData.panels_processed} panels dynamically.`,
        `[Model] AI engine ${selectedModel} completed OCR + scene analysis`,
        `[MoviePy] Compiling timeline with Pan/Zoom animations...`,
        `[MoviePy] Encoded output video: ${responseData.video_url}`,
        `[Pipeline] [SUCCESS] Video generation pipeline completed successfully!`
      ]);
      
      // Update dynamic states
      setPanels(responseData.panels || []);
      setVideoUrl(responseData.video_url);
      setProgressStatus("Slices mapped & MP4 master timeline generated!");
      setActivePreviewTab("video"); // Automatically default to the video view
      addNotification('Video generated successfully! Check the preview player.', 'success');
      
    } catch (err: any) {
      console.error('[Pipeline] Pipeline failure:', err);
      console.log('[Pipeline] Error details — Status:', err.status || 'N/A', '| Code:', err.code || 'N/A', '| Message:', err.message);

      setConsoleLogs(prev => [
        ...prev,
        `[Pipeline] [ERROR] Video generation failed: ${err.message || 'Unknown error'}`,
        `[Pipeline] Error code: ${err.status || err.code || 'unknown'} | Model: ${selectedModel}`
      ]);

      if (!err.intercepted) {
        let errMessage = err.message || "An unexpected connection error occurred.";

        // Check specifically for rate limiting (429)
        if (errMessage.includes("429") || errMessage.includes("quota")) {
          errMessage = "You've exceeded your daily/request quota for the Gemini API. Please wait a short while for the quota to reset, or check your billing plan in Google AI Studio to increase your limits.";
        }

        addNotification(`Pipeline failed: ${errMessage}. Please try refreshing the page or try again.`, "error");
      }
    } finally {
      setIsProcessing(false);
      console.log('[Pipeline] Video generation pipeline completed.');
    }
  };

  // Submit crops & auto-trims to the backend edit route
  const handleSaveEditedImage = async () => {
    if (editingImageIdx === null) return;
    
    console.log('[ImageEditor] Starting crop/trim for frame', editingImageIdx + 1);
    console.log('[ImageEditor] Crop values — Top:', editCropTop, '| Bottom:', editCropBottom, '| Left:', editCropLeft, '| Right:', editCropRight, '| AutoTrim:', editAutoTrim);
    
    const originalUrl = scrapedImages[editingImageIdx];
    setIsSavingEdit(true);
    setConsoleLogs(prev => [
      `[Image Editor] Processing Crop & Auto-Trim operations on Frame #${editingImageIdx + 1}...`,
      `[Image Editor] Crop values → Top: ${editCropTop}% | Bottom: ${editCropBottom}% | Left: ${editCropLeft}% | Right: ${editCropRight}% | AutoTrim: ${editAutoTrim}`,
      ...prev
    ]);

    try {
      console.log('[API] POST /api/edit-image — Frame:', editingImageIdx + 1);
      const response = await fetchWithInterceptor("/api/edit-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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

      console.log('[ImageEditor] Successfully saved edits for frame', editingImageIdx + 1, '→', croppedUrl);
      console.log('  - Sent (Original):', originalUrl);
      console.log('  - Revise (Cropped):', croppedUrl);

      // Update the scrapedImages array in place
      setScrapedImages(prev => {
        const copy = [...prev];
        copy[editingImageIdx] = croppedUrl;
        return copy;
      });

      // Update the selection state if it was selected
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
      console.error('[ImageEditor] Failed to save edits:', err);
      console.log('[ImageEditor] Error details:', err.message, '| Status:', err.status || 'N/A');
      setConsoleLogs(prev => [
        `[Image Editor] [ERROR] Failed to save edits for Frame #${editingImageIdx + 1}: ${err.message || 'Unknown error'}`,
        ...prev
      ]);
      if (!err.intercepted) {
        addNotification(`Failed to save edits for Frame #${editingImageIdx + 1}. Please try again later.`, "error");
      }
    } finally {
      setIsSavingEdit(false);
      console.log('[ImageEditor] Edit operation completed for frame', editingImageIdx !== null ? editingImageIdx + 1 : 'N/A');
    }
  };

  // Submit multiple crops & auto-trims to the backend edit route
  const handleSaveMultipleCuts = async (cuts: Array<{
    cropTop: number;
    cropBottom: number;
    cropLeft: number;
    cropRight: number;
    autoTrim: boolean;
  }>) => {
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
          headers: {
            "Content-Type": "application/json"
          },
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

      console.log('[ImageEditor] Successfully saved multiple cuts for frame', editingImageIdx + 1);
      console.log('  - Sent (Original):', originalUrl);
      console.log('  - Revise (New Cuts):', croppedUrls);
      setConsoleLogs(prev => [
        `[Image Editor] Successfully generated ${cuts.length} cropped/trimmed frames from Frame #${editingImageIdx + 1}!`,
        `[Image Editor]   - Sent (Original): ${originalUrl.substring(0, 60)}...`,
        `[Image Editor]   - Revise (New Cuts): ${croppedUrls.map((u, i) => `Cut #${i+1}: ${u.substring(0, 40)}...`).join(', ')}`,
        ...prev
      ]);
    } catch (err: any) {
      console.error("[Image Editor] Failed to save multiple cuts:", err);
      if (!err.intercepted) {
        addNotification(`Batch crop failed. Please check the edits and try again.`, "error");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Vertically stitch a panel image with its successor to prevent cutoff artifacts
  const handleStitchWithNext = async (idx: number) => {
    if (idx < 0 || idx >= scrapedImages.length - 1) return;
    
    console.log('[Stitcher] Initiating merge of frames', idx + 1, 'and', idx + 2);
    
    setMergingIndices(prev => [...prev, idx]);
    setConsoleLogs(prev => [
      `[Stitcher] Merging Frame #${idx + 1} with Frame #${idx + 2} vertically...`,
      `[API] POST /api/stitch-images — Combining 2 image buffers server-side`,
      ...prev
    ]);

    try {
      const img1 = scrapedImages[idx];
      const img2 = scrapedImages[idx + 1];
      
      console.log('[API] POST /api/stitch-images with', { img1: img1.substring(0, 50) + '...', img2: img2.substring(0, 50) + '...' });
      
      const response = await fetchWithInterceptor("/api/stitch-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ urls: [img1, img2] })
      });
      
      const data = await response.json();
      const stitchedUrl = data.url;
      
      console.log('[Stitcher] Merge completed successfully → new URL:', stitchedUrl);
      console.log('  - Sent (Img 1):', img1);
      console.log('  - Sent (Img 2):', img2);
      console.log('  - Revise (Stitched):', stitchedUrl);
      
      // Replace the two original frames on the deck with the single stitched result
      setScrapedImages(prev => {
        const copy = [...prev];
        copy.splice(idx, 2, stitchedUrl);
        return copy;
      });

      // Maintain selection state smoothly
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
        `[Stitcher]   - Sent Frame #${idx + 1}: ${img1.substring(0, 50)}...`,
        `[Stitcher]   - Sent Frame #${idx + 2}: ${img2.substring(0, 50)}...`,
        `[Stitcher]   - Revise (Stitched Frame): ${stitchedUrl.substring(0, 50)}...`,
        ...prev
      ]);
      addNotification(`Frames #${idx + 1} and #${idx + 2} stitched successfully!`, 'success');
    } catch (err: any) {
      console.error('[Stitcher] Merging failed:', err);
      console.log('[Stitcher] Error details:', err.message);
      setConsoleLogs(prev => [
        `[Stitcher] [ERROR] Merge failed for Frame #${idx + 1} + #${idx + 2}: ${err.message || 'Unknown error'}`,
        ...prev
      ]);
      if (!err.intercepted) {
        addNotification(`Stitching failed. Please try again or refresh the page.`, "error");
      }
    } finally {
      setMergingIndices(prev => prev.filter(i => i !== idx));
      console.log('[Stitcher] Stitch operation completed for index', idx);
    }
  };

  // Trigger webtool re-scrape / re-process trigger to recalculate tighter margins in CV/OCR engine
  const handleTriggerReprocess = async (panelId: number) => {
    const activePanel = panels.find(p => p.id === panelId);
    if (!activePanel) return;

    console.log('[Reprocess] Re-analyzing panel', panelId, '| Smart crop:', activePanel.smart_crop, '| Padding:', activePanel.crop_padding);
    
    setReprocessingPanelId(panelId);
    const activePadding = activePanel.crop_padding !== undefined ? activePanel.crop_padding : 4;
    setConsoleLogs(prev => [
      `[OCR/CV Engine] Recalculating tighter cropping margins (padding: ${activePadding}%) & OCR vectors for Scene #${panelId}...`,
      `[OCR/CV Engine] Smart crop: ${activePanel.smart_crop ? 'enabled' : 'disabled'} | Padding: ${activePadding}%`,
      ...prev
    ]);

    try {
      let currentUrl = activePanel.image_url;
      try {
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
      } catch (e) {
        console.warn('[Reprocess] Failed to set refresh nonce:', e);
      }

      await new Promise(resolve => setTimeout(resolve, 900));

      setPanels(prev => prev.map(p => p.id === panelId ? { ...p, image_url: currentUrl } : p));
      
      console.log('[Reprocess] Panel', panelId, 'reprocessed successfully with padding', activePadding + '%');
      console.log('  - Sent (Original URL):', activePanel.image_url);
      console.log('  - Revise (Reprocessed URL):', currentUrl);
      
      setConsoleLogs(prev => [
        `[OCR/CV Engine] [SUCCESS] Scene #${panelId} output canvas successfully re-parsed into tighter boundaries with margin padding ${activePadding}%!`,
        `[OCR/CV Engine]   - Sent (Original URL): ${activePanel.image_url.substring(0, 60)}...`,
        `[OCR/CV Engine]   - Revise (Reprocessed URL): ${currentUrl.substring(0, 60)}...`,
        ...prev
      ]);
      addNotification(`Panel #${panelId} reprocessed with tighter margins (${activePadding}% padding).`, 'success');
    } catch (err: any) {
      console.error('[Reprocess] Reprocessing failed:', err);
      setConsoleLogs(prev => [
        `[OCR/CV Engine] [ERROR] Reprocessing failed for Scene #${panelId}: ${err.message || 'Unknown error'}`,
        ...prev
      ]);
      addNotification(`Panel reprocessing failed. Please try again later.`, "error");
    } finally {
      setReprocessingPanelId(null);
      console.log('[Reprocess] Reprocess operation completed for panel', panelId);
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
      console.error(`AI background analysis failed for Panel #${panelId}:`, err);
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
      const baseId =
        prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1;

      const newPanelsToAdd = imgUrls.map((imgUrl, loopIdx) => {
        const originalIdx = imageList.indexOf(imgUrl);
        const cardNum = originalIdx !== -1 ? originalIdx + 1 : loopIdx + 1;
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
        }, index * 1000); // Stagger background API calls to respect rate limits
      });
    }, 50);
  };

  const totalCalculatedDuration = panels.reduce((sum, p) => sum + p.duration, 0);

  return (
    <div id="app_root" className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      
      {/* BRANDING HEADER */}
      <Header 
        isProcessing={isProcessing} 
        panels={panels} 
        totalCalculatedDuration={totalCalculatedDuration} 
      />

      {/* WORKSPACE AREA — AutoCropModal / BubbleCleanerModal / CropEditorModal / Main */}
      {showAutoCropModal ? (
        <AutoCropModal
          onClose={() => setShowAutoCropModal(false)}
          onApply={() => { setShowAutoCropModal(false); handleAutoCropSelected(); }}
          sensitivity={cropSensitivity}
          setSensitivity={setCropSensitivity}
          padding={cropPaddingPx}
          setPadding={setCropPaddingPx}
          backgroundColorMode={cropBackgroundMode}
          setBackgroundColorMode={setCropBackgroundMode}
          autoSplitTallStrips={autoSplitTallStrips}
          setAutoSplitTallStrips={setAutoSplitTallStrips}
          processingStrategy={processingStrategy}
          setProcessingStrategy={setProcessingStrategy}
          aspectRatioLock={aspectRatioLock}
          setAspectRatioLock={setAspectRatioLock}
          minPanelAreaPct={minPanelAreaPct}
          setMinPanelAreaPct={setMinPanelAreaPct}
          overlapMergeThreshold={overlapMergeThreshold}
          setOverlapMergeThreshold={setOverlapMergeThreshold}
          useLocalCV={useLocalCV}
          setUseLocalCV={setUseLocalCV}
          selectedCount={selectedScraped.length}
          isApplying={isBatchCropping}
        />
      ) : showBubbleModal ? (
        <BubbleCleanerModal
          onClose={() => setShowBubbleModal(false)}
          onApply={() => { setShowBubbleModal(false); handleCleanBubblesSelected(); }}
          detectionStyle={bubbleDetectionStyle}
          setDetectionStyle={setBubbleDetectionStyle}
          eraseMethod={bubbleEraseMethod}
          setEraseMethod={setBubbleEraseMethod}
          sensitivity={bubbleSensitivity}
          setSensitivity={setBubbleSensitivity}
          selectedCount={selectedScraped.length}
          isApplying={isCleaningBubbles}
        />
      ) : (
        <main id="main_workspace" className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT COLUMN: SOURCE INTEGRATION */}
        <div id="controls_column" className="lg:col-span-7 flex flex-col gap-8">
          
          {/* CONVERSION INPUT CARD */}
          <div id="dynamic_input_box" className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-8 backdrop-blur-md shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-wider uppercase font-mono">Dynamic Webtoon Scraper</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Generate Video from Live Incident URL</h2>
              <p className="text-xs text-neutral-400 font-sans">
                Enter an official Webtoon viewer URL page. The backend engine will scrape the live media assets, isolate panels, run OCR transcriptions, and compile the cinematic rendering dynamically.
              </p>
            </div>

              {/* URL Inputs + Model Selection */}
              <div className="space-y-5">
                <div className="relative group">
                  <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-20 blur group-focus-within:opacity-40 transition-opacity duration-300" />
                  <input 
                    id="target_url_input"
                    type="url" 
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value.trim())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isProcessing && targetUrl.trim()) {
                        handleGenerateVideo();
                      }
                    }}
                    placeholder="Paste Webtoon episode viewer URL (e.g. webtoons.com/...)"
                    className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="space-y-3 pt-1">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-550 animate-ping"></span>
                    Active AI Model Engine (Free Models Recommended)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {AI_MODELS.map((modelItem) => (
                      <button
                        key={modelItem.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(modelItem.id);
                          addNotification(`Model configured to ${modelItem.name}`, 'info');
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-1.5 transition-all duration-300 cursor-pointer ${
                          selectedModel === modelItem.id
                            ? "bg-purple-950/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.12)] text-white"
                            : "bg-neutral-950/40 border-neutral-850/60 hover:border-neutral-750 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 w-full">
                          <span className="text-xs font-semibold whitespace-nowrap truncate">{modelItem.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                            modelItem.type === 'free' 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : modelItem.type === 'open-source'
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {modelItem.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 truncate w-full italic font-sans">Powered by {modelItem.provider}</span>
                      </button>
                    ))}
                  </div>
                  {selectedModel.includes('pro') && (
                    <p className="text-[10.5px] text-amber-500/90 font-mono flex items-center gap-1.5 animate-pulse">
                      <span>⚠️</span> Note: Pro models may require billing/credits. Flash models (Free) are highly recommended.
                    </p>
                  )}
                </div>
              </div>
            </div>

          {/* SEPARATED IMAGE STRIPS GALLERY */}
          <LiveScraperDeck
            scrapedImages={scrapedImages}
            isScraping={isScraping}
            selectedScraped={selectedScraped}
            setSelectedScraped={setSelectedScraped}
            setScrapedImages={setScrapedImages}
            mergingIndices={mergingIndices}
            setConsoleLogs={setConsoleLogs}
            panels={panels}
            setPanels={setPanels}
            currentPanelIndex={currentPanelIndex}
            handleMergeWithNext={handleStitchWithNext}
            setEditingImageIdx={setEditingImageIdx}
            openEditingImageIdx={openEditingImageIdx}
            setEditCropTop={setEditCropTop}
            setEditCropBottom={setEditCropBottom}
            setEditCropLeft={setEditCropLeft}
            setEditCropRight={setEditCropRight}
            setEditAutoTrim={setEditAutoTrim}
            addNotification={addNotification}
            fetchWithInterceptor={fetchWithInterceptor}
            setErrorPopup={setErrorPopup}
            showBubbleModal={showBubbleModal}
            setShowBubbleModal={setShowBubbleModal}
            isCleaningBubbles={isCleaningBubbles}
            cleanProgress={cleanProgress}
            bubbleCroppingImgUrl={bubbleCroppingImgUrl}
            showAutoCropModal={showAutoCropModal}
            setShowAutoCropModal={setShowAutoCropModal}
            isBatchCropping={isBatchCropping}
            batchProgress={batchProgress}
            croppingImgUrl={croppingImgUrl}
            addPanelsWithAutoAnalysis={addPanelsWithAutoAnalysis}
          />

          {/* ACTIVE QUEUE / LIVE PIPELINE PROGRESS */}
          {isProcessing && (
            <div id="pipeline_status_card" className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 space-y-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-400 animate-spin" />
                  <span className="font-bold text-sm text-white">Pipeline executing asynchronously</span>
                </div>
                <span className="text-xs font-mono text-purple-400 font-semibold">Live status</span>
              </div>

              <div className="bg-neutral-950/80 px-4 py-3 rounded-xl border border-neutral-800/80 text-xs font-mono text-neutral-200">
                <span className="text-purple-400 font-bold">&gt;&gt;</span> {progressStatus}
              </div>

              {/* Progress animation track */}
              <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-850">
                <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 h-full w-2/3 rounded-full animate-infinite-scroll" />
              </div>
            </div>
          )}

          {/* REAL-TIME LOG MONITOR — Always visible */}
          <TerminalLogs consoleLogs={consoleLogs} setConsoleLogs={setConsoleLogs} />

          {/* DYNAMIC STORYBOARD TIMELINE DECK */}
          <div id="storyboard_timeline_section">
            <StoryboardTimeline
              panels={panels}
              setPanels={setPanels}
              currentPanelIndex={currentPanelIndex}
              setCurrentPanelIndex={setCurrentPanelIndex}
              activePreviewTab={activePreviewTab}
              setActivePreviewTab={setActivePreviewTab}
              setPlaybackTime={setPlaybackTime}
              hasScrapedImages={scrapedImages.length > 0}
              setVideoUrl={setVideoUrl}
              addNotification={addNotification}
              targetUrl={targetUrl}
              fetchWithInterceptor={fetchWithInterceptor}
              selectedModel={selectedModel}
              setConsoleLogs={setConsoleLogs}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: INTEGRATED CINEMA PLAYER */}
        <div id="cinema_column" className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
          <VideoMonitor
            activePreviewTab={activePreviewTab}
            setActivePreviewTab={setActivePreviewTab}
            videoUrl={videoUrl}
            panels={panels}
            aspectRatio={aspectRatio}
            videoPlayerRef={videoPlayerRef}
            currentPanelIndex={currentPanelIndex}
            playbackTime={playbackTime}
            reprocessingPanelId={reprocessingPanelId}
          />

          {/* SECTION: FINAL COMPILED VIDEO PREVIEW */}
          {videoUrl && (
            <div className="space-y-3 bg-neutral-900 border border-neutral-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                 <Film className="h-4 w-4 text-purple-400" />
                 <span className="text-[10px] uppercase font-mono font-bold text-neutral-300 tracking-wider">
                   Final Compiled Preview
                 </span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 shadow">
                  <Film className="h-3 w-3" />
                  Full Video
                </button>
                <button className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2">
                  <Download className="h-3 w-3" />
                  Export
                </button>
              </div>
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg bg-black"
                style={{ aspectRatio: aspectRatio === "9:16" ? "9/16" : "16/9" }}
              />
            </div>
          )}

          {/* PLAYBACK CONTROLLER ACCESSORIES FOR STORYBOARD PREVIEW */}
          {activePreviewTab === "storyboard" && panels.length > 0 && (
            <VolumeAndProgressPanel
              panels={panels}
              currentPanelIndex={currentPanelIndex}
              playbackTime={playbackTime}
              storyboardPlaying={storyboardPlaying}
              toggleStoryboardPlayback={toggleStoryboardPlayback}
              resetStoryboardPlayback={resetStoryboardPlayback}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              volume={volume}
              setVolume={setVolume}
            />
          )}

          <ModelStatusTable 
            selectedModel={
              selectedModel === 'gemini-3.5-flash' ? 'Gemini 3.5 Flash' :
              selectedModel === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' :
              selectedModel === 'gemini-1.5-pro' ? 'Gemini 1.5 Pro' :
              selectedModel === 'llama-3-70b' ? 'Llama 3 (via Groq)' :
              selectedModel === 'huggingface-mistral-7b' ? 'Mistral 7B (via HuggingFace)' :
              selectedModel
            }
            onSelect={(modelName) => {
              const matched = AI_MODELS.find(m => m.name === modelName || m.id === modelName);
              if (matched) {
                setSelectedModel(matched.id);
                addNotification(`Model configured to ${matched.name}`, 'info');
              } else {
                if (modelName === "Gemini 2.5 Flash") {
                  setSelectedModel("gemini-2.5-flash");
                  addNotification(`Model configured to Gemini 2.5 Flash`, 'info');
                } else if (modelName === "Gemini 3.5 Flash") {
                  setSelectedModel("gemini-3.5-flash");
                  addNotification(`Model configured to Gemini 3.5 Flash`, 'info');
                } else if (modelName.includes("Pro")) {
                  setSelectedModel("gemini-1.5-pro");
                  addNotification(`Model configured to Gemini 1.5 Pro (Note: Pro Model)`, 'info');
                }
              }
            }}
          />

          {/* METADATA RENDER MATRIX */}
          <div id="video_metadata_panel" className="bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-5 space-y-3.5">
            <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest font-mono">Output Specifications</h4>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs text-neutral-300">
              <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2">
                <span className="text-neutral-500 font-sans">Codec</span>
                <span className="font-mono font-semibold">H.264 (MP4 Wrapper)</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2">
                <span className="text-neutral-500 font-sans">Soundtrack</span>
                <span className="font-sans font-semibold text-purple-400 truncate max-w-[124px] block" title={musicTheme}>
                  {musicTheme}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2 col-span-2">
                <span className="text-neutral-500 font-sans">Active Speaker</span>
                <span className="font-sans font-semibold text-purple-400">{voiceActor}</span>
              </div>
              {videoUrl && (
                <div className="flex items-center justify-between col-span-2 text-emerald-400 font-mono text-[11px] bg-emerald-950/20 border border-emerald-900/35 px-2.5 py-1.5 rounded-lg">
                  <span>Compiled Output URL:</span>
                  <span className="underline select-all truncate max-w-[200px] font-bold">{videoUrl}</span>
                </div>
              )}
            </div>

            {/* Download MP4 Button */}
            {videoUrl && (
              <div className="pt-2">
                <a
                  href={videoUrl}
                  download={`webtoon_cinemamaster_${Math.random().toString(36).substring(2, 6)}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none shadow-lg shadow-purple-900/30 font-sans"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Master MP4 File</span>
                </a>
              </div>
            )}
          </div>
        </div>
        </main>
      )}

      {editingImageIdx !== null && (
        <CropEditorModal
          key={editingImageIdx}
          editingImageIdx={editingImageIdx}
          setEditingImageIdx={setEditingImageIdx}
          editCropTop={editCropTop}
          setEditCropTop={setEditCropTop}
          editCropBottom={editCropBottom}
          setEditCropBottom={setEditCropBottom}
          editCropLeft={editCropLeft}
          setEditCropLeft={setEditCropLeft}
          editCropRight={editCropRight}
          setEditCropRight={setEditCropRight}
          editAutoTrim={editAutoTrim}
          setEditAutoTrim={setEditAutoTrim}
          scrapedImages={scrapedImages}
          setScrapedImages={setScrapedImages}
          isSavingEdit={isSavingEdit}
          handleSaveEditedImage={handleSaveEditedImage}
          handleSaveMultipleCuts={handleSaveMultipleCuts}
          setConsoleLogs={setConsoleLogs}
          addNotification={addNotification}
          selectedScraped={selectedScraped}
          setSelectedScraped={setSelectedScraped}
          panels={panels}
          setPanels={setPanels}
          fetchWithInterceptor={fetchWithInterceptor}
          setErrorPopup={setErrorPopup}
          imageEditStates={imageEditStates}
          setImageEditStates={setImageEditStates}
        />
      )}

      {/* FOOTER */}
      <footer id="footer_pane" className="border-t border-neutral-850 bg-neutral-950/20 py-6 text-center text-xs text-neutral-500">
        <p className="font-mono">Webtoon-to-Video compilation dashboard &bull; Real-time Scraper Integration</p>
      </footer>

      <NotificationStack notifications={notifications} removeNotification={removeNotification} />
      <ErrorPopupModal error={errorPopup} onClose={() => setErrorPopup(null)} />
    </div>
  );
}
