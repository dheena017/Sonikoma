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

export function useAppRouter(props?: UseAppRouterProps) {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });

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

    if (urlParam && props?.setTargetUrl) props.setTargetUrl(urlParam);
    if (modelParam && props?.setSelectedModel) props.setSelectedModel(modelParam);
    if (sourceParam && props?.setSelectedSource) props.setSelectedSource(sourceParam);
  }, []);

  // Popstate and navigation listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);

      if (path.includes("/editor")) {
        setLastEditorPath(path + window.location.search);
        const params = new URLSearchParams(window.location.search);
        const idxVal = params.get("idx");
        if (idxVal !== null && props?.setEditingImageIdx) {
          const idx = parseInt(idxVal, 10);
          props.setEditingImageIdx(isNaN(idx) ? 0 : idx);
        }
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, [props]);

  const navigateTo = useCallback(
    (path: string) => {
      if (typeof window === "undefined") return;

      let targetPath = path;
      if (props?.isAuthenticated && (path === "/" || path === "" || path === "/index.html")) {
        targetPath = "/dashboard";
      }

      const current = window.location.pathname + window.location.search;
      if (current === targetPath) return;

      window.history.pushState({}, "", targetPath);
      setCurrentPath(window.location.pathname);
      window.dispatchEvent(new Event("popstate"));
    },
    [props?.isAuthenticated]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).navigateTo = navigateTo;
      return () => {
        delete (window as any).navigateTo;
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
  };
}
