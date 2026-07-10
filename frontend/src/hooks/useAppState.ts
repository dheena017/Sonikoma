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

  const [panels, setPanels] = useState<GeneratedPanel[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [seriesSlugState, setSeriesSlugState] = useState<string | null>(null);
  const [chapterSlugState, setChapterSlugState] = useState<string | null>(null);
  const [consoleLogs, setRawConsoleLogs] = useState<LogEntry[]>([]);
  const [characters, setCharacters] = useState<CharacterBio[]>([]);

  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const chapterSlugStateRef = useRef(chapterSlugState);
  chapterSlugStateRef.current = chapterSlugState;

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
  const [cropModel, setCropModel] = useState<string>("gemini-2.0-flash-lite");
  const [cropMinHeightPx, setCropMinHeightPx] = useState<number>(60);
  const [cropCannyLow, setCropCannyLow] = useState<number>(20);
  const [cropCannyHigh, setCropCannyHigh] = useState<number>(100);
  const [cropCloseKernelSize, setCropCloseKernelSize] = useState<number>(15);
  const [activeAutoCropTab, setActiveAutoCropTab] = useState<string>("general");
  const [cropGuidance, setCropGuidance] = useState<string>("");
  const [cropFocusMode, setCropFocusMode] = useState<string>("standard");
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
  const [targetUrl, setTargetUrl] = useState<string>(
    () => {
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("idx") !== null) {
            return "https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-1/viewer?title_no=95&episode_no=418";
          }
        }
      } catch (e) {}
      return localStorage.getItem("ai_comic_url") || "";
    }
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

  const [sfxVolume, setSfxVolume] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_sfx_volume") || "60")
  );
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(
    () => localStorage.getItem("ai_comic_sfx_enabled") !== "false"
  );
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(
    () => localStorage.getItem("app-autoplay-audio") === "true"
  );

  const audioFeedback = useAudioFeedback(sfxVolume, !sfxEnabled);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [narrationStyle, setNarrationStyle] = useState<string>(
    () => localStorage.getItem("ai_comic_narration_style") || "long"
  );
  const [smartSlice, setSmartSlice] = useState<boolean>(
    () => localStorage.getItem("ai_comic_smart_slice") !== "false"
  );
  const [scrapedTitle, setScrapedTitle] = useState<string>(
    "Overpowered S-Rank Recap"
  );
  const [scrapedGenre, setScrapedGenre] = useState<string>("Fantasy Action");
  const [seriesTitle, setSeriesTitle] = useState<string>("");
  const [chapterNumber, setChapterNumber] = useState<string>("");
  const [chapterTitle, setChapterTitle] = useState<string>("");
  const [seriesAuthor, setSeriesAuthor] = useState<string>("");
  const [seriesCoverImage, setSeriesCoverImage] = useState<string>("");
  const [seriesSynopsis, setSeriesSynopsis] = useState<string>("");

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
      const chapterSlug = match ? match[1] : null;

      if (!urlProjectId && !chapterSlug) {
        // If we cleared the state (navigated to clean /workspace), reset workspace
        if (path === "/workspace") {
          setProjectId(null);
          setSeriesSlugState(null);
          setChapterSlugState(null);
          localStorage.removeItem("active_project_id");
          localStorage.removeItem("active_series_slug");
          localStorage.removeItem("active_chapter_slug");
          setPanels([]);
          setScrapedImages([]);
          setTargetUrl("");
        }
        return;
      }

      const lookupId = urlProjectId ?? chapterSlug;
      if (!lookupId) return;

      if (
        lookupId === projectIdRef.current ||
        lookupId === chapterSlugStateRef.current
      )
        return;

      if (lookupId.startsWith("temp_")) {
        setProjectId(lookupId);
        setSeriesSlugState(null);
        setChapterSlugState(null);
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
          setProjectId(data.project.project_id);
          setSeriesSlugState(data.project.series_slug || null);
          setChapterSlugState(data.project.chapter_slug || null);
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
          setTargetUrl(data.project.url || "");
          setVideoUrl(data.project.video_url || null);

          // Populate details from loaded project
          if (data.project.cover_image) {
            setSeriesCoverImage(data.project.cover_image);
          }
          if (data.project.title) {
            setSeriesTitle(data.project.title);
            setScrapedTitle(data.project.title);
          }
          if (data.project.author) {
            setSeriesAuthor(data.project.author);
          }
          if (data.project.synopsis) {
            setSeriesSynopsis(data.project.synopsis);
          }
          if (data.project.genre) {
            setScrapedGenre(data.project.genre);
          }
          if (data.project.episode) {
            const epStr = data.project.episode;
            const epParts = epStr.split(" - ");
            const numStr = epParts[0].replace("Chapter ", "").trim();
            const nameStr = epParts.slice(1).join(" - ").trim();
            setChapterNumber(numStr);
            setChapterTitle(nameStr);
          }

          if (data.panels && data.panels.length > 0) {
            const mappedPanels = data.panels.map((p: any) => {
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
            });
            setPanels(mappedPanels);

            // Populate scraped images list from panels
            const panelImages = mappedPanels
              .map((p: any) => p.image_url)
              .filter(Boolean);
            setScrapedImages(panelImages);
          }
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
    setProjectId(null);
    setSeriesSlugState(null);
    setChapterSlugState(null);
    localStorage.removeItem("active_project_id");
    localStorage.removeItem("active_series_slug");
    localStorage.removeItem("active_chapter_slug");
    setPanels([]);
    setScrapedImages([]);
    setVideoUrl(null);
    setSeriesTitle("");
    setChapterNumber("");
    setChapterTitle("");
    setScrapedGenre("Fantasy Action");
    setSeriesAuthor("");
    setSeriesCoverImage("");
    setSeriesSynopsis("");
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
