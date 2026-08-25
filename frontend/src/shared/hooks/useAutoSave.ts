import { useEffect, useRef, useState, useMemo } from "react";
import { GeneratedPanel } from "@/types";
import { useProjectStore } from "@/shared/hooks/useProjectStore";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutoSaveState {
  projectId: string | null;
  jobId?: string | null;
  setProjectId?: (id: string | null) => void;
  setJobId?: (id: string | null) => void;
  setSeriesSlug?: (slug: string | null) => void;
  setChapterSlug?: (slug: string | null) => void;
  seriesTitle?: string;
  chapterNumber?: string;
  chapterTitle?: string;
  scrapedGenre?: string;
  seriesAuthor?: string;
  seriesCoverImage?: string;
  seriesSynopsis?: string;
  panels?: GeneratedPanel[];
  scrapedImages?: string[];
  targetUrl?: string;
  fetchWithInterceptor?: typeof fetch;
  addNotification?: (message: string, type: any) => void;
  voiceActor?: string;
  musicTheme?: string;
  aspectRatio?: string;
  frameRate?: number;
  volume?: number;
  narrationVolume?: number;
  bgmVolume?: number;
  audioDucking?: boolean;
  speechRate?: number;
  speechPitch?: number;
  audioReactiveShake?: boolean;
  shakeIntensity?: string;
  videoFormat?: string;
  backgroundStyle?: string;
  subtitlesStyle?: string;
  [key: string]: any;
}

export function useAutoSave(state?: AutoSaveState, debounceMs = 1500) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPayloadRef = useRef<string>("");

  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const isDirty = useProjectStore((s) => s.isDirty);

  // Memoize snapshot to avoid redundant stringifies
  const currentSnapshot = useMemo(() => {
    if (!state) return "";
    return JSON.stringify({
      projectId: state.projectId ?? activeProjectId,
      title: state.seriesTitle?.trim(),
      panelsCount: state.panels?.length,
      voice: state.voiceActor,
      aspectRatio: state.aspectRatio,
      volume: state.volume,
    });
  }, [state, activeProjectId]);

  useEffect(() => {
    // Only auto-save if a project is active and changes were detected
    const targetId = state?.projectId ?? activeProjectId;
    if (!targetId || !currentSnapshot || currentSnapshot === lastSavedPayloadRef.current) {
      return;
    }

    // Skip auto-saving for temporary draft projects
    if (targetId.startsWith("temp_") || targetId.startsWith("draft_")) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const success = await useProjectStore.getState().saveActiveProject(state?.fetchWithInterceptor);
        if (success) {
          lastSavedPayloadRef.current = currentSnapshot;
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2500);
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error("[AutoSave] Background sync error:", err);
        setSaveStatus("error");
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentSnapshot, activeProjectId, isDirty, state?.fetchWithInterceptor, debounceMs]);

  const saveProject = async (
    overrideFetch?: typeof fetch,
    options?: {
      savingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
    },
    payloadOverrides?: any
  ) => {
    setSaveStatus("saving");
    try {
      const fetchClient = overrideFetch || state?.fetchWithInterceptor;
      const success = await useProjectStore.getState().saveActiveProject(fetchClient);
      if (success) {
        setSaveStatus("saved");
        if (options?.successMessage && state?.addNotification) {
          state.addNotification(options.successMessage, "success");
        }
        setTimeout(() => setSaveStatus("idle"), 2500);
        return true;
      } else {
        setSaveStatus("error");
        if (options?.errorMessage && state?.addNotification) {
          state.addNotification(options.errorMessage, "error");
        }
        return false;
      }
    } catch (err) {
      console.error("[AutoSave] Manual save error:", err);
      setSaveStatus("error");
      if (options?.errorMessage && state?.addNotification) {
        state.addNotification(options.errorMessage, "error");
      }
      return false;
    }
  };

  return { saveStatus, saveProject, isDirty };
}
