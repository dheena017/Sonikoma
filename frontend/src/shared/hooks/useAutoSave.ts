import { useState, useCallback } from "react";
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
  void debounceMs;
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const isDirty = useProjectStore((s) => s.isDirty);

  const saveProject = useCallback(
    async (
      overrideFetch?: typeof fetch,
      options?: {
        savingMessage?: string;
        successMessage?: string;
        errorMessage?: string;
      },
      payloadOverrides?: any
    ) => {
      void payloadOverrides;
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
        console.error("[ProjectSave] Manual save error:", err);
        setSaveStatus("error");
        if (options?.errorMessage && state?.addNotification) {
          state.addNotification(options.errorMessage, "error");
        }
        return false;
      }
    },
    [state?.fetchWithInterceptor, state?.addNotification]
  );

  return { saveStatus, saveProject, isDirty };
}
