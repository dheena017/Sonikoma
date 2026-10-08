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
  "/": () => import("@/features/landing/pages/LandingPage"),
  "/landing": () => import("@/features/landing/pages/LandingPage"),
  "/login": () => import("@/features/auth/pages/LoginPage"),
  "/register": () => import("@/features/auth/pages/RegisterPage"),
  "/forgot-password": () =>
    import("@/features/auth/pages/ForgotPasswordPage"),
  "/auth-success": () => import("@/features/auth/pages/AuthSuccessPage"),
  "/auth/callback": () => import("@/features/auth/pages/AuthSuccessPage"),
  "/auth/redirect": () => import("@/features/auth/pages/AuthSuccessPage"),
  "/auth/google/callback": () =>
    import("@/features/auth/pages/AuthSuccessPage"),
  "/auth/launch": () => import("@/features/auth/pages/AuthSuccessPage"),
  "/dashboard": () => import("@/features/platform/dashboard/pages/DashboardPage"),
  "/projects": () => import("@/features/platform/projects/pages/ProjectsPage"),
  "/ai-series": () =>
    import("@/features/intelligence/series/pages/AISeriesStudioPage"),
  "/ai-series-studio": () =>
    import("@/features/intelligence/series/pages/AISeriesStudioPage"),
  "/studio/ai-series": () =>
    import("@/features/intelligence/series/pages/AISeriesStudioPage"),
  "/scraper": () => import("@/features/platform/scraper/pages/ScraperPage"),
  "/editor": () => import("@/features/workspace/shell/pages/EditorPage"),
  "/shortcuts": () => import("@/features/platform/shortcuts/pages/ShortcutsPage"),
  "/creative-suite": () =>
    import("@/features/creative/suite/components/CreativeSuiteLayout"),
  "/creative-suite/translation": () =>
    import("@/features/creative/translation/pages/TranslationPage"),
  "/translation": () =>
    import("@/features/creative/translation/pages/TranslationPage"),
  "/creative-suite/panel-assistant": () =>
    import("@/features/creative/translation/pages/TranslationPage"),
  "/creative-suite/youtube": () =>
    import("@/features/creative/youtube/pages/YouTubePage"),
  "/settings/account": () =>
    import("@/features/profile/settings/pages/SettingsAccountPage"),
  "/settings/audio": () =>
    import("@/features/video-editor/audio/pages/AudioSettingsPage"),
  "/notifications": () =>
    import("@/features/platform/notifications/pages/NotificationsPage"),
  "/profile": () => import("@/features/profile/pages/ProfilePage"),
  "/admin": () => import("@/features/admin/pages/AdminPage"),
  "/ai-core": () => import("@/features/intelligence/core/components/AICoreLayout"),
  "/video-editor": () =>
    import("@/features/video-editor/video/pages/VideoEditorPage"),
  "/image-editor": () =>
    import("@/features/image-editor/canvas/pages/ImageEditorPage"),
};

const prefetchedRoutes = new Set<string>();

export function prefetchRoute(path: string) {
  const cleanPath = path.split("?")[0].split("#")[0].toLowerCase();
  const loader =
    ROUTE_PREFETCH_MAP[cleanPath] ||
    Object.entries(ROUTE_PREFETCH_MAP).find(([k]) =>
      cleanPath.startsWith(k)
    )?.[1];
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

  const [lastEditorPath, setLastEditorPath] = useState<string>(
    "/editor/adjust?idx=0"
  );
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

  // Idle prefetch primary route code bundles for instantaneous (0ms) page switches
  useEffect(() => {
    if (typeof window === "undefined") return;
    const idleFn =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 1000));

    const id = idleFn(() => {
      const topRoutes = [
        "/dashboard",
        "/projects",
        "/ai-series",
        "/editor",
        "/scraper",
        "/creative-suite",
        "/profile",
        "/settings/account",
        "/shortcuts",
        "/notifications",
        "/ai-core",
      ];
      topRoutes.forEach((route, idx) => {
        setTimeout(() => {
          prefetchRoute(route);
        }, idx * 120);
      });
    });

    return () => {
      if ((window as any).cancelIdleCallback && typeof id === "number") {
        (window as any).cancelIdleCallback(id);
      }
    };
  }, []);

  // Sync settings and state URL query parameters on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    const modelParam = params.get("model");
    const sourceParam = params.get("source");

    if (urlParam && propsRef.current?.setTargetUrl)
      propsRef.current.setTargetUrl(urlParam);
    if (modelParam && propsRef.current?.setSelectedModel)
      propsRef.current.setSelectedModel(modelParam);
    if (sourceParam && propsRef.current?.setSelectedSource)
      propsRef.current.setSelectedSource(sourceParam);
  }, []);

  // Popstate, pushState, replaceState and navigation listener to ensure 100% sync between browser URL and visual state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;

    window.history.pushState = function (...args) {
      const result = originalPush.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplace.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
      return result;
    };

    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath((prev) => (prev !== path ? path : prev));

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
    window.addEventListener("locationchange", handleLocationChange);

    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("locationchange", handleLocationChange);
    };
  }, []);

  const navigateTo = useCallback((path: string) => {
    if (typeof window === "undefined") return;

    // Eagerly prefetch route bundle immediately
    prefetchRoute(path);

    let targetPath = path;
    if (
      propsRef.current?.isAuthenticated &&
      (path === "/" || path === "" || path === "/index.html")
    ) {
      targetPath = "/dashboard";
    }

    const current = window.location.pathname + window.location.search;
    if (current === targetPath) return;

    window.history.pushState({}, "", targetPath);
    const newPath = window.location.pathname;

    setCurrentPath(newPath);
    window.dispatchEvent(new Event("popstate"));
    window.dispatchEvent(new Event("locationchange"));

    if (newPath.includes("/editor")) {
      setLastEditorPath(newPath + window.location.search);
      const params = new URLSearchParams(window.location.search);
      const idxVal = params.get("idx");
      if (idxVal !== null && propsRef.current?.setEditingImageIdx) {
        const idx = parseInt(idxVal, 10);
        propsRef.current.setEditingImageIdx(isNaN(idx) ? 0 : idx);
      }
    }
  }, []);

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
