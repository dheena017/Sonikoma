import { useState, useCallback, useEffect } from "react";
import { GeneratedPanel } from "../types";
import { AI_MODELS } from "../models";
import { createFetchWithInterceptor } from "../api/fetchWithInterceptor";
import {
  Notification,
  NotificationType,
} from "../components/NotificationStack";
import { ErrorPopupDetail } from "../components/ErrorPopupModal";

export function useAppState() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const [panels, setPanels] = useState<GeneratedPanel[]>([]);
  const [consoleLogs, setRawConsoleLogs] = useState<string[]>([]);

  const setConsoleLogs = useCallback((val: React.SetStateAction<string[]>) => {
    setRawConsoleLogs((prev) => {
      const resolved = typeof val === "function" ? val(prev) : val;
      return resolved.map((log) => {
        // Match standard format: HH:MM:SS [TAG]
        const hasStandardFormat = /^\d{2}:\d{2}:\d{2} \[[A-Z_0-9]+\]/.test(log);
        if (hasStandardFormat) {
          return log;
        }

        let category = "FRONTEND";
        let level = "INFO";
        let filename = "App.tsx";
        let message = log;

        // Extract level categorizations from log content
        if (log.includes("[ERROR]") || log.includes("[FATAL]") || log.toLowerCase().includes("failed")) {
          level = "ERROR";
        } else if (log.includes("[WARNING]") || log.includes("[WARN]")) {
          level = "WARN";
        } else if (log.includes("[SUCCESS]") || log.toLowerCase().includes("successfully")) {
          level = "SUCCESS";
        } else if (log.includes("[AI") || log.includes("[Gemini]")) {
          level = "AI";
        } else if (log.includes("[Database]") || log.includes("[DB]")) {
          level = "DATABASE";
        } else if (log.includes("[API]") || log.includes("[HTTP]")) {
          level = "API";
        }

        // Parse brackets like [Scraper] Spawned... or [GUI] Mounted...
        const bracketMatch = log.match(/^\[([^\]]+)\]\s*(?:\[([^\]]+)\])?\s*(.*)$/);
        if (bracketMatch) {
          const firstTag = bracketMatch[1];
          const secondTag = bracketMatch[2];
          const rest = bracketMatch[3];

          if (secondTag && ["INFO", "DEBUG", "WARN", "WARNING", "ERROR", "SUCCESS", "FATAL"].includes(secondTag.toUpperCase())) {
            level = secondTag.toUpperCase();
            filename = firstTag;
            message = rest;
          } else {
            if (["INFO", "DEBUG", "WARN", "WARNING", "ERROR", "SUCCESS", "FATAL"].includes(firstTag.toUpperCase())) {
              level = firstTag.toUpperCase();
              filename = "App.tsx";
            } else {
              filename = firstTag;
            }
            message = rest;
          }
        }

        const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
        return `${timestamp} [${category}] [${level}] [${filename}] ${message}`;
      });
    });
  }, []);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [selectedScraped, setSelectedScraped] = useState<string[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<
    "video" | "storyboard"
  >("video");

  // Image editing/cropping states
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
  const [editCropTop, setEditCropTop] = useState<number>(0);
  const [editCropBottom, setEditCropBottom] = useState<number>(0);
  const [editCropLeft, setEditCropLeft] = useState<number>(0);
  const [editCropRight, setEditCropRight] = useState<number>(0);
  const [editAutoTrim, setEditAutoTrim] = useState<boolean>(true);
  const [imageEditStates, setImageEditStates] = useState<Record<string, any>>(
    {}
  );

  // Bubble cleaner states
  const [showBubbleModal, setShowBubbleModal] = useState<boolean>(false);
  const [bubbleDetectionStyle, setBubbleDetectionStyle] = useState<
    "all" | "white_only" | "text_only"
  >("all");
  const [bubbleEraseMethod, setBubbleEraseMethod] = useState<
    "auto" | "inpaint" | "blur" | "solid_white" | "solid_black"
  >("auto");
  const [bubbleSensitivity, setBubbleSensitivity] = useState<number>(50);
  const [bubbleDilation, setBubbleDilation] = useState<number>(-1);
  const [bubbleInpaintRadius, setBubbleInpaintRadius] = useState<number>(3);
  const [activeBubbleTab, setActiveBubbleTab] = useState<string>("general");
  const [isCleaningBubbles, setIsCleaningBubbles] = useState<boolean>(false);
  const [cleanProgress, setCleanProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [bubbleCroppingImgUrl, setBubbleCroppingImgUrl] = useState<
    string | null
  >(null);

  // Auto crop states
  const [showAutoCropModal, setShowAutoCropModal] = useState<boolean>(false);
  const [cropSensitivity, setCropSensitivity] = useState<number>(30);
  const [cropPaddingPx, setCropPaddingPx] = useState<number>(10);
  const [cropBackgroundMode, setCropBackgroundMode] = useState<string>("auto");
  const [autoSplitTallStrips, setAutoSplitTallStrips] = useState<boolean>(true);
  const [processingStrategy, setProcessingStrategy] =
    useState<string>("balanced");
  const [aspectRatioLock, setAspectRatioLock] = useState<string>("free");
  const [minPanelAreaPct, setMinPanelAreaPct] = useState<number>(2);
  const [overlapMergeThreshold, setOverlapMergeThreshold] =
    useState<number>(20);
  const [useLocalCV, setUseLocalCV] = useState<boolean>(true);
  const [isBatchCropping, setIsBatchCropping] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [croppingImgUrl, setCroppingImgUrl] = useState<string | null>(null);
  const [cropModel, setCropModel] = useState<string>("gemini-2.5-flash");
  const [cropMinHeightPx, setCropMinHeightPx] = useState<number>(60);
  const [cropCannyLow, setCropCannyLow] = useState<number>(20);
  const [cropCannyHigh, setCropCannyHigh] = useState<number>(100);
  const [cropCloseKernelSize, setCropCloseKernelSize] = useState<number>(15);
  const [activeAutoCropTab, setActiveAutoCropTab] = useState<string>("general");

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem("ai_comic_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [errorPopup, setErrorPopup] = useState<ErrorPopupDetail | null>(null);

  // Settings — all useState MUST come before any useCallback/useEffect
  const [targetUrl, setTargetUrl] = useState<string>(
    () => localStorage.getItem("ai_comic_url") || ""
  );
  const [voiceActor, setVoiceActor] = useState<string>(
    () =>
      localStorage.getItem("ai_comic_voice") || "Standard Comic Narrator (Male)"
  );
  const [musicTheme, setMusicTheme] = useState<string>(
    () => localStorage.getItem("ai_comic_music") || "Orchestral Battle Theme"
  );
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">(
    () =>
      (localStorage.getItem("ai_comic_aspectRatio") as "9:16" | "16:9") ||
      "9:16"
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem("ai_comic_model") || AI_MODELS[0].id
  );
  const [selectedSource, setSelectedSource] = useState<string>(
    () => localStorage.getItem("ai_comic_source") || "webtoons"
  );
  const [frameRate, setFrameRate] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_fps") || "24")
  );
  const [volume, setVolume] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_volume") || "80")
  );
  const [isMuted, setIsMuted] = useState<boolean>(
    () => localStorage.getItem("ai_comic_muted") === "true"
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [narrationStyle, setNarrationStyle] = useState<string>(
    () => localStorage.getItem("ai_comic_narration_style") || "long"
  );
  const [scrapedTitle, setScrapedTitle] = useState<string>("Overpowered S-Rank Recap");
  const [scrapedGenre, setScrapedGenre] = useState<string>("Fantasy Action");

  // ── Callbacks & effects AFTER all useState declarations ──────────────────

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, toastDismissed: true } : n))
    );
  }, []);

  const addNotification = useCallback(
    (
      message: string,
      type: NotificationType,
      options?: {
        errorCode?: number;
        retryDelay?: number;
        onRetry?: () => void;
        details?: string;
        link?: string;
      }
    ) => {
      const id = Date.now() + Math.random();
      const newNote: Notification = {
        id,
        message,
        type,
        timestamp: Date.now(),
        isRead: false,
        ...options,
      };

      setNotifications((prev) => [newNote, ...prev]);

      if (!options?.onRetry) {
        setTimeout(() => {
          removeNotification(id);
        }, 5000);
      }
    },
    [removeNotification]
  );

  const fetchWithInterceptor = useCallback(
    createFetchWithInterceptor({ addNotification, setErrorPopup }),
    [addNotification, setErrorPopup]
  );

  // --- Auth Actions ---
  const login = useCallback(
    async (credentials: any) => {
      const res = await fetchWithInterceptor("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("anivox_token", data.access_token);
        setUser(data.user);
        setIsAuthenticated(true);
        addNotification("Logged in successfully!", "success");
      } else {
        throw new Error(data.detail || "Login failed");
      }
    },
    [addNotification, fetchWithInterceptor]
  );

  const register = useCallback(
    async (userData: any) => {
      const res = await fetchWithInterceptor("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("anivox_token", data.access_token);
        setUser(data.user);
        setIsAuthenticated(true);
        addNotification("Account created successfully!", "success");
      } else {
        throw new Error(data.detail || "Registration failed");
      }
    },
    [addNotification, fetchWithInterceptor]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("anivox_token");
    setUser(null);
    setIsAuthenticated(false);
    addNotification("Logged out successfully.", "info");
    (window as any).navigateTo?.("/landing");
  }, [addNotification]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("anivox_token");

    // Artificial delay to show the fancy loading screen
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const start = Date.now();

    if (!token) {
      const elapsed = Date.now() - start;
      if (elapsed < 1500) await delay(1500 - elapsed);
      setAuthLoading(false);
      setIsInitializing(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("anivox_token");
      }
    } catch (e) {
      console.error("Auth check failed", e);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 2000) await delay(2000 - elapsed);
      setAuthLoading(false);
      setIsInitializing(false);
    }
  }, []);

  const forgotPassword = useCallback(
    async (email: string) => {
      const res = await fetchWithInterceptor("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return data;
    },
    [fetchWithInterceptor]
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    localStorage.setItem(
      "ai_comic_notifications",
      JSON.stringify(notifications)
    );
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("ai_comic_url", targetUrl);
    localStorage.setItem("ai_comic_voice", voiceActor);
    localStorage.setItem("ai_comic_music", musicTheme);
    localStorage.setItem("ai_comic_aspectRatio", aspectRatio);
    localStorage.setItem("ai_comic_model", selectedModel);
    localStorage.setItem("ai_comic_source", selectedSource);
    localStorage.setItem("ai_comic_fps", frameRate.toString());
    localStorage.setItem("ai_comic_volume", volume.toString());
    localStorage.setItem("ai_comic_muted", isMuted.toString());
    localStorage.setItem("ai_comic_narration_style", narrationStyle);
  }, [
    targetUrl,
    voiceActor,
    musicTheme,
    aspectRatio,
    selectedModel,
    selectedSource,
    frameRate,
    volume,
    isMuted,
    narrationStyle,
  ]);

  return {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    authLoading,
    isInitializing,
    login,
    register,
    logout,
    forgotPassword,
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
    bubbleDilation,
    setBubbleDilation,
    bubbleInpaintRadius,
    setBubbleInpaintRadius,
    activeBubbleTab,
    setActiveBubbleTab,
    isCleaningBubbles,
    setIsCleaningBubbles,
    cleanProgress,
    setCleanProgress,
    bubbleCroppingImgUrl,
    setBubbleCroppingImgUrl,
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
    setIsBatchCropping,
    batchProgress,
    setBatchProgress,
    croppingImgUrl,
    setCroppingImgUrl,
    cropModel,
    setCropModel,
    cropMinHeightPx,
    setCropMinHeightPx,
    cropCannyLow,
    setCropCannyLow,
    cropCannyHigh,
    setCropCannyHigh,
    cropCloseKernelSize,
    setCropCloseKernelSize,
    activeAutoCropTab,
    setActiveAutoCropTab,
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
    selectedSource,
    setSelectedSource,
    frameRate,
    setFrameRate,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    videoUrl,
    setVideoUrl,
    isSavingEdit,
    setIsSavingEdit,
    isScraping,
    setIsScraping,
    narrationStyle,
    setNarrationStyle,
    scrapedTitle,
    setScrapedTitle,
    scrapedGenre,
    setScrapedGenre,
    clearAllNotifications: () => {
      setNotifications([]);
    },
    markAllNotificationsAsRead: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    },
    markNotificationAsRead: (id: number) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
    deleteNotification: (id: number) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
  };
}
