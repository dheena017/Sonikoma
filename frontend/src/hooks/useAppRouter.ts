import React from "react";

interface UseAppRouterProps {
  scrapedImages: string[];
  panels: any[];
  editingImageIdx: number | null;
  setEditingImageIdx: (idx: number | null) => void;
  setShowAutoCropModal: (v: boolean) => void;
  setShowBubbleModal: (v: boolean) => void;
  setTargetUrl: (v: string) => void;
  setSelectedModel: (v: string) => void;
  setSelectedSource: (v: string) => void;
  setVoiceActor: (v: string) => void;
  setMusicTheme: (v: string) => void;
  setAspectRatio: (v: "9:16" | "16:9") => void;
  setFrameRate: (v: number) => void;
  addNotification: (
    msg: string,
    type: "success" | "info" | "warning" | "error",
    options?: {
      errorCode?: number;
      retryDelay?: number;
      onRetry?: () => void;
      details?: string;
      link?: string;
    }
  ) => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  isInitializing: boolean;
  voiceActor: string;
  musicTheme: string;
  aspectRatio: "9:16" | "16:9";
  frameRate: number;
  isDirty?: boolean;
  projectId: string | null;
  seriesSlug: string | null;
  chapterSlug: string | null;
}

export function useAppRouter({
  scrapedImages,
  panels,
  editingImageIdx,
  setEditingImageIdx,
  setShowAutoCropModal,
  setShowBubbleModal,
  setTargetUrl,
  setSelectedModel,
  setSelectedSource,
  setVoiceActor,
  setMusicTheme,
  setAspectRatio,
  setFrameRate,
  addNotification,
  isAuthenticated,
  authLoading,
  isInitializing,
  voiceActor,
  musicTheme,
  aspectRatio,
  frameRate,
  isDirty = false,
  projectId,
  seriesSlug,
  chapterSlug,
}: UseAppRouterProps) {
  const [currentPath, setCurrentPath] = React.useState(
    window.location.pathname
  );
  const [lastEditorPath, setLastEditorPath] = React.useState<string>(
    "/editor/adjust?idx=0"
  );
  const [activeTheme, setActiveTheme] = React.useState<string>(
    () => localStorage.getItem("ai_comic_theme") || "obsidian"
  );
  const [isPipMode, setIsPipMode] = React.useState<boolean>(false);

  // Use refs for unstable dependencies to prevent redundant effect re-runs
  const scrapedImagesRef = React.useRef(scrapedImages);
  const panelsRef = React.useRef(panels);
  const editingImageIdxRef = React.useRef(editingImageIdx);

  React.useEffect(() => {
    scrapedImagesRef.current = scrapedImages;
  }, [scrapedImages]);

  React.useEffect(() => {
    panelsRef.current = panels;
  }, [panels]);

  React.useEffect(() => {
    editingImageIdxRef.current = editingImageIdx;
  }, [editingImageIdx]);

  // Sync visual theme with root html element
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
    localStorage.setItem("ai_comic_theme", activeTheme);
  }, [activeTheme]);

  // Sync settings and state URL parameters on load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    const modelParam = params.get("model");
    const sourceParam = params.get("source");

    if (urlParam) setTargetUrl(urlParam);
    if (modelParam) setSelectedModel(modelParam);
    if (sourceParam) setSelectedSource(sourceParam);

    const stateHash = params.get("state");
    if (stateHash) {
      try {
        const decoded = JSON.parse(atob(stateHash));
        if (decoded.url) setTargetUrl(decoded.url);
        if (decoded.voice) setVoiceActor(decoded.voice);
        if (decoded.music) setMusicTheme(decoded.music);
        if (decoded.aspectRatio) setAspectRatio(decoded.aspectRatio);
        if (decoded.fps) setFrameRate(decoded.fps);
        if (decoded.model) setSelectedModel(decoded.model);
        if (decoded.source) setSelectedSource(decoded.source);
        addNotification(
          "Workspace session state restored successfully!",
          "success"
        );
      } catch (e) {
        console.error("Failed to decode session state hash:", e);
      }
    }
  }, []);

  // Core router change listener with equality guards
  React.useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);

      // Root redirect logic
      if (!isInitializing && !authLoading) {
        if (!isAuthenticated) {
          const isProtectedRoute =
            path === "/dashboard" ||
            path === "/workspace" ||
            path === "/settings" ||
            path === "/logs" ||
            path === "/status" ||
            path === "/ai-models" ||
            path === "/shortcuts" ||
            path === "/ai-optimizer" ||
            path === "/panel-assistant" ||
            path === "/ai-characters" ||
            path === "/ai-translation" ||
            path === "/ai-audio-lab" ||
            path === "/ai-thumbnails" ||
            path === "/ai-engagement" ||
            path === "/ai-voice" ||
            path === "/ai-analytics" ||
            path === "/youtube" ||
            path === "/profile" ||
            path === "/notifications" ||
            path === "/auto-crop" ||
            path === "/bubble-cleaner" ||
            path === "/projects" ||
            path === "/project-details" ||
            path === "/project-editor" ||
            path === "/new-series" ||
            path.startsWith("/series/") ||
            path.startsWith("/editor");

          if (isProtectedRoute) {
            window.history.replaceState({}, "", "/");
            setCurrentPath("/");
            return;
          }
        } else {
          if (
            path === "/" ||
            path === "" ||
            path === "/index.html" ||
            path === "/landing" ||
            path === "/login" ||
            path === "/register"
          ) {
            const activeProjId =
              localStorage.getItem("active_project_id") || projectId;
            const activeSeriesSlug =
              localStorage.getItem("active_series_slug") || seriesSlug;
            const activeChapterSlug =
              localStorage.getItem("active_chapter_slug") || chapterSlug;
            let target = "/dashboard";
            if (activeProjId) {
              if (activeSeriesSlug && activeChapterSlug) {
                target = `/series/${activeSeriesSlug}/chapters/${activeChapterSlug}`;
              } else {
                target = `/workspace?id=${activeProjId}`;
              }
            }
            window.history.replaceState({}, "", target);
            setCurrentPath(target);
            return;
          }
        }
      }

      const isSeriesPath = path.startsWith("/series/");
      const isChapterDetails = isSeriesPath && path.endsWith("/details");
      const isWorkspacePath =
        path === "/workspace" || (isSeriesPath && !isChapterDetails);

      if (
        path === "/settings" ||
        path === "/logs" ||
        path === "/status" ||
        path === "/ai-models" ||
        path === "/shortcuts" ||
        path === "/ai-optimizer" ||
        path === "/panel-assistant" ||
        path === "/ai-characters" ||
        path === "/ai-translation" ||
        path === "/ai-audio-lab" ||
        path === "/ai-thumbnails" ||
        path === "/ai-engagement" ||
        path === "/ai-voice" ||
        path === "/ai-analytics" ||
        path === "/youtube" ||
        path === "/profile" ||
        path === "/notifications" ||
        path === "/projects" ||
        path === "/project-details" ||
        path === "/dashboard" ||
        path === "/new-series" ||
        path.startsWith("/display") ||
        isChapterDetails
      ) {
        setShowAutoCropModal(false);
        setShowBubbleModal(false);
        setEditingImageIdx(null);
      } else if (path === "/project-editor") {
        const params = new URLSearchParams(window.location.search);
        const hasProjId = params.has("id") || params.has("project_id");
        if (scrapedImagesRef.current.length === 0 && panelsRef.current.length === 0 && !hasProjId) {
          window.history.replaceState({}, "", "/dashboard");
          setCurrentPath("/dashboard");
          return;
        }
        setShowAutoCropModal(false);
        setShowBubbleModal(false);
        setEditingImageIdx(null);
      } else if (path === "/auto-crop") {
        setShowAutoCropModal(true);
        setShowBubbleModal(false);
        setEditingImageIdx(null);
      } else if (path === "/bubble-cleaner") {
        setShowAutoCropModal(false);
        setShowBubbleModal(true);
        setEditingImageIdx(null);
      } else if (path.startsWith("/editor")) {
        const params = new URLSearchParams(window.location.search);
        const hasProjId = params.has("id") || params.has("project_id");
        if (scrapedImagesRef.current.length === 0 && panelsRef.current.length === 0 && !hasProjId) {
          window.history.replaceState({}, "", "/dashboard");
          setCurrentPath("/dashboard");
          return;
        }
        setIsPipMode(false);
        setLastEditorPath(path + window.location.search);
        setShowAutoCropModal(false);
        setShowBubbleModal(false);

        // Parse idx query parameter
        const idxVal = params.get("idx");
        const idx = idxVal !== null ? parseInt(idxVal) : 0;
        const validatedIdx = isNaN(idx) ? 0 : idx;
        if (editingImageIdxRef.current !== validatedIdx) {
          setEditingImageIdx(validatedIdx);
        }
      } else {
        // Dashboard
        setShowAutoCropModal(false);
        setShowBubbleModal(false);
        setEditingImageIdx(null);
      }
    };

    // Run router on mount to sync initial page route
    handleLocationChange();

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [
    isAuthenticated,
    authLoading,
    isInitializing,
  ]);

  const navigateTo = React.useCallback(
    (path: string) => {
      let targetPath = path;
      if (
        isAuthenticated &&
        (path === "/" || path === "" || path === "/index.html")
      ) {
        const activeProjId =
          localStorage.getItem("active_project_id") || projectId;
        const activeSeriesSlug =
          localStorage.getItem("active_series_slug") || seriesSlug;
        const activeChapterSlug =
          localStorage.getItem("active_chapter_slug") || chapterSlug;
        if (activeProjId) {
          if (activeSeriesSlug && activeChapterSlug) {
            targetPath = `/series/${activeSeriesSlug}/chapters/${activeChapterSlug}`;
          } else {
            targetPath = `/workspace?id=${activeProjId}`;
          }
        } else {
          targetPath = "/dashboard";
        }
      }

      if (window.location.pathname === targetPath) {
        return;
      }

      window.history.pushState({}, "", targetPath);
      window.dispatchEvent(new Event("popstate"));
    },
    [isAuthenticated, projectId, seriesSlug, chapterSlug]
  );

  React.useEffect(() => {
    (window as any).navigateTo = navigateTo;
    return () => {
      delete (window as any).navigateTo;
    };
  }, [navigateTo]);

  return {
    currentPath,
    lastEditorPath,
    activeTheme,
    setActiveTheme,
    isPipMode,
    setIsPipMode,
    navigateTo,
  };
}
