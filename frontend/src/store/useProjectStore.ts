import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WorkspaceContext {
  projectId: string | null;
  seriesId?: string | null;
  chapterId?: string | null;
  jobId: string | null;
}

export interface ProjectMetadata {
  project_id: string;
  series_id?: string | null;
  chapter_id?: string | null;
  job_id?: string | null;
  title: string;
  url: string;
  video_url?: string | null;
  series_slug?: string | null;
  chapter_slug?: string | null;
  author?: string | null;
  cover_image?: string | null;
  first_panel_image?: string | null;
  synopsis?: string | null;
  genre?: string | null;
  episode?: string | null;
  audio_settings?: any;
  status?: string;
  created_at?: string;
  panels_count?: number;
  imported_assets_count?: number;
  [key: string]: any;
}

export interface ActiveProjectData {
  project: ProjectMetadata;
  panels: any[];
  scrapedImages?: string[];
}

export type ProjectStateMode = "idle" | "loading" | "active" | "missing";

export interface MissingProjectDetails {
  missingId: string;
  isJobId: boolean;
  attemptedAt: string;
}

export interface ProjectStoreState {
  activeProjectId: string | null;
  activeProjectData: ActiveProjectData | null;
  projectState: ProjectStateMode;
  missingProjectInfo: MissingProjectDetails | null;
  isDrawerOpen: boolean;
  isDirty: boolean;
  isHydrating: boolean;

