import { useState, useCallback, useEffect, useRef } from "react";
import { GeneratedPanel } from "../types";
import { AI_MODELS } from "../models";
import { createFetchWithInterceptor } from "../api/fetchWithInterceptor";
import {
  Notification,
  NotificationType,
} from "../components/NotificationStack";
import { ErrorPopupDetail } from "../components/ErrorPopupModal";
import { parseWebtoonUrl } from "../utils/url";

export function useAppState() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const [panels, setPanels] = useState<GeneratedPanel[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [seriesSlugState, setSeriesSlugState] = useState<string | null>(null);
  const [chapterSlugState, setChapterSlugState] = useState<string | null>(null);
  const [consoleLogs, setRawConsoleLogs] = useState<string[]>([]);

  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const chapterSlugStateRef = useRef(chapterSlugState);
  chapterSlugStateRef.current = chapterSlugState;

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

  const setConsoleLogs = useCallback((val: React.SetStateAction<string[]>) => {
    setRawConsoleLogs((prev) => {
      const resolved = typeof val === "function" ? val(prev) : val;
      const capped = resolved.slice(-250);
      return capped.map((log) => {
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
        if (
          log.includes("[ERROR]") ||
          log.includes("[FATAL]") ||
          log.toLowerCase().includes("failed")
        ) {
          level = "ERROR";
        } else if (log.includes("[WARNING]") || log.includes("[WARN]")) {
          level = "WARN";
        } else if (
          log.includes("[SUCCESS]") ||
          log.toLowerCase().includes("successfully")
        ) {
          level = "SUCCESS";
        } else if (log.includes("[AI") || log.includes("[Gemini]")) {
          level = "AI";
        } else if (log.includes("[Database]") || log.includes("[DB]")) {
          level = "DATABASE";
        } else if (log.includes("[API]") || log.includes("[HTTP]")) {
          level = "API";
        }

        // Parse brackets like [Scraper] Spawned... or [GUI] Mounted...
        const bracketMatch = log.match(
          /^\[([^\]]+)\]\s*(?:\[([^\]]+)\])?\s*(.*)$/
        );
        if (bracketMatch) {
          const firstTag = bracketMatch[1];
          const secondTag = bracketMatch[2];
          const rest = bracketMatch[3];

          if (
            secondTag &&
            [
              "INFO",
              "DEBUG",
              "WARN",
              "WARNING",
              "ERROR",
              "SUCCESS",
              "FATAL",
            ].includes(secondTag.toUpperCase())
          ) {
            level = secondTag.toUpperCase();
            filename = firstTag;
            message = rest;
          } else {
            if (
              [
                "INFO",
                "DEBUG",
                "WARN",
                "WARNING",
                "ERROR",
                "SUCCESS",
                "FATAL",
              ].includes(firstTag.toUpperCase())
            ) {
              level = firstTag.toUpperCase();
              filename = "App.tsx";
            } else {
              filename = firstTag;
            }
            message = rest;
          }
        }

        const timestamp = new Date().toLocaleTimeString("en-US", {
          hour12: false,
        });
        return `${timestamp} [${category}] [${level}] [${filename}] ${message}`;
      });
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

      // Play soft chime sound if not muted
      const isNotificationMuted =
        localStorage.getItem("ai_comic_notifications_muted") === "true";
      if (!isNotificationMuted) {
        try {
          const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const playTone = (
              freq: number,
              start: number,
              duration: number
            ) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, start);
              gain.gain.setValueAtTime(0, start);
              gain.gain.linearRampToValueAtTime(0.08, start + 0.04);
              gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(start);
              osc.stop(start + duration);
            };
            const now = ctx.currentTime;
            playTone(587.33, now, 0.25); // D5
            playTone(880.0, now + 0.08, 0.35); // A5
          }
        } catch (err) {
          console.warn("Failed to play notification sound:", err);
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
        localStorage.removeItem("anivox_token");
        sessionStorage.removeItem("anivox_token");
        setUser(null);
        setIsAuthenticated(false);
      },
    }),
    [addNotification, setErrorPopup]
  );

  const getToken = useCallback(() => {
    return (
      localStorage.getItem("anivox_token") ||
      sessionStorage.getItem("anivox_token")
    );
  }, []);

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
        if (credentials.rememberMe) {
          localStorage.setItem("anivox_token", data.access_token);
          sessionStorage.removeItem("anivox_token");
        } else {
          sessionStorage.setItem("anivox_token", data.access_token);
          localStorage.removeItem("anivox_token");
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
      const res = await fetchWithInterceptor("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data.access_token) {
        // Default to localStorage for registration/new accounts
        localStorage.setItem("anivox_token", data.access_token);
        sessionStorage.removeItem("anivox_token");
        setUser(data.user);
        setIsAuthenticated(true);
        addNotification("Account created successfully!", "success", {
          details: `User ID: ${data.user.id}\nEmail: ${
            data.user.email
          }\nWelcome to Anivox, ${data.user.name || data.user.email}!`,
        });
      } else {
        throw new Error(data.detail || "Registration failed");
      }
    },
    [addNotification, fetchWithInterceptor]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("anivox_token");
    sessionStorage.removeItem("anivox_token");
    setUser(null);
    setIsAuthenticated(false);
    addNotification("Logged out successfully.", "info", {
      details: `Your session token has been cleared. You have been securely logged out.`,
    });
    (window as any).navigateTo?.("/landing");
  }, [addNotification]);

  const checkAuth = useCallback(
    async (showDelay: boolean = true) => {
      const token = getToken();

      // Artificial delay to show the fancy loading screen
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const start = Date.now();

      if (!token) {
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
          // Only clear token on 401 Unauthorized or 403 Forbidden.
          // Server offline or gateway errors (500, 502, 503, 504) should not clear the token.
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("anivox_token");
            sessionStorage.removeItem("anivox_token");
          }
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setAuthLoading(false);
        setIsInitializing(false);
      }
    },
    [getToken]
  );

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
      const match = path.match(/\/series\/[^\/]+\/chapters\/([^\/]+)/);
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

      const lookupId = urlProjectId || chapterSlug;
      if (
        lookupId === projectIdRef.current ||
        lookupId === chapterSlugStateRef.current
      )
        return;

      loadProject(lookupId);
    };

    const loadProject = async (lookupId: string) => {
      try {
        const token = getToken();
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/projects/${lookupId}`, { headers });
        if (res.ok) {
          const data = await res.json();
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
              const suffix = window.location.pathname.endsWith("/details")
                ? "/details"
                : "";
              const isEditor =
                window.location.pathname.startsWith("/editor") ||
                window.location.pathname === "/project-editor";
              if (!isEditor) {
                const newPath = `/series/${data.project.series_slug}/chapters/${data.project.chapter_slug}${suffix}`;
                if (window.location.pathname !== newPath) {
                  window.history.replaceState(null, "", newPath);
                }
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
                  img && img.startsWith("http") && !img.includes("/api/")
                    ? `/api/proxy-image?url=${encodeURIComponent(img)}`
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
        }
      } catch (err) {
        console.error("Failed to load project into workspace:", err);
      }
    };

    window.addEventListener("popstate", handlePopState);
    handlePopState();
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAuthenticated, addNotification, getToken]);

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
    localStorage.setItem("ai_comic_smart_slice", smartSlice.toString());
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
    smartSlice,
  ]);

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
    setRawConsoleLogs(["[System] Workspace initialized for new project."]);
    // Optionally remove project_id from URL
    window.history.pushState(null, "", "/workspace");
  }, []);

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
    cropGuidance,
    setCropGuidance,
    cropFocusMode,
    setCropFocusMode,
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
    projectId,
    setProjectId,
    seriesSlugState,
    setSeriesSlugState,
    chapterSlugState,
    setChapterSlugState,
    smartSlice,
    setSmartSlice,
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
