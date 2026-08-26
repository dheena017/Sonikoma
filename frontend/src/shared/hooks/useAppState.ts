import { useState, useCallback, useMemo, useEffect } from "react";
import { GeneratedPanel, CharacterBio } from "@/types";
import { createFetchWithInterceptor } from "@/api/client/fetchWithInterceptor";
import * as api from "@/api";
import { useProjectStore, WorkspaceContext } from "./useProjectStore";
import { useAppAuth } from "./useAppAuth";
import { useAppNotifications } from "./useAppNotifications";
import { useAppAutoCrop } from "./useAppAutoCrop";
import { useAppBubbleCleaner } from "./useAppBubbleCleaner";
import { useAppLogs } from "./useAppLogs";
import { useAppEditorSettings } from "./useAppEditorSettings";
import { useAppScraperState } from "./useAppScraperState";

export function useAppState() {
  // ── 1. Domain Sub-Hooks ───────────────────────────────────────────────────
  const auth = useAppAuth();
  const notifs = useAppNotifications();
  const autoCrop = useAppAutoCrop();
  const bubbleCleaner = useAppBubbleCleaner();
  const logs = useAppLogs();
  const settings = useAppEditorSettings();
  const scraper = useAppScraperState();

  // ── 2. Active Project from Zustand Store ──────────────────────────────────
  const activeProjectData = useProjectStore((state) => state.activeProjectData);

  const panels = useMemo<GeneratedPanel[]>(
    () => (activeProjectData?.panels as unknown as GeneratedPanel[]) ?? [],
    [activeProjectData]
  );

  const scrapedImages = useMemo<string[]>(
    () => activeProjectData?.scrapedImages ?? scraper.scrapedImages ?? [],
    [activeProjectData?.scrapedImages, scraper.scrapedImages]
  );

  const setScrapedImages = useCallback(
    (val: string[] | ((prev: string[]) => string[])) => {
      const cur = useProjectStore.getState().activeProjectData;
      const currentImgs = cur?.scrapedImages ?? scraper.scrapedImages ?? [];
      const nextImgs = typeof val === "function" ? val(currentImgs) : val;

      scraper.setScrapedImages(nextImgs);

      if (cur) {
        useProjectStore.getState().setActiveProject({
          ...cur,
          scrapedImages: nextImgs,
        });
      }
    },
    [scraper]
  );

  const setPanels = useCallback(
    (val: GeneratedPanel[] | ((prev: GeneratedPanel[]) => GeneratedPanel[])) => {
      const cur = useProjectStore.getState().activeProjectData;
      const currentPanels = (cur?.panels as unknown as GeneratedPanel[]) ?? [];
      const nextPanels = typeof val === "function" ? val(currentPanels) : val;
      useProjectStore.getState().setActiveProject({
        project: cur?.project ?? { project_id: "", title: "", url: "" },
        panels: nextPanels as any,
        scrapedImages: cur?.scrapedImages ?? scraper.scrapedImages ?? [],
      });
    },
    [scraper.scrapedImages]
  );

  const projectId = activeProjectData?.project?.project_id ?? null;
  const jobId = activeProjectData?.project?.job_id ?? null;

  const setProjectId = useCallback((val: string | null) => {
    const cur = useProjectStore.getState().activeProjectData;
    if (!val) {
      useProjectStore.getState().clearActiveProject();
      return;
    }
    const projectChanged = cur?.project?.project_id !== val;
    useProjectStore.getState().setActiveProject({
      project: {
        ...(cur?.project ?? { title: "", url: "" }),
        project_id: val,
        job_id: projectChanged ? null : cur?.project?.job_id ?? null,
      },
      panels: projectChanged ? [] : cur?.panels ?? [],
      scrapedImages: projectChanged ? [] : cur?.scrapedImages ?? [],
    });
  }, []);

  const setJobId = useCallback((val: string | null) => {
    const cur = useProjectStore.getState().activeProjectData;
    if (!cur) return;
    useProjectStore.getState().setActiveProject({
      ...cur,
      project: { ...cur.project, job_id: val },
    });
  }, []);

  const setWorkspaceContext = useCallback((ctx: WorkspaceContext) => {
    useProjectStore.getState().setWorkspaceContext(ctx);
  }, []);

  const workspaceContext = useMemo<WorkspaceContext>(
    () => ({ projectId, jobId }),
    [projectId, jobId]
  );

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

  // ── 3. Additional Local Canvas & Editing States ───────────────────────────
  const [characters, setCharacters] = useState<CharacterBio[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<"video" | "timeline">("timeline");
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
  const [editCropTop, setEditCropTop] = useState<number>(0);
  const [editCropBottom, setEditCropBottom] = useState<number>(0);
  const [editCropLeft, setEditCropLeft] = useState<number>(0);
  const [editCropRight, setEditCropRight] = useState<number>(0);
  const [editAutoTrim, setEditAutoTrim] = useState<boolean>(true);
  const [imageEditStates, setImageEditStates] = useState<Record<string, any>>({});
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // ── 4. Project Fields Direct Setters ──────────────────────────────────────
  const targetUrl = activeProjectData?.project?.url || "";
  const setTargetUrl = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", title: "" }), url: val },
      panels: cur?.panels ?? [],
      scrapedImages: cur?.scrapedImages ?? [],
    });
  }, []);

  const scrapedTitle = activeProjectData?.project?.title || "Overpowered S-Rank Recap";
  const setScrapedTitle = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", url: "" }), title: val },
      panels: cur?.panels ?? [],
      scrapedImages: cur?.scrapedImages ?? [],
    });
  }, []);

  const scrapedGenre = activeProjectData?.project?.genre ?? "Fantasy Action";
  const setScrapedGenre = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: {
        ...(cur?.project ?? { project_id: "", title: "", url: "" }),
        genre: val,
      },
      panels: cur?.panels ?? [],
      scrapedImages: cur?.scrapedImages ?? [],
    });
  }, []);

  const seriesTitle = activeProjectData?.project?.title ?? "";
  const setSeriesTitle = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: { ...(cur?.project ?? { project_id: "", url: "" }), title: val },
      panels: cur?.panels ?? [],
      scrapedImages: cur?.scrapedImages ?? [],
    });
  }, []);

  const chapterNumber = activeProjectData?.project?.chapterNumber ?? "";
  const setChapterNumber = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: {
        ...(cur?.project ?? { project_id: "", title: "", url: "" }),
        chapterNumber: val,
      },
      panels: cur?.panels ?? [],
      scrapedImages: cur?.scrapedImages ?? [],
    });
  }, []);

  const chapterTitle = activeProjectData?.project?.chapterTitle ?? "";
  const setChapterTitle = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: {
        ...(cur?.project ?? { project_id: "", title: "", url: "" }),
        chapterTitle: val,
      },
      panels: cur?.panels ?? [],
      scrapedImages: cur?.scrapedImages ?? [],
    });
  }, []);

  const seriesAuthor = activeProjectData?.project?.author ?? "";
  const setSeriesAuthor = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: {
        ...(cur?.project ?? { project_id: "", title: "", url: "" }),
        author: val,
      },
      panels: cur?.panels ?? [],
      scrapedImages: cur?.scrapedImages ?? [],
    });
  }, []);

  const seriesCoverImage = activeProjectData?.project?.cover_image ?? "";
  const setSeriesCoverImage = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: {
        ...(cur?.project ?? { project_id: "", title: "", url: "" }),
        cover_image: val,
      },
      panels: cur?.panels ?? [],
      scrapedImages: cur?.scrapedImages ?? [],
    });
  }, []);

  const seriesSynopsis = activeProjectData?.project?.synopsis ?? "";
  const setSeriesSynopsis = useCallback((val: string) => {
    const cur = useProjectStore.getState().activeProjectData;
    useProjectStore.getState().setActiveProject({
      project: {
        ...(cur?.project ?? { project_id: "", title: "", url: "" }),
        synopsis: val,
      },
      panels: cur?.panels ?? [],
      scrapedImages: cur?.scrapedImages ?? [],
    });
  }, []);

  const videoUrl = activeProjectData?.project?.video_url ?? null;
  const setVideoUrl = useCallback((val: string | null) => {
    const cur = useProjectStore.getState().activeProjectData;
    if (!cur) return;
    useProjectStore.getState().setActiveProject({
      ...cur,
      project: { ...cur.project, video_url: val },
    });
  }, []);

  // ── 5. Auth API Methods ───────────────────────────────────────────────────
  const {
    setUser,
    setIsAuthenticated,
    setAuthLoading,
    setIsInitializing,
    handleLogout,
    handleLoginSuccess,
  } = auth;

  const fetchWithInterceptor = useMemo(
    () =>
      createFetchWithInterceptor({
        addNotification: notifs.addNotification,
        setErrorPopup: notifs.setErrorModalDetail,
        onUnauthorized: handleLogout,
      }),
    [notifs.addNotification, notifs.setErrorModalDetail, handleLogout]
  );

  const checkAuth = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");
        if (urlToken) {
          localStorage.setItem("sonikoma_token", urlToken);
          params.delete("token");
          const newSearch = params.toString() ? `?${params.toString()}` : "";
          window.history.replaceState({}, "", `${window.location.pathname}${newSearch}`);
        }
      }

      const res = await api.getCurrentUser(fetchWithInterceptor);
      const user =
        (res as any)?.user ||
        (res as any)?.data?.user ||
        (res as any)?.data ||
        res;
      if (user && (user.email || user.user_id || user.id)) {
        setUser(user);
        setIsAuthenticated(true);
      } else {
        try {
          const sessionRes = await fetch("/api/auth/google/session");
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData.access_token) {
              handleLoginSuccess(sessionData.access_token, sessionData.user);
              return;
            }
          }
        } catch {}

        const hasLocalToken = Boolean(
          typeof window !== "undefined" &&
          (localStorage.getItem("sonikoma_token") || sessionStorage.getItem("sonikoma_token"))
        );
        if (!hasLocalToken) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch {
      try {
        const sessionRes = await fetch("/api/auth/google/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.access_token) {
            handleLoginSuccess(sessionData.access_token, sessionData.user);
            return;
          }
        }
      } catch {}

      const hasLocalToken = Boolean(
        typeof window !== "undefined" &&
        (localStorage.getItem("sonikoma_token") || sessionStorage.getItem("sonikoma_token"))
      );
      if (!hasLocalToken) {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setAuthLoading(false);
      setIsInitializing(false);
    }
  }, [
    setUser,
    setIsAuthenticated,
    setAuthLoading,
    setIsInitializing,
    handleLoginSuccess,
    fetchWithInterceptor,
  ]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (credentials: any) => {
      auth.setAuthLoading(true);
      try {
        const res = await api.login(fetchWithInterceptor, credentials);
        const token =
          (res as any)?.access_token ||
          (res as any)?.token ||
          (res as any)?.data?.access_token ||
          (res as any)?.data?.token;
        const user =
          (res as any)?.user ||
          (res as any)?.data?.user ||
          (res as any)?.data;
        if (token) {
          auth.handleLoginSuccess(token, user);
          notifs.addNotification("Successfully logged in!", "success");
          return res;
        }
        throw new Error(
          (res as any)?.message ||
            (res as any)?.detail ||
            "Invalid email or password. Please try again."
        );
      } catch (err: any) {
        notifs.addNotification(err?.message || "Login failed", "error");
        throw err;
      } finally {
        auth.setAuthLoading(false);
      }
    },
    [auth, notifs, fetchWithInterceptor]
  );

  const register = useCallback(
    async (data: any) => {
      auth.setAuthLoading(true);
      try {
        const res = await api.register(fetchWithInterceptor, data);
        const token =
          (res as any)?.access_token ||
          (res as any)?.token ||
          (res as any)?.data?.access_token ||
          (res as any)?.data?.token;
        const user =
          (res as any)?.user ||
          (res as any)?.data?.user ||
          (res as any)?.data;
        if (token) {
          auth.handleLoginSuccess(token, user);
          notifs.addNotification("Account created successfully!", "success");
          return res;
        }
        throw new Error(
          (res as any)?.message ||
            (res as any)?.detail ||
            "Registration failed. Please try again."
        );
      } catch (err: any) {
        notifs.addNotification(err?.message || "Registration failed", "error");
        throw err;
      } finally {
        auth.setAuthLoading(false);
      }
    },
    [auth, notifs, fetchWithInterceptor]
  );

  const logout = useCallback(async () => {
    auth.handleLogout();
    notifs.addNotification("Logged out", "info");
  }, [auth, notifs]);

  const forgotPassword = useCallback(
    async (email: string) => {
      try {
        const res = await api.forgotPassword(fetchWithInterceptor, email);
        notifs.addNotification("Password reset email sent", "info");
        return res;
      } catch (err: any) {
        notifs.addNotification(err?.message || "Password reset failed", "error");
        throw err;
      }
    },
    [notifs, fetchWithInterceptor]
  );

  const resetWorkspace = useCallback(() => {
    useProjectStore.getState().clearActiveProject();
    scraper.setScrapedImages([]);
    scraper.setSelectedScraped([]);
    notifs.addNotification("Workspace cleared", "info");
  }, [scraper, notifs]);

  // ── 6. Full Backwards-Compatible Memoized Export ──────────────────────────
  return useMemo(
    () => ({
      // Auth
      user: auth.user,
      setUser: auth.setUser,
      isAuthenticated: auth.isAuthenticated,
      setIsAuthenticated: auth.setIsAuthenticated,
      authLoading: auth.authLoading,
      isInitializing: auth.isInitializing,
      login,
      register,
      logout,
      forgotPassword,
      checkAuth,
      fetchWithInterceptor,

      // Project & Workspace
      panels,
      setPanels,
      projectId,
      jobId,
      setProjectId,
      setJobId,
      setWorkspaceContext,
      workspaceContext,
      seriesSlugState,
      setSeriesSlugState,
      chapterSlugState,
      setChapterSlugState,
      resetWorkspace,

      // Scraper
      scrapedImages,
      setScrapedImages,
      selectedScraped: scraper.selectedScraped,
      setSelectedScraped: scraper.setSelectedScraped,
      isScraping: scraper.isScraping,
      setIsScraping: scraper.setIsScraping,
      showScrapeConfirmModal: scraper.showScrapeConfirmModal,
      setShowScrapeConfirmModal: scraper.setShowScrapeConfirmModal,
      accumulatedTokens: scraper.accumulatedTokens,
      setAccumulatedTokens: scraper.setAccumulatedTokens,

      // Project Metadata Direct Fields
      targetUrl,
      setTargetUrl,
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
      videoUrl,
      setVideoUrl,

      // Editor Settings
      ...settings,

      // AutoCrop
      ...autoCrop,

      // Bubble Cleaner
      ...bubbleCleaner,

      // Logs
      consoleLogs: logs.consoleLogs,
      setRawConsoleLogs: logs.setRawConsoleLogs,
      setConsoleLogs: logs.addConsoleLog,

      // Notifications
      notifications: notifs.notifications,
      setNotifications: notifs.setNotifications,
      notificationsMuted: notifs.notificationsMuted,
      setNotificationsMuted: notifs.setNotificationsMuted,
      addNotification: notifs.addNotification,
      removeNotification: notifs.dismissNotification,
      dismissNotification: notifs.dismissNotification,
      markNotificationAsRead: notifs.markNotificationAsRead,
      deleteNotification: notifs.deleteNotification,
      clearAllNotifications: notifs.clearAllNotifications,
      markAllNotificationsAsRead: notifs.markAllNotificationsAsRead,
      errorPopup: notifs.errorModalDetail,
      setErrorPopup: notifs.setErrorModalDetail,
      audioFeedback: notifs.audioFeedback,

      // Canvas / Editor State
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
      isSavingEdit,
      setIsSavingEdit,
      characters,
      setCharacters,
    }),
    [
      auth,
      notifs,
      autoCrop,
      bubbleCleaner,
      logs,
      settings,
      scraper,
      panels,
      projectId,
      jobId,
      workspaceContext,
      seriesSlugState,
      chapterSlugState,
      targetUrl,
      scrapedTitle,
      scrapedGenre,
      seriesTitle,
      chapterNumber,
      chapterTitle,
      seriesAuthor,
      seriesCoverImage,
      seriesSynopsis,
      videoUrl,
      activePreviewTab,
      editingImageIdx,
      editCropTop,
      editCropBottom,
      editCropLeft,
      editCropRight,
      editAutoTrim,
      imageEditStates,
      isSavingEdit,
      characters,
      login,
      register,
      logout,
      forgotPassword,
      checkAuth,
      fetchWithInterceptor,
      resetWorkspace,
    ]
  );
}
