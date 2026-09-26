import { useState, useCallback, useRef } from "react";
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
  const stateRef = useRef(state);
  stateRef.current = state;

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
        const fetchClient =
          overrideFetch || stateRef.current?.fetchWithInterceptor;

        // Ensure activeProjectData retains its own scrapedImages and only backfills if currently empty
        const curData = useProjectStore.getState().activeProjectData;
        const curImgs = curData?.scrapedImages;
        const localImgs = stateRef.current?.scrapedImages;
        const localProjId = stateRef.current?.projectId;

        if (
          curData &&
          (!curImgs || curImgs.length === 0) &&
          localImgs &&
          localImgs.length > 0 &&
          (!localProjId || localProjId === curData.project.project_id)
        ) {
          useProjectStore.getState().setActiveProject({
            ...curData,
            scrapedImages: localImgs,
            project: {
              ...curData.project,
              imported_assets_count: localImgs.length,
            },
          });
        }

        const success = await useProjectStore
          .getState()
          .saveActiveProject(fetchClient);
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
