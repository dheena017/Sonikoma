import React, { useState, useEffect, useCallback, useRef } from "react";

export interface UseAppRouterProps {
  scrapedImages?: string[];
  panels?: any[];
  editingImageIdx?: number | null;
  setEditingImageIdx?: (idx: number | null) => void;
  setShowAutoCropModal?: (v: boolean) => void;
  setShowBubbleModal?: (v: boolean) => void;
  setTargetUrl?: (v: string) => void;
  setSelectedModel?: (v: string) => void;
  setSelectedSource?: (v: string) => void;
  setVoiceActor?: (v: string) => void;
  setMusicTheme?: (v: string) => void;
  setAspectRatio?: (v: "auto" | "9:16" | "16:9") => void;
  setFrameRate?: (v: number) => void;
  addNotification?: (msg: string, type: any) => void;
  isAuthenticated?: boolean;
  authLoading?: boolean;
  isInitializing?: boolean;
  user?: any;
  voiceActor?: string;
  musicTheme?: string;
  aspectRatio?: "auto" | "9:16" | "16:9";
  frameRate?: number;
  isDirty?: boolean;
  projectId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  [key: string]: any;
}

const ROUTE_PREFETCH_MAP: Record<string, () => Promise<any>> = {
  "/": () => import("@/features/app_landing/pages/LandingPage"),
  "/landing": () => import("@/features/app_landing/pages/LandingPage"),
  "/login": () => import("@/features/app_auth/pages/LoginPage"),
  "/register": () => import("@/features/app_auth/pages/RegisterPage"),
  "/forgot-password": () => import("@/features/app_auth/pages/ForgotPasswordPage"),
  "/dashboard": () => import("@/features/app_dashboard/pages/DashboardPage"),
  "/projects": () => import("@/features/workspace_projects/pages/ProjectsPage"),
  "/scraper": () => import("@/features/workspace_scraper/pages/ScraperPage"),
  "/editor": () => import("@/features/editor_studio/pages/EditorPage"),
  "/shortcuts": () => import("@/features/app_shortcuts/pages/ShortcutsPage"),
  "/creative-suite": () => import("@/features/creative_suite/components/CreativeSuiteLayout"),
  "/creative-suite/ai-voice": () => import("@/features/creative_voice/pages/VoiceStudioPage"),
  "/creative-suite/ai-optimizer": () => import("@/features/creative_optimizer/pages/AIOptimizerPage"),
  "/creative-suite/panel-assistant": () => import("@/features/creative_panel_assistant/pages/PanelAssistantPage"),
  "/creative-suite/youtube": () => import("@/features/creative_youtube/pages/YouTubePage"),
  "/settings/account": () => import("@/features/user_settings/pages/SettingsAccountPage"),
  "/settings/audio": () => import("@/features/editor_audio/pages/AudioSettingsPage"),
  "/notifications": () => import("@/features/app_notification/pages/NotificationsPage"),
  "/profile": () => import("@/features/user_profile/pages/ProfilePage"),
  "/admin": () => import("@/features/system_admin/pages/AdminPage"),
  "/ai-core": () => import("@/features/ai_core/components/AICoreLayout"),
  "/video-editor": () => import("@/features/editor_video/pages/VideoEditorPage"),
  "/image-editor": () => import("@/features/editor_image/pages/ImageEditorPage"),
};

const prefetchedRoutes = new Set<string>();

export function prefetchRoute(path: string) {
  const cleanPath = path.split("?")[0].split("#")[0].toLowerCase();
  const loader =
    ROUTE_PREFETCH_MAP[cleanPath] ||
    Object.entries(ROUTE_PREFETCH_MAP).find(([k]) => cleanPath.startsWith(k))?.[1];
  if (loader && !prefetchedRoutes.has(cleanPath)) {
    prefetchedRoutes.add(cleanPath);
    loader().catch(() => {});
  }
}

export function useAppRouter(props?: UseAppRouterProps) {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });
  const propsRef = useRef<UseAppRouterProps | undefined>(props);
  propsRef.current = props;

  const [lastEditorPath, setLastEditorPath] = useState<string>("/editor/adjust?idx=0");
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ai_comic_theme") || "obsidian";
    }
    return "obsidian";
  });
  const [isPipMode, setIsPipMode] = useState<boolean>(false);

  // Sync visual theme with root HTML element
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", activeTheme);
      localStorage.setItem("ai_comic_theme", activeTheme);
    }
  }, [activeTheme]);

  // Sync settings and state URL query parameters on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    const modelParam = params.get("model");
    const sourceParam = params.get("source");

    if (urlParam && propsRef.current?.setTargetUrl) propsRef.current.setTargetUrl(urlParam);
    if (modelParam && propsRef.current?.setSelectedModel) propsRef.current.setSelectedModel(modelParam);
    if (sourceParam && propsRef.current?.setSelectedSource) propsRef.current.setSelectedSource(sourceParam);
  }, []);

  // Popstate and navigation listener (attached once on mount)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);

      if (path.includes("/editor")) {
        setLastEditorPath(path + window.location.search);
        const params = new URLSearchParams(window.location.search);
        const idxVal = params.get("idx");
        if (idxVal !== null && propsRef.current?.setEditingImageIdx) {
          const idx = parseInt(idxVal, 10);
          propsRef.current.setEditingImageIdx(isNaN(idx) ? 0 : idx);
        }
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      if (typeof window === "undefined") return;

      // Eagerly prefetch route bundle immediately
      prefetchRoute(path);

      let targetPath = path;
      if (propsRef.current?.isAuthenticated && (path === "/" || path === "" || path === "/index.html")) {
        targetPath = "/dashboard";
      }

      const current = window.location.pathname + window.location.search;
      if (current === targetPath) return;

      window.history.pushState({}, "", targetPath);
      const newPath = window.location.pathname;

      setCurrentPath(newPath);

      if (newPath.includes("/editor")) {
        setLastEditorPath(newPath + window.location.search);
        const params = new URLSearchParams(window.location.search);
        const idxVal = params.get("idx");
        if (idxVal !== null && propsRef.current?.setEditingImageIdx) {
          const idx = parseInt(idxVal, 10);
          propsRef.current.setEditingImageIdx(isNaN(idx) ? 0 : idx);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).navigateTo = navigateTo;
      (window as any).prefetchRoute = prefetchRoute;
      return () => {
        delete (window as any).navigateTo;
        delete (window as any).prefetchRoute;
      };
    }
  }, [navigateTo]);

  return {
    currentPath,
    lastEditorPath,
    activeTheme,
    setActiveTheme,
    isPipMode,
    setIsPipMode,
    navigateTo,
    prefetchRoute,
  };
}
