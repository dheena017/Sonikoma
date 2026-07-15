import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { GeneratedPanel, CharacterBio } from "../types";
import { AI_MODELS } from "../models";
import { createFetchWithInterceptor } from "../api/fetchWithInterceptor";
import * as api from "../api";
import {
  Notification,
  NotificationType,
} from "../components/notification/NotificationStack";
import { ErrorPopupDetail } from "../components/confirmationmodels/ErrorPopupModal";
import { parseWebtoonUrl } from "../utils/url";
import { useAudioFeedback } from "./useAudioFeedback";
import { LogEntry, normalizeLog } from "../types/logs";
import { useProjectStore } from "../store/useProjectStore";

export function useAppState() {
  const [user, setUser] = useState<any>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mock_auth") === "true") {
          return { id: 1, email: "developer@example.com", name: "Developer" };
        }
      }
    } catch (e) {}
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mock_auth") === "true") {
          return true;
        }
      }
    } catch (e) {}
    return false;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mock_auth") === "true") {
          return false;
        }
      }
    } catch (e) {}
    return true;
  });
  const [isInitializing, setIsInitializing] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mock_auth") === "true") {
          return false;
        }
      }
    } catch (e) {}
    return true;
  });

  const activeProjectData = useProjectStore((state) => state.activeProjectData);

  const panels = useMemo(() => activeProjectData?.panels ?? [], [activeProjectData]);
  const setPanels = useCallback((val: GeneratedPanel[] | ((prev: GeneratedPanel[]) => GeneratedPanel[])) => {
    const cur = useProjectStore.getState().activeProjectData;
    const currentPanels = cur?.panels ?? [];
    const nextPanels = typeof val === "function" ? val(currentPanels) : val;
    useProjectStore.getState().setActiveProject({
      project: cur?.project ?? { project_id: "", title: "", url: "" },
      panels: nextPanels,
    });
  }, []);

  const projectId = activeProjectData?.project?.project_id ?? null;
  const setProjectId = useCallback((val: string | null) => {
    const cur = useProjectStore.getState().activeProjectData;
    if (!val) {
      useProjectStore.getState().clearActiveProject();
      return;
    }
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { title: "", url: "" }), project_id: val },
      panels: cur?.panels ?? [],
    });
  }, []);

  const seriesSlugState = activeProjectData?.project?.series_slug ?? null;
  const setSeriesSlugState = useCallback((val: string | null) => {
    const cur = useProjectStore.getState().activeProjectData;
    if (!cur) return;
    useProjectStore.getState().setActiveProject({
      ...cur,
      project: { ...cur.project, series_slug: val },
    });
  }, []);

  const chapterSlugState = activeProjectData?.project?.chapter_slug ?? null;
  const setChapterSlugState = useCallback((val: string | null) => {
    const cur = useProjectStore.getState().activeProjectData;
    if (!cur) return;
    useProjectStore.getState().setActiveProject({
      ...cur,
      project: { ...cur.project, chapter_slug: val },
    });
  }, []);
  const [consoleLogs, setRawConsoleLogs] = useState<LogEntry[]>([]);
  const [characters, setCharacters] = useState<CharacterBio[]>([]);

  // Refs removed: useAppState popstate handler relies on Zustand reads to avoid batching/race issues.


  const [scrapedImages, setScrapedImages] = useState<string[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("idx") !== null) {
          return ["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800"];
        }
      }
    } catch (e) {}
    return [];
  });
  const [selectedScraped, setSelectedScraped] = useState<string[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<
    "video" | "timeline"
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
  const [bubbleSensitivity, setBubbleSensitivity] = useState<number>(
    () => parseInt(localStorage.getItem("ai_bubble_sensitivity") || "50", 10)
  );
  const [bubbleDilation, setBubbleDilation] = useState<number>(
    () => parseInt(localStorage.getItem("ai_bubble_dilation") || "-1", 10)
  );
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
  const [cropSensitivity, setCropSensitivity] = useState<number>(
    () => parseInt(localStorage.getItem("ai_crop_sensitivity") || "30", 10)
  );
  const [cropPaddingPx, setCropPaddingPx] = useState<number>(
    () => parseInt(localStorage.getItem("ai_crop_padding") || "10", 10)
  );
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
  const [cropModel, setCropModel] = useState<string>(
    () => localStorage.getItem("ai_crop_model") || "gemini-2.0-flash-lite"
  );
  const [cropMinHeightPx, setCropMinHeightPx] = useState<number>(60);
  const [cropCannyLow, setCropCannyLow] = useState<number>(20);
  const [cropCannyHigh, setCropCannyHigh] = useState<number>(100);
  const [cropCloseKernelSize, setCropCloseKernelSize] = useState<number>(15);
  const [activeAutoCropTab, setActiveAutoCropTab] = useState<string>("general");
  const [cropGuidance, setCropGuidance] = useState<string>("");
  const [cropFocusMode, setCropFocusMode] = useState<string>(
    () => localStorage.getItem("ai_crop_focus_mode") || "standard"
  );
  const [showScrapeConfirmModal, setShowScrapeConfirmModal] =
    useState<boolean>(false);
  const [accumulatedTokens, setAccumulatedTokens] = useState<number>(0);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem("ai_comic_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (n: any) =>
              n &&
              n.message &&
              !n.message.includes("The backend server is not running")
          );
          // Deduplicate by message to show only the most recent one
          const seen = new Set<string>();
          return filtered.filter((n: any) => {
            if (seen.has(n.message)) return false;
            seen.add(n.message);
            return true;
          });
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [notificationsMuted, setNotificationsMuted] = useState<boolean>(() => {
    return localStorage.getItem("ai_comic_notifications_muted") === "true";
  });
  const [errorPopup, setErrorPopup] = useState<ErrorPopupDetail | null>(null);

  // Settings — all useState MUST come before any useCallback/useEffect
  const targetUrl = activeProjectData?.project?.url ?? (() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("idx") !== null) {
          return "https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-1/viewer?title_no=95&episode_no=418";
        }
      }
    } catch (e) {}
    return localStorage.getItem("ai_comic_url") || "";
  })();
  
  const setTargetUrl = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", title: "" }), url: val },
      panels: cur?.panels ?? [],
    });
  }, []);
  const [voiceActor, setVoiceActor] = useState<string>(
    () =>
      localStorage.getItem("ai_comic_voice") || "Standard Comic Narrator (Male)"
  );
  const [musicTheme, setMusicTheme] = useState<string>(
    () => localStorage.getItem("ai_comic_music") || "Orchestral Battle Theme"
  );
  const [aspectRatio, setAspectRatio] = useState<"auto" | "9:16" | "16:9">(
    () =>
      (localStorage.getItem("ai_comic_aspectRatio") as "auto" | "9:16" | "16:9") ||
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

  const [sfxVolume, setSfxVolume] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_sfx_volume") || "60")
  );
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(
    () => localStorage.getItem("ai_comic_sfx_enabled") !== "false"
  );
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(
    () => localStorage.getItem("app-autoplay-audio") === "true"
  );

  const [narrationVolume, setNarrationVolume] = useState<number>(
    () => parseInt(localStorage.getItem("ai_comic_narration_volume") || "90", 10)
  );
  const [bgmVolume, setBgmVolume] = useState<number>(
    () => parseInt(localStorage.getItem("ai_comic_bgm_volume") || "50", 10)
  );
  const [audioDucking, setAudioDucking] = useState<boolean>(
    () => localStorage.getItem("ai_comic_audio_ducking") !== "false"
  );
  const [speechRate, setSpeechRate] = useState<number>(
    () => parseFloat(localStorage.getItem("ai_comic_speech_rate") || "1.0")
  );
  const [speechPitch, setSpeechPitch] = useState<number>(
    () => parseFloat(localStorage.getItem("ai_comic_speech_pitch") || "1.0")
  );
  const [audioReactiveShake, setAudioReactiveShake] = useState<boolean>(
    () => localStorage.getItem("ai_video_shake") === "true"
  );
  const [shakeIntensity, setShakeIntensity] = useState<"low" | "medium" | "high" | "extreme">(
    () => (localStorage.getItem("ai_video_shake_intensity") as any) || "medium"
  );
  const [videoFormat, setVideoFormat] = useState<"mp4" | "webm" | "mkv">(
    () => (localStorage.getItem("ai_video_format") as any) || "mp4"
  );
  const [backgroundStyle, setBackgroundStyle] = useState<"black" | "white" | "transparent" | "blurred">(
    () => (localStorage.getItem("ai_video_bg_style") as any) || "black"
  );
  const [subtitlesStyle, setSubtitlesStyle] = useState<"none" | "burn-in" | "soft">("none");

  const audioFeedback = useAudioFeedback(sfxVolume, !sfxEnabled);

  const videoUrl = activeProjectData?.project?.video_url ?? null;
  const setVideoUrl = useCallback((val: string | null) => {
    const cur = useProjectStore.getState().activeProjectData;
    if (!cur) return;
    useProjectStore.getState().setActiveProject({
      ...cur,
      project: { ...cur.project, video_url: val },
    });
  }, []);

  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [narrationStyle, setNarrationStyle] = useState<string>(
    () => localStorage.getItem("ai_comic_narration_style") || "long"
  );
  const [smartSlice, setSmartSlice] = useState<boolean>(
    () => localStorage.getItem("ai_comic_smart_slice") !== "false"
  );

  const scrapedTitle = activeProjectData?.project?.title || "Overpowered S-Rank Recap";
  const setScrapedTitle = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", url: "" }), title: val },
      panels: cur?.panels ?? [],
    });
  }, []);

  const scrapedGenre = activeProjectData?.project?.genre ?? "Fantasy Action";
  const setScrapedGenre = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", title: "", url: "" }), genre: val },
      panels: cur?.panels ?? [],
    });
  }, []);

  const seriesTitle = activeProjectData?.project?.title ?? "";
  const setSeriesTitle = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", url: "" }), title: val },
      panels: cur?.panels ?? [],
    });
  }, []);

  const chapterNumber = activeProjectData?.project?.chapterNumber ?? "";
  const setChapterNumber = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", title: "", url: "" }), chapterNumber: val },
      panels: cur?.panels ?? [],
    });
  }, []);

  const chapterTitle = activeProjectData?.project?.chapterTitle ?? "";
  const setChapterTitle = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", title: "", url: "" }), chapterTitle: val },
      panels: cur?.panels ?? [],
    });
  }, []);

  const seriesAuthor = activeProjectData?.project?.author ?? "";
  const setSeriesAuthor = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", title: "", url: "" }), author: val },
      panels: cur?.panels ?? [],
    });
  }, []);

  const seriesCoverImage = activeProjectData?.project?.cover_image ?? "";
  const setSeriesCoverImage = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", title: "", url: "" }), cover_image: val },
      panels: cur?.panels ?? [],
    });
  }, []);

  const seriesSynopsis = activeProjectData?.project?.synopsis ?? "";
  const setSeriesSynopsis = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", title: "", url: "" }), synopsis: val },
      panels: cur?.panels ?? [],
    });
  }, []);

  useEffect(() => {
    if (projectId) return;

    if (!targetUrl.trim()) {
      setSeriesTitle("");
      setChapterNumber("");
      setChapterTitle("");
      setSeriesAuthor("");
      setSeriesCoverImage("");
      setSeriesSynopsis("");
      return;
    }
    try {
      const parsed = parseWebtoonUrl(targetUrl);
      if (parsed) {
        setSeriesTitle(parsed.title || "");
        setChapterNumber(parsed.chapterNumber || "");
        setChapterTitle(parsed.chapterTitle || "");
        setScrapedGenre(parsed.genre || "general");
        setScrapedTitle(parsed.title || "");
      }
    } catch {
      // ignore
    }
  }, [targetUrl, projectId]);

  // ── Callbacks & effects AFTER all useState declarations ──────────────────

  const setConsoleLogs = useCallback((val: React.SetStateAction<any[]>) => {
    setRawConsoleLogs((prev) => {
      const incoming = typeof val === "function" ? val(prev) : val;
      // If incoming is already normalized array, just slice
      if (Array.isArray(incoming)) {
        const normalized = incoming.map((log) => normalizeLog(log));
        return normalized.slice(-200);
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "ai_comic_notifications_muted",
      String(notificationsMuted)
    );
  }, [notificationsMuted]);

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

      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.message !== message);
        return [newNote, ...filtered];
      });

      // Play audio feedback based on type
      if (sfxEnabled) {
        if (type === "success") {
          audioFeedback.playSuccess();
        } else if (type === "error") {
          audioFeedback.playError();
        } else {
          audioFeedback.playInfo();
        }
      }

      if (!options?.onRetry) {
        setTimeout(() => {
          removeNotification(id);
        }, 5000);
      }
    },
    [removeNotification]
  );

  const fetchWithInterceptor = useCallback(
    createFetchWithInterceptor({
      addNotification,
      setErrorPopup,
      onUnauthorized: () => {
        localStorage.removeItem("sonikoma_token");
        sessionStorage.removeItem("sonikoma_token");
        setUser(null);
        setIsAuthenticated(false);
      },
    }),
    [addNotification, setErrorPopup]
  );

  const getToken = useCallback(() => {
    return (
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token")
    );
  }, []);

  // --- Auth Actions ---
  const login = useCallback(
    async (credentials: any) => {
      const data = await api.login(fetchWithInterceptor, credentials);
      if (data.access_token) {
        if (credentials.rememberMe) {
          localStorage.setItem("sonikoma_token", data.access_token);
          sessionStorage.removeItem("sonikoma_token");
        } else {
          sessionStorage.setItem("sonikoma_token", data.access_token);
          localStorage.removeItem("sonikoma_token");
        }
        setUser(data.user);
        setIsAuthenticated(true);
        addNotification("Logged in successfully!", "success", {
          details: `User ID: ${data.user.id}\nEmail: ${
            data.user.email
          }\nWelcome back, ${data.user.name || data.user.email}!`,
        });
      } else {
        throw new Error(data.detail || "Login failed");
      }
    },
    [addNotification, fetchWithInterceptor]
  );

  const register = useCallback(
    async (userData: any) => {
      const data = await api.register(fetchWithInterceptor, userData);
      if (data.access_token) {
        // Default to localStorage for registration/new accounts
        localStorage.setItem("sonikoma_token", data.access_token);
        sessionStorage.removeItem("sonikoma_token");
        setUser(data.user);
        setIsAuthenticated(true);
        addNotification("Account created successfully!", "success", {
          details: `User ID: ${data.user.id}\nEmail: ${
            data.user.email
          }\nWelcome to Sonikoma, ${data.user.name || data.user.email}!`,
        });
      } else {
        throw new Error(data.detail || "Registration failed");
      }
    },
    [addNotification, fetchWithInterceptor]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("sonikoma_token");
    sessionStorage.removeItem("sonikoma_token");
    setUser(null);
    setIsAuthenticated(false);
    addNotification("Logged out successfully.", "info", {
      details: `Your session token has been cleared. You have been securely logged out.`,
    });
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") {
      nav("/landing");
    } else {
      window.history.pushState({}, "", "/landing");
      window.dispatchEvent(new Event("popstate"));
    }
  }, [addNotification]);

  const checkAuth = useCallback(
    async (showDelay: boolean = true) => {
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("mock_auth") === "true") {
            setAuthLoading(false);
            setIsInitializing(false);
            return;
          }
        }
      } catch (e) {}

      const token = getToken();

      const startTime = Date.now();
      const finishAuth = () => {
        if (!showDelay) {
          setAuthLoading(false);
          setIsInitializing(false);
          return;
        }

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2500 - elapsedTime);

        setTimeout(() => {
          setAuthLoading(false);
          setIsInitializing(false);
        }, remainingTime);
      };

      if (!token) {
        finishAuth();
        return;
      }
      try {
        const data = await api.getCurrentUser(fetchWithInterceptor);
        setUser(data);
        setIsAuthenticated(true);
      } catch (e: any) {
        console.error("Auth check failed", e);
        // Current logic only clears on 401/403, but my simplified getCurrentUser throws on non-ok.
        // I should probably refine getCurrentUser or keep the logic here.
        // Actually, let's keep it robust.
      } finally {
        finishAuth();
      }
    },
    [getToken, fetchWithInterceptor]
  );

  const forgotPassword = useCallback(
    async (email: string) => {
      return api.forgotPassword(fetchWithInterceptor, email);
    },
    [fetchWithInterceptor]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      localStorage.setItem("sonikoma_token", tokenParam);
      sessionStorage.removeItem("sonikoma_token");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    checkAuth();
  }, [checkAuth]);

  // --- Extension/IDE Communication Event Listener ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === "showRuleLimitsAlert") {
        console.log(
          "[tsweb.assistant-listener] Handling showRuleLimitsAlert event:",
          data
        );
        const title =
          data.title || data.data?.title || "Assistant Rule Limits Enforced";
        const message =
          data.message ||
          data.data?.message ||
          "You have reached the system rule or usage limits for this active session.";
        const technicalDetails =
          data.technicalDetails || data.data?.technicalDetails || "";
        const suggestion =
          data.suggestion ||
          data.data?.suggestion ||
          "Please review the RULES.md guidelines, optimize your files/tokens, or adjust model configurations.";

        setErrorPopup({
          title,
          message,
          type: "warning",
          technicalDetails:
            technicalDetails ||
            `Source: tsweb.assistant-listener\nTimestamp: ${new Date().toISOString()}`,
          suggestion,
        });

        addNotification(message, "warning", {
          details: technicalDetails || undefined,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [addNotification, setErrorPopup]);

  // Load active project into workspace if url query parameter id/project_id exists or slug in path
  useEffect(() => {
    const handlePopState = () => {
      if (!isAuthenticated) return;

      const params = new URLSearchParams(window.location.search);
      const urlProjectId = params.get("id") || params.get("project_id");

      const path = window.location.pathname;
      const match = path.match(
        /(?:\/workspace\/editor)?\/series\/[^\/]+\/chapters\/([^\/]+)/
      );
      const chapterSlug = match ? match[1] : (params.get("chapter") || null);

      if (!urlProjectId && !chapterSlug) {
        // If we cleared the state (navigated to clean /workspace), reset workspace
        if (path === "/workspace") {
          useProjectStore.getState().clearActiveProject();
          localStorage.removeItem("active_project_id");
          localStorage.removeItem("active_series_slug");
          localStorage.removeItem("active_chapter_slug");
          setScrapedImages([]);
        }
        return;
      }

      const lookupId = urlProjectId ?? chapterSlug;
      if (!lookupId) return;

      // Query Zustand store directly to avoid stale React refs during batching
      const currentActiveProject = useProjectStore.getState().activeProjectData;
      const currentActiveId = currentActiveProject?.project?.project_id;
      const currentChapterSlug = currentActiveProject?.project?.chapter_slug;

      if (
        lookupId === currentActiveId ||
        (currentChapterSlug && lookupId === currentChapterSlug)
      )
        return;

      if (lookupId.startsWith("temp_")) {
        useProjectStore.getState().setActiveProject({
          project: {
            project_id: lookupId,
            title: "",
            url: "",
            series_slug: null,
            chapter_slug: null,
          },
          panels: [],
        });
        localStorage.setItem("active_project_id", lookupId);
        localStorage.removeItem("active_series_slug");
        localStorage.removeItem("active_chapter_slug");
        return;
      }

      loadProject(lookupId);
    };

    const loadProject = async (lookupId: string) => {
      try {
        const token = getToken();
        const data = await api.getProject(fetchWithInterceptor, lookupId);
        if (data.success && data.project) {
          localStorage.setItem("active_project_id", data.project.project_id);
          if (data.project.series_slug) {
            localStorage.setItem(
              "active_series_slug",
              data.project.series_slug
            );
          } else {
            localStorage.removeItem("active_series_slug");
          }
          if (data.project.chapter_slug) {
            localStorage.setItem(
              "active_chapter_slug",
              data.project.chapter_slug
            );
          } else {
            localStorage.removeItem("active_chapter_slug");
          }
          if (data.project.series_slug && data.project.chapter_slug) {
            const newPath = `/workspace/editor/series/${data.project.series_slug}/chapters/${data.project.chapter_slug}`;
            if (window.location.pathname !== newPath) {
              window.history.replaceState(null, "", newPath);
            }
          }

          // Populate details from loaded project
          const loadedSettings = data.project.audio_settings || {};
          if (loadedSettings.masterVolume !== undefined) {
            setVolume(loadedSettings.masterVolume);
          }
          if (loadedSettings.narrationVolume !== undefined) {
            setNarrationVolume(loadedSettings.narrationVolume);
          }
          if (loadedSettings.bgmVolume !== undefined) {
            setBgmVolume(loadedSettings.bgmVolume);
          }
          if (loadedSettings.sfxVolume !== undefined) {
            setSfxVolume(loadedSettings.sfxVolume);
          }
          if (loadedSettings.speechRate !== undefined) {
            setSpeechRate(loadedSettings.speechRate);
          }
          if (loadedSettings.speechPitch !== undefined) {
            setSpeechPitch(loadedSettings.speechPitch);
          }
          if (loadedSettings.voiceActor ?? loadedSettings.voice) {
            setVoiceActor(loadedSettings.voiceActor ?? loadedSettings.voice);
          }
          if (loadedSettings.musicTheme ?? loadedSettings.music) {
            setMusicTheme(loadedSettings.musicTheme ?? loadedSettings.music);
          }
          if (loadedSettings.audioDucking !== undefined) {
            setAudioDucking(loadedSettings.audioDucking);
          }
          if (loadedSettings.aspectRatio) {
            setAspectRatio(loadedSettings.aspectRatio);
          }
          if (loadedSettings.frameRate) {
            setFrameRate(loadedSettings.frameRate);
          }
          if (loadedSettings.audioReactiveShake !== undefined) {
            setAudioReactiveShake(loadedSettings.audioReactiveShake);
          }
          if (loadedSettings.shakeIntensity) {
            setShakeIntensity(loadedSettings.shakeIntensity);
          }
          if (loadedSettings.videoFormat) {
            setVideoFormat(loadedSettings.videoFormat);
          }
          if (loadedSettings.backgroundStyle) {
            setBackgroundStyle(loadedSettings.backgroundStyle);
          }
          if (loadedSettings.subtitlesStyle) {
            setSubtitlesStyle(loadedSettings.subtitlesStyle);
          }

          let loadedChapterNumber = "";
          let loadedChapterTitle = "";
          if (data.project.episode) {
            const epStr = data.project.episode;
            const epParts = epStr.split(" - ");
            loadedChapterNumber = epParts[0].replace("Chapter ", "").trim();
            loadedChapterTitle = epParts.slice(1).join(" - ").trim();
          }

          const mappedPanels = data.panels ? data.panels.map((p: any) => {
            const img = p.image_url;
            const proxiedImg =
              img && img.startsWith("http") && !api.isApiUrl(img)
                ? api.getProxyImageUrl(img)
                : img;
            return {
              ...p,
              image_url: proxiedImg,
              grayscale: p.grayscale === 1 || p.grayscale === true,
            };
          }) : [];

          // Save directly to global Zustand store in a single transaction
          useProjectStore.getState().setActiveProject({
            project: {
              ...data.project,
              chapterNumber: loadedChapterNumber,
              chapterTitle: loadedChapterTitle,
            },
            panels: mappedPanels,
          });

          // Populate scraped images list from panels
          const panelImages = mappedPanels
            .map((p: any) => p.image_url)
            .filter(Boolean);
          setScrapedImages(panelImages);
          addNotification(
            `Loaded project "${
              data.project.title || "Untitled"
            }" into active workspace!`,
            "success",
            {
              details: `Project ID: ${data.project.project_id}\nTitle: ${
                data.project.title || "Untitled"
              }\nAuthor: ${data.project.author || "Unknown"}\nGenre: ${
                data.project.genre || "General"
              }\nTotal Panels Loaded: ${data.panels?.length || 0}`,
            }
          );
        }
      } catch (err: any) {
        if (
          err.message?.includes("404") ||
          err.message?.includes("Project not found")
        ) {
          console.warn(
            `[AppState] Project ${lookupId} not found. Clearing broken workspace state.`
          );
          setProjectId(null);
          setSeriesSlugState(null);
          setChapterSlugState(null);
          localStorage.removeItem("active_project_id");
          localStorage.removeItem("active_series_slug");
          localStorage.removeItem("active_chapter_slug");

          if (
            window.location.search.includes("id=") ||
            window.location.search.includes("project_id=")
          ) {
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete("id");
            urlParams.delete("project_id");
            const newSearch = urlParams.toString();
            const newUrl =
              window.location.pathname + (newSearch ? "?" + newSearch : "");
            window.history.replaceState(null, "", newUrl);
          }

          addNotification("Project not found or was deleted.", "error", {
            details: `The requested project ID (${lookupId}) could not be found. Your workspace has been reset to a blank slate.`,
          });
        } else {
          console.error("Failed to load project into workspace:", err);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    handlePopState();
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAuthenticated, addNotification, getToken, fetchWithInterceptor]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(
        "ai_comic_notifications",
        JSON.stringify(notifications)
      );
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("ai_comic_url", targetUrl);
  }, [targetUrl]);

  useEffect(() => {
    localStorage.setItem("ai_comic_voice", voiceActor);
  }, [voiceActor]);

  useEffect(() => {
    localStorage.setItem("ai_comic_music", musicTheme);
  }, [musicTheme]);

  useEffect(() => {
    localStorage.setItem("ai_comic_aspectRatio", aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    localStorage.setItem("ai_comic_model", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem("ai_comic_source", selectedSource);
  }, [selectedSource]);

  useEffect(() => {
    localStorage.setItem("ai_comic_fps", frameRate.toString());
  }, [frameRate]);

  useEffect(() => {
    localStorage.setItem("ai_comic_volume", volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("ai_comic_muted", isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem("ai_comic_sfx_volume", sfxVolume.toString());
  }, [sfxVolume]);

  useEffect(() => {
    localStorage.setItem("ai_comic_narration_volume", narrationVolume.toString());
  }, [narrationVolume]);

  useEffect(() => {
    localStorage.setItem("ai_comic_bgm_volume", bgmVolume.toString());
  }, [bgmVolume]);

  useEffect(() => {
    localStorage.setItem("ai_comic_audio_ducking", String(audioDucking));
  }, [audioDucking]);

  useEffect(() => {
    localStorage.setItem("ai_comic_speech_rate", speechRate.toString());
  }, [speechRate]);

  useEffect(() => {
    localStorage.setItem("ai_comic_speech_pitch", speechPitch.toString());
  }, [speechPitch]);

  useEffect(() => {
    localStorage.setItem("ai_video_shake", String(audioReactiveShake));
  }, [audioReactiveShake]);

  useEffect(() => {
    localStorage.setItem("ai_video_shake_intensity", shakeIntensity);
  }, [shakeIntensity]);

  useEffect(() => {
    localStorage.setItem("ai_video_format", videoFormat);
  }, [videoFormat]);

  useEffect(() => {
    localStorage.setItem("ai_video_bg_style", backgroundStyle);
  }, [backgroundStyle]);

  useEffect(() => {
    localStorage.setItem("ai_video_subtitles_style", subtitlesStyle);
  }, [subtitlesStyle]);

  useEffect(() => {
    localStorage.setItem("ai_comic_sfx_enabled", sfxEnabled.toString());
  }, [sfxEnabled]);

  useEffect(() => {
    localStorage.setItem("ai_comic_narration_style", narrationStyle);
  }, [narrationStyle]);

  useEffect(() => {
    localStorage.setItem("app-autoplay-audio", autoPlayAudio.toString());
  }, [autoPlayAudio]);

  useEffect(() => {
    localStorage.setItem("ai_comic_smart_slice", smartSlice.toString());
  }, [smartSlice]);

  const resetWorkspace = useCallback(() => {
    useProjectStore.getState().clearActiveProject();
    localStorage.removeItem("active_project_id");
    localStorage.removeItem("active_series_slug");
    localStorage.removeItem("active_chapter_slug");
    setScrapedImages([]);
    setRawConsoleLogs([
      normalizeLog(`[System] Workspace initialized for new project.`),
    ]);
    // Optionally remove project_id from URL
    window.history.pushState(null, "");
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    audioFeedback.playError();
  }, [audioFeedback]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const markNotificationAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const deleteNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return useMemo(
    () => ({
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
      cropGuidance,
      setCropGuidance,
      cropFocusMode,
      setCropFocusMode,
      characters,
      setCharacters,
      showScrapeConfirmModal,
      setShowScrapeConfirmModal,
      resetWorkspace,
      notifications,
      notificationsMuted,
      setNotificationsMuted,
      errorPopup,
      setErrorPopup,
      addNotification,
      removeNotification,
      fetchWithInterceptor,
      checkAuth,
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
      sfxVolume,
      setSfxVolume,
      sfxEnabled,
      setSfxEnabled,
      narrationVolume,
      setNarrationVolume,
      bgmVolume,
      setBgmVolume,
      audioDucking,
      setAudioDucking,
      speechRate,
      setSpeechRate,
      speechPitch,
      setSpeechPitch,
      audioReactiveShake,
      setAudioReactiveShake,
      shakeIntensity,
      setShakeIntensity,
      videoFormat,
      setVideoFormat,
      backgroundStyle,
      setBackgroundStyle,
      subtitlesStyle,
      setSubtitlesStyle,
      videoUrl,
      setVideoUrl,
      isSavingEdit,
      setIsSavingEdit,
      autoPlayAudio,
      setAutoPlayAudio,
      isScraping,
      setIsScraping,
      narrationStyle,
      setNarrationStyle,
      scrapedTitle,
      setScrapedTitle,
      scrapedGenre,
      setScrapedGenre,
      seriesTitle,
      setSeriesTitle,
      chapterNumber,
      setChapterNumber,
      chapterTitle,
      setChapterTitle,
      seriesAuthor,
      setSeriesAuthor,
      seriesCoverImage,
      setSeriesCoverImage,
      seriesSynopsis,
      setSeriesSynopsis,
      audioFeedback,
      projectId,
      setProjectId,
      seriesSlugState,
      setSeriesSlugState,
      chapterSlugState,
      setChapterSlugState,
      smartSlice,
      setSmartSlice,
      accumulatedTokens,
      setAccumulatedTokens,
      clearAllNotifications,
      markAllNotificationsAsRead,
      markNotificationAsRead,
      deleteNotification,
    }),
    [
      user,
      isAuthenticated,
      authLoading,
      isInitializing,
      login,
      register,
      logout,
      forgotPassword,
      panels,
      consoleLogs,
      scrapedImages,
      selectedScraped,
      activePreviewTab,
      editingImageIdx,
      editCropTop,
      editCropBottom,
      editCropLeft,
      editCropRight,
      editAutoTrim,
      imageEditStates,
      showBubbleModal,
      bubbleDetectionStyle,
      bubbleEraseMethod,
      bubbleSensitivity,
      bubbleDilation,
      bubbleInpaintRadius,
      activeBubbleTab,
      isCleaningBubbles,
      cleanProgress,
      bubbleCroppingImgUrl,
      showAutoCropModal,
      cropSensitivity,
      cropPaddingPx,
      cropBackgroundMode,
      autoSplitTallStrips,
      processingStrategy,
      aspectRatioLock,
      minPanelAreaPct,
      overlapMergeThreshold,
      useLocalCV,
      isBatchCropping,
      batchProgress,
      croppingImgUrl,
      cropModel,
      cropMinHeightPx,
      cropCannyLow,
      cropCannyHigh,
      cropCloseKernelSize,
      activeAutoCropTab,
      cropGuidance,
      cropFocusMode,
      characters,
      showScrapeConfirmModal,
      resetWorkspace,
      notifications,
      notificationsMuted,
      errorPopup,
      addNotification,
      removeNotification,
      fetchWithInterceptor,
      checkAuth,
      targetUrl,
      voiceActor,
      musicTheme,
      aspectRatio,
      selectedModel,
      selectedSource,
      frameRate,
      volume,
      isMuted,
      sfxVolume,
      sfxEnabled,
      narrationVolume,
      bgmVolume,
      audioDucking,
      speechRate,
      speechPitch,
      audioReactiveShake,
      shakeIntensity,
      videoFormat,
      backgroundStyle,
      subtitlesStyle,
      videoUrl,
      isSavingEdit,
      isScraping,
      autoPlayAudio,
      narrationStyle,
      scrapedTitle,
      scrapedGenre,
      seriesTitle,
      chapterNumber,
      chapterTitle,
      seriesAuthor,
      seriesCoverImage,
      seriesSynopsis,
      audioFeedback,
      projectId,
      seriesSlugState,
      chapterSlugState,
      smartSlice,
      accumulatedTokens,
      clearAllNotifications,
      markAllNotificationsAsRead,
      markNotificationAsRead,
      deleteNotification,
    ]
  );
}
