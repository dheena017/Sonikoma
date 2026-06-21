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
  const [pendingNavigationPath, setPendingNavigationPath] = React.useState<
    string | null
  >(null);

  // Sync visual theme with root html element
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
    localStorage.setItem("ai_comic_theme", activeTheme);
  }, [activeTheme]);

  // Browser refresh/close/unload warning for unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        const msg = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

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
            path === "/settings" ||
            path === "/logs" ||
            path === "/status" ||
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
            path === "/profile" ||
            path === "/notifications" ||
            path === "/auto-crop" ||
            path === "/bubble-cleaner" ||
            path === "/project-details" ||
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
            window.history.replaceState({}, "", "/dashboard");
            setCurrentPath("/dashboard");
            return;
          }
        }
      }

      const isSeriesPath = path.startsWith("/series/");
      const isChapterDetails = isSeriesPath && path.endsWith("/details");
      const isWorkspacePath = path === "/dashboard" || (isSeriesPath && !isChapterDetails);

      if (
        path === "/settings" ||
        path === "/logs" ||
        path === "/status" ||
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
        path === "/profile" ||
        path === "/notifications" ||
        path === "/project-details" ||
        isChapterDetails
      ) {
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
        if (scrapedImages.length === 0 && panels.length === 0) {
          window.history.replaceState({}, "", "/dashboard");
          setCurrentPath("/dashboard");
          return;
        }
        setIsPipMode(false);
        setLastEditorPath(path + window.location.search);
        setShowAutoCropModal(false);
        setShowBubbleModal(false);

        // Parse idx query parameter
        const params = new URLSearchParams(window.location.search);
        const idxVal = params.get("idx");
        const idx = idxVal !== null ? parseInt(idxVal) : 0;
        const validatedIdx = isNaN(idx) ? 0 : idx;
        if (editingImageIdx !== validatedIdx) {
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
    scrapedImages,
    panels,
    editingImageIdx,
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
        targetPath = "/dashboard";
      }

      if (window.location.pathname === targetPath) {
        return;
      }

      const isCurrentlyEditor = window.location.pathname.startsWith("/editor");
      const isTargetingEditor = targetPath.startsWith("/editor");
      const isEditorDirty =
        !isDirty &&
        isCurrentlyEditor &&
        !isTargetingEditor &&
        (window as any).editorHasUnsavedChanges?.();

      if (isDirty || isEditorDirty) {
        setPendingNavigationPath(targetPath);
        return;
      }

      window.history.pushState({}, "", targetPath);
      window.dispatchEvent(new Event("popstate"));
    },
    [isAuthenticated, isDirty]
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
    pendingNavigationPath,
    setPendingNavigationPath,
  };
}