  setActiveProjectId: (id: string | null) => void;
  setActiveProject: (data: ActiveProjectData | null) => void;
  setProjectLoading: () => void;
  setProjectMissing: (
    missingId: string,
    options?: { isJobId?: boolean }
  ) => void;
  setWorkspaceContext: (ctx: WorkspaceContext) => void;
  hydrateActiveProject: (
    id?: string | null,
    fetchClient?: any
  ) => Promise<void>;
  clearActiveProject: () => void;
  setDrawerOpen: (open: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  isEpisodeCollapsed: boolean;
  setIsEpisodeCollapsed: (v: boolean) => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      activeProjectId: null,
      activeProjectData: null,
      projectState: "idle",
      missingProjectInfo: null,
      isDrawerOpen: false,
      isDirty: false,
      isHydrating: false,

      setActiveProjectId: (id) =>
        set((state) => {
          if (state.activeProjectId === id) return state;
          if (!id) {
            return {
              activeProjectId: null,
              activeProjectData: null,
              projectState: "idle",
              missingProjectInfo: null,
            };
          }
          return {
            activeProjectId: id,
            projectState:
              state.activeProjectData?.project?.project_id === id
                ? "active"
                : "loading",
          };
        }),

      setActiveProject: (data) =>
        set({
          activeProjectData: data
            ? {
                ...data,
                project: {
                  ...data.project,
                  panels_count:
                    data.project?.panels_count ?? data.panels?.length ?? 0,
                  imported_assets_count:
                    data.project?.imported_assets_count ??
                    data.scrapedImages?.length ??
                    (Array.isArray(data.project?.audio_settings?.scraped_images)
                      ? data.project.audio_settings.scraped_images.length
                      : 0),
                },
              }
            : null,
          activeProjectId: data?.project?.project_id ?? null,
          projectState: data ? "active" : "idle",
          missingProjectInfo: null,
          isHydrating: false,
        }),

      setProjectLoading: () =>
        set({
          projectState: "loading",
          isHydrating: true,
        }),

      setProjectMissing: (missingId: string, options?: { isJobId?: boolean }) =>
        set({
          projectState: "missing",
          missingProjectInfo: {
            missingId,
            isJobId: options?.isJobId ?? missingId.startsWith("job_"),
            attemptedAt: new Date().toISOString(),
          },
          isHydrating: false,
        }),

      setWorkspaceContext: (ctx: WorkspaceContext) =>
        set((state) => {
          if (!ctx.projectId) {
            return { activeProjectId: null, activeProjectData: null };
          }
          const cur = state.activeProjectData;
          const projectChanged = cur?.project?.project_id !== ctx.projectId;
          return {
            activeProjectId: ctx.projectId,
            activeProjectData: {
              project: {
                ...(cur?.project ?? { title: "", url: "" }),
                project_id: ctx.projectId,
                series_id: ctx.seriesId ?? cur?.project?.series_id ?? null,
                chapter_id: ctx.chapterId ?? cur?.project?.chapter_id ?? null,
                job_id: ctx.jobId ?? null,
              },
              panels: projectChanged ? [] : cur?.panels ?? [],
              scrapedImages: projectChanged ? [] : cur?.scrapedImages ?? [],
            },
          };
        }),

      hydrateActiveProject: async (
        targetId?: string | null,
        fetchClient?: any
      ) => {
        const idToHydrate = targetId ?? get().activeProjectId;
        if (!idToHydrate) {
          set({
            activeProjectData: null,
            projectState: "idle",
            missingProjectInfo: null,
            isHydrating: false,
          });
          return;
        }

        // ⚠️ IMPORTANT: Do NOT write idToHydrate to activeProjectId here.
        // activeProjectId is reserved for confirmed real project UUIDs only.
        // A job_ ID or stale slug must never pollute it.
        set({ isHydrating: true, projectState: "loading" });

        try {
          const fetcher = fetchClient || window.fetch;
          const token =
            localStorage.getItem("sonikoma_token") ||
            sessionStorage.getItem("sonikoma_token") ||
            "";

          const res = await fetcher(
            `/api/projects/${encodeURIComponent(idToHydrate)}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );

          if (!res.ok) {
            console.error(
              `Failed to hydrate project ${idToHydrate}: status ${res.status}`
            );
            get().setProjectMissing(idToHydrate, {
              isJobId: idToHydrate.startsWith("job_"),
            });
            return;
          }

          const json = await res.json();

          const projectRaw: Record<string, any> =
            json.project ?? json.data ?? json;

          if (!projectRaw || (!projectRaw.project_id && !projectRaw.title)) {
            get().setProjectMissing(idToHydrate, {
              isJobId: idToHydrate.startsWith("job_"),
            });
            return;
          }

          const panelsRaw: any[] = json.panels ?? projectRaw.panels ?? [];
          const scrapedImagesRaw: string[] =
            json.scraped_images ?? json.scrapedImages ?? [];

          const audioSettings = projectRaw.audio_settings || {};
          let importedCount =
            projectRaw.imported_assets_count ??
            (Array.isArray(audioSettings?.scraped_images)
              ? audioSettings.scraped_images.length
              : 0);
          if (!importedCount && scrapedImagesRaw.length > 0) {
            importedCount = scrapedImagesRaw.length;
          }

          const projectMeta: ProjectMetadata = {
            project_id: projectRaw.project_id || idToHydrate,
            series_id: projectRaw.series_id || null,
            chapter_id: projectRaw.chapter_id || projectRaw.project_id || null,
            job_id: projectRaw.job_id ?? null,
            title: projectRaw.title || "Untitled Project",
            url: projectRaw.url || "",
            video_url: projectRaw.video_url || null,
            series_slug: projectRaw.series_slug || null,
            chapter_slug: projectRaw.chapter_slug || null,
            author: projectRaw.author || null,
            cover_image:
              projectRaw.cover_image ||
              projectRaw.first_panel_image ||
              panelsRaw[0]?.image_url ||
              null,
            first_panel_image:
              projectRaw.first_panel_image || panelsRaw[0]?.image_url || null,
            synopsis: projectRaw.synopsis || null,
            genre: projectRaw.genre || null,
            episode: projectRaw.episode || null,
            audio_settings: projectRaw.audio_settings || null,
            status: projectRaw.status || "Ready",
            created_at:
              projectRaw.created_at || projectRaw.updated_at || undefined,
            panels_count: projectRaw.panels_count ?? panelsRaw.length ?? 0,
            imported_assets_count: importedCount,
          };

          set({
            activeProjectId: projectMeta.project_id,
            activeProjectData: {
              project: projectMeta,
              panels: panelsRaw,
              scrapedImages: scrapedImagesRaw,
            },
            projectState: "active",
            missingProjectInfo: null,
            isHydrating: false,
          });
        } catch (err) {
          console.error("Error in hydrateActiveProject:", err);
          get().setProjectMissing(idToHydrate, {
            isJobId: idToHydrate.startsWith("job_"),
          });
        }
      },

      clearActiveProject: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("active_project_id");
          localStorage.removeItem("active_job_id");
          localStorage.removeItem("active_series_slug");
          localStorage.removeItem("active_chapter_slug");
        }
        set({
          activeProjectId: null,
          activeProjectData: null,
          projectState: "idle",
          missingProjectInfo: null,
          isDirty: false,
          isHydrating: false,
        });
      },

      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      setIsDirty: (dirty) => set({ isDirty: dirty }),

      isEpisodeCollapsed: false,
      setIsEpisodeCollapsed: (v: boolean) => set({ isEpisodeCollapsed: v }),
    }),
    {
      name: "sonikoma-active-project-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        activeProjectData: state.activeProjectData,
      }),
    }
  )
);
